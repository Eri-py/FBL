// backend/src/services/scraperIntegration.ts
// Integration service to process scraped data and update database

import prisma from "../lib/prima";

type CompletedMatch = {
  tournament: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: string;
  awayScore: string;
  date: string;
  winner: string;
};

type DayResult = {
  date: string;
  dateScraped: Date;
  matches: CompletedMatch[];
};

type ProcessingResult = {
  matchesProcessed: number;
  pointsAwarded: number;
  playersNotFound: string[];
  newMatchesCreated: number;
  errors: string[];
};

// Points system
const POINTS = {
  WIN: 100,
  // Future: can add bonus points for tournament types
};

/**
 * Get all already scraped dates from database
 */
export async function getScrapedDates(): Promise<string[]> {
  const scrapedDates = await prisma.scrapedDate.findMany({
    select: { date: true },
    orderBy: { date: "desc" },
  });

  return scrapedDates.map((sd) => sd.date);
}

/**
 * Save scraped dates to database to prevent re-scraping
 */
export async function saveScrapedDates(dates: string[]): Promise<void> {
  for (const date of dates) {
    await prisma.scrapedDate.upsert({
      where: { date },
      update: { scrapedAt: new Date() },
      create: {
        date,
        scrapedAt: new Date(),
      },
    });
  }
}

/**
 * Find player in database by name with fuzzy matching
 * Returns player ID or null if not found
 */
async function findPlayerByName(scrapedName: string): Promise<string | null> {
  // First: Exact match (case insensitive)
  const exactMatch = await prisma.player.findFirst({
    where: {
      name: {
        equals: scrapedName,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });

  if (exactMatch) return exactMatch.id;

  // Second: Contains match
  const containsMatch = await prisma.player.findFirst({
    where: {
      name: {
        contains: scrapedName,
        mode: "insensitive",
      },
    },
    select: { id: true, name: true },
  });

  if (containsMatch) {
    console.log(`  Fuzzy matched: "${scrapedName}" -> "${containsMatch.name}"`);
    return containsMatch.id;
  }

  // Third: Reverse contains (scraped name contains db name)
  const allPlayers = await prisma.player.findMany({
    select: { id: true, name: true },
  });

  const reverseMatch = allPlayers.find((p) =>
    scrapedName.toLowerCase().includes(p.name.toLowerCase())
  );

  if (reverseMatch) {
    console.log(`  Reverse matched: "${scrapedName}" -> "${reverseMatch.name}"`);
    return reverseMatch.id;
  }

  return null;
}

/**
 * Process scraped matches and update database
 */
export async function processScrapeResults(dayResults: DayResult[]): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    matchesProcessed: 0,
    pointsAwarded: 0,
    playersNotFound: [],
    newMatchesCreated: 0,
    errors: [],
  };

  const playersNotFoundSet = new Set<string>();

  for (const dayResult of dayResults) {
    console.log(`\nProcessing matches for ${dayResult.date}...`);

    for (const match of dayResult.matches) {
      try {
        // Find winner in database
        const winnerId = await findPlayerByName(match.winner);

        if (!winnerId) {
          console.log(`  Winner not found in database: ${match.winner}`);
          playersNotFoundSet.add(match.winner);
          continue;
        }

        // Create or find match record
        const matchRecord = await prisma.match.upsert({
          where: {
            // Composite unique: name + date
            name_date: {
              name: match.tournament,
              date: new Date(dayResult.dateScraped.toDateString()),
            },
          },
          update: {},
          create: {
            name: match.tournament,
            date: new Date(dayResult.dateScraped.toDateString()),
          },
        });

        if (!matchRecord) {
          result.errors.push(`Failed to create match: ${match.tournament} on ${dayResult.date}`);
          continue;
        }

        result.newMatchesCreated++;

        // Award points to winner
        await prisma.playerScore.upsert({
          where: {
            matchId_playerId: {
              matchId: matchRecord.id,
              playerId: winnerId,
            },
          },
          update: {
            points: {
              increment: POINTS.WIN,
            },
          },
          create: {
            matchId: matchRecord.id,
            playerId: winnerId,
            points: POINTS.WIN,
          },
        });

        result.matchesProcessed++;
        result.pointsAwarded += POINTS.WIN;

        console.log(
          `  Awarded ${POINTS.WIN} points to ${match.winner} for winning against ${
            match.homeTeam === match.winner ? match.awayTeam : match.homeTeam
          }`
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.errors.push(`Error processing match ${match.tournament}: ${errorMessage}`);
        console.error(`  Error: ${errorMessage}`);
      }
    }
  }

  result.playersNotFound = Array.from(playersNotFoundSet);

  return result;
}

/**
 * Get list of unique player names from recent scrape
 * Use this to update your seed data
 */
export async function extractUniquePlayerNames(dayResults: DayResult[]): Promise<string[]> {
  const playerNames = new Set<string>();

  for (const dayResult of dayResults) {
    for (const match of dayResult.matches) {
      playerNames.add(match.homeTeam);
      playerNames.add(match.awayTeam);
    }
  }

  return Array.from(playerNames).sort();
}

/**
 * Generate a report of players in scrape vs players in database
 */
export async function generatePlayerMatchReport(dayResults: DayResult[]): Promise<{
  inDatabase: string[];
  notInDatabase: string[];
  totalUnique: number;
}> {
  const scrapedPlayers = await extractUniquePlayerNames(dayResults);
  const dbPlayers = await prisma.player.findMany({
    select: { name: true },
  });

  const dbPlayerNames = new Set(dbPlayers.map((p) => p.name.toLowerCase()));

  const inDatabase: string[] = [];
  const notInDatabase: string[] = [];

  for (const player of scrapedPlayers) {
    if (dbPlayerNames.has(player.toLowerCase())) {
      inDatabase.push(player);
    } else {
      notInDatabase.push(player);
    }
  }

  return {
    inDatabase,
    notInDatabase,
    totalUnique: scrapedPlayers.length,
  };
}

/**
 * Main integration function
 * Call this after scraping is complete
 */
export async function integrateScrapedData(
  dayResults: DayResult[],
  scrapedDates: string[]
): Promise<{
  success: boolean;
  message: string;
  processingResult: ProcessingResult;
  playerReport: {
    inDatabase: string[];
    notInDatabase: string[];
    totalUnique: number;
  };
}> {
  try {
    console.log("\nStarting data integration...");
    console.log("=".repeat(50));

    // 1. Save scraped dates to prevent re-scraping
    await saveScrapedDates(scrapedDates);
    console.log(`Saved ${scrapedDates.length} dates to database`);

    // 2. Generate player match report
    const playerReport = await generatePlayerMatchReport(dayResults);
    console.log("\nPlayer Match Report:");
    console.log(`Total unique players in scrape: ${playerReport.totalUnique}`);
    console.log(`Players in database: ${playerReport.inDatabase.length}`);
    console.log(`Players NOT in database: ${playerReport.notInDatabase.length}`);

    if (playerReport.notInDatabase.length > 0) {
      console.log("\nPlayers not found in database:");
      playerReport.notInDatabase.forEach((name) => {
        console.log(`  - ${name}`);
      });
      console.log("\nConsider adding these players to your seed data or database.");
    }

    // 3. Process matches and award points
    console.log("\nProcessing matches...");
    const processingResult = await processScrapeResults(dayResults);

    console.log("\n" + "=".repeat(50));
    console.log("INTEGRATION SUMMARY");
    console.log("=".repeat(50));
    console.log(`Matches processed: ${processingResult.matchesProcessed}`);
    console.log(`New match records created: ${processingResult.newMatchesCreated}`);
    console.log(`Points awarded: ${processingResult.pointsAwarded}`);
    console.log(`Players not found: ${processingResult.playersNotFound.length}`);
    console.log(`Errors: ${processingResult.errors.length}`);

    if (processingResult.errors.length > 0) {
      console.log("\nErrors encountered:");
      processingResult.errors.forEach((err) => console.log(`  - ${err}`));
    }

    return {
      success: true,
      message: "Integration completed successfully",
      processingResult,
      playerReport,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Integration error:", errorMessage);

    return {
      success: false,
      message: `Integration failed: ${errorMessage}`,
      processingResult: {
        matchesProcessed: 0,
        pointsAwarded: 0,
        playersNotFound: [],
        newMatchesCreated: 0,
        errors: [errorMessage],
      },
      playerReport: {
        inDatabase: [],
        notInDatabase: [],
        totalUnique: 0,
      },
    };
  }
}
