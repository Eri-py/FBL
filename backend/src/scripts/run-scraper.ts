import { scrapeCompletedMatches } from "./scraping";
import prisma from "../lib/prima";

const POINTS = {
  WIN: 100,
};

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

async function getScrapedDates(): Promise<string[]> {
  const scrapedDates = await prisma.scrapedDate.findMany({
    select: { date: true },
    orderBy: { date: "desc" },
  });

  return scrapedDates.map((sd) => sd.date);
}

async function saveScrapedDates(dates: string[]): Promise<void> {
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
    select: { id: true, name: true },
  });

  if (exactMatch) {
    console.log(`  Exact match: "${scrapedName}" -> "${exactMatch.name}"`);
    return exactMatch.id;
  }

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
 * Extract unique player names from scraped matches
 */
async function extractUniquePlayerNames(dayResults: DayResult[]): Promise<string[]> {
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
async function generatePlayerMatchReport(dayResults: DayResult[]): Promise<{
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
 * Process scraped matches and award points to existing players only
 */
async function processScrapeResults(dayResults: DayResult[]) {
  const result = {
    matchesProcessed: 0,
    pointsAwarded: 0,
    playersNotFound: [] as string[],
    newMatchesCreated: 0,
    errors: [] as string[],
  };

  const playersNotFoundSet = new Set<string>();

  for (const dayResult of dayResults) {
    console.log(`\nProcessing matches for ${dayResult.date}...`);

    for (const match of dayResult.matches) {
      try {
        // Find winner in database - NO AUTO-CREATION
        const winnerId = await findPlayerByName(match.winner);

        if (!winnerId) {
          console.log(`  Winner not found in database: ${match.winner}`);
          playersNotFoundSet.add(match.winner);
          continue; // Skip this match entirely
        }

        // Also check if both players exist (for completeness)
        const homePlayerId = await findPlayerByName(match.homeTeam);
        const awayPlayerId = await findPlayerByName(match.awayTeam);

        if (!homePlayerId) {
          console.log(`  Home player not found: ${match.homeTeam}`);
          playersNotFoundSet.add(match.homeTeam);
        }

        if (!awayPlayerId) {
          console.log(`  Away player not found: ${match.awayTeam}`);
          playersNotFoundSet.add(match.awayTeam);
        }

        // Create or find match record
        const matchRecord = await prisma.match.upsert({
          where: {
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

        console.log(`  Awarded ${POINTS.WIN} points to ${match.winner}`);
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

async function main() {
  console.log("Fantasy Badminton - Automated Scoring System");
  console.log("=".repeat(50));
  console.log("Note: Players are NOT auto-created. Missing players will be logged.");
  console.log();

  try {
    console.log("Step 1: Checking for already scraped dates...");
    const alreadyScraped = await getScrapedDates();
    console.log(`Found ${alreadyScraped.length} previously scraped dates`);
    console.log();

    console.log("Step 2: Starting Flashscore scraper...");
    const scrapeResult = await scrapeCompletedMatches(alreadyScraped);

    if (!scrapeResult.scrapedDates || scrapeResult.scrapedDates.length === 0) {
      console.log("\nNo new dates scraped. Exiting.");
      await prisma.$disconnect();
      return;
    }

    console.log();
    console.log("=".repeat(50));
    console.log("SCRAPE COMPLETE");
    console.log("=".repeat(50));
    console.log(`Total matches found: ${scrapeResult.totalMatches}`);
    console.log(`New dates scraped: ${scrapeResult.scrapedDates.length}`);
    console.log();

    // Save scraped dates to prevent re-scraping
    await saveScrapedDates(scrapeResult.scrapedDates);
    console.log(`Saved ${scrapeResult.scrapedDates.length} dates to database`);

    // Generate player report
    const playerReport = await generatePlayerMatchReport(scrapeResult.dayResults);
    console.log("\n" + "=".repeat(50));
    console.log("PLAYER ANALYSIS REPORT");
    console.log("=".repeat(50));
    console.log(`Total unique players in scrape: ${playerReport.totalUnique}`);
    console.log(`Players already in database: ${playerReport.inDatabase.length}`);
    console.log(`Players NOT in database: ${playerReport.notInDatabase.length}`);

    if (playerReport.notInDatabase.length > 0) {
      console.log("\nPlayers NOT found in database (will be skipped):");
      playerReport.notInDatabase.forEach((name) => {
        console.log(`  - ${name}`);
      });
      console.log("\nTo fix: Add these players to your seed data with proper:");
      console.log("  1. Price (based on performance)");
      console.log("  2. Category (MS, WS, MD, WD, XD)");
      console.log("  3. Correct name spelling");
      console.log("\nMatches with these players will NOT be processed.");
    }

    // Ask for confirmation if many players are missing
    if (playerReport.notInDatabase.length > playerReport.inDatabase.length / 2) {
      console.log("\n" + "=".repeat(50));
      console.log("WARNING: Many players missing from database!");
      console.log("=".repeat(50));
      console.log("More than 50% of scraped players are not in the database.");
      console.log("Consider updating your seed data first.");
      console.log("\nContinue anyway? (matches with missing players will be skipped)");
      // In a real app, you might add a prompt here
    }

    console.log("\nStep 3: Processing matches (skipping matches with missing players)...");
    const processingResult = await processScrapeResults(scrapeResult.dayResults);

    console.log("\n" + "=".repeat(50));
    console.log("INTEGRATION SUMMARY");
    console.log("=".repeat(50));
    console.log(`Matches processed: ${processingResult.matchesProcessed}`);
    console.log(`New match records created: ${processingResult.newMatchesCreated}`);
    console.log(`Points awarded: ${processingResult.pointsAwarded}`);
    console.log(`Players not found (matches skipped): ${processingResult.playersNotFound.length}`);
    console.log(`Errors: ${processingResult.errors.length}`);

    if (processingResult.playersNotFound.length > 0) {
      console.log("\nPlayers causing matches to be skipped:");
      processingResult.playersNotFound.forEach((name) => console.log(`  - ${name}`));
    }

    if (processingResult.errors.length > 0) {
      console.log("\nErrors encountered:");
      processingResult.errors.forEach((err) => console.log(`  - ${err}`));
    }

    // Show final statistics
    const totalMatches = await prisma.match.count();
    const totalPlayers = await prisma.player.count();

    console.log("\n" + "=".repeat(50));
    console.log("DATABASE STATISTICS");
    console.log("=".repeat(50));
    console.log(`Total matches in database: ${totalMatches}`);
    console.log(`Total players in database: ${totalPlayers}`);
    console.log(
      `Success rate: ${
        scrapeResult.totalMatches > 0
          ? Math.round((processingResult.matchesProcessed / scrapeResult.totalMatches) * 100)
          : 0
      }%`
    );

    console.log("\nIntegration complete!");
    console.log("\nNext steps:");
    console.log("1. Review missing players above");
    console.log("2. Add them to your seed data with proper price and category");
    console.log("3. Re-run the scraper to process skipped matches");
  } catch (error) {
    console.error("\nFATAL ERROR:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
