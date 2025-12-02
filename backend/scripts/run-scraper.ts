// backend/scripts/run-scraper.ts
// Complete script that scrapes and auto-populates database with players
// Run with: npx tsx backend/scripts/run-scraper.ts

import { scrapeCompletedMatches } from "./scrape-completed-matches";
import prisma from "../src/lib/prima"; // Fixed import name

const POINTS = {
  WIN: 100,
};

// Default price and category for auto-created players
const DEFAULT_PLAYER_PRICE = 8; // £8m middle tier
const DEFAULT_CATEGORY = "MS"; // Default to Men's Singles, can be updated manually later

type DayResult = {
  date: string;
  dateScraped: Date;
  matches: Array<{
    tournament: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: string;
    awayScore: string;
    date: string;
    winner: string;
  }>;
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

async function findOrCreatePlayer(playerName: string): Promise<string> {
  // First: Exact match (case insensitive)
  let player = await prisma.player.findFirst({
    where: {
      name: {
        equals: playerName,
        mode: "insensitive",
      },
    },
  });

  if (player) {
    return player.id;
  }

  // Second: Fuzzy match (contains)
  player = await prisma.player.findFirst({
    where: {
      name: {
        contains: playerName,
        mode: "insensitive",
      },
    },
  });

  if (player) {
    console.log(`  Fuzzy matched: "${playerName}" -> "${player.name}"`);
    return player.id;
  }

  // Third: Create new player automatically
  console.log(`  Creating new player: "${playerName}"`);
  const newPlayer = await prisma.player.create({
    data: {
      name: playerName,
      price: DEFAULT_PLAYER_PRICE,
      category: DEFAULT_CATEGORY,
    },
  });

  console.log(`  Created player: ${newPlayer.name} (ID: ${newPlayer.id})`);
  return newPlayer.id;
}

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

async function processScrapeResults(dayResults: DayResult[]) {
  const result = {
    matchesProcessed: 0,
    pointsAwarded: 0,
    playersCreated: 0,
    newMatchesCreated: 0,
    errors: [] as string[],
  };

  for (const dayResult of dayResults) {
    console.log(`\nProcessing matches for ${dayResult.date}...`);

    for (const match of dayResult.matches) {
      try {
        // Find or create winner (automatically adds to DB if not exists)
        const winnerIdBefore = await prisma.player.count();
        const winnerId = await findOrCreatePlayer(match.winner);
        const winnerIdAfter = await prisma.player.count();

        if (winnerIdAfter > winnerIdBefore) {
          result.playersCreated++;
        }

        // Also ensure both players exist in database (for future features)
        await findOrCreatePlayer(match.homeTeam);
        await findOrCreatePlayer(match.awayTeam);

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

  return result;
}

async function generatePlayerReport(dayResults: DayResult[]) {
  const scrapedPlayers = await extractUniquePlayerNames(dayResults);
  const dbPlayers = await prisma.player.findMany({
    select: { name: true },
  });

  const dbPlayerNames = new Map(dbPlayers.map((p) => [p.name.toLowerCase(), p]));

  const existingPlayers: string[] = [];
  const willBeCreated: string[] = [];

  for (const player of scrapedPlayers) {
    if (dbPlayerNames.has(player.toLowerCase())) {
      existingPlayers.push(player);
    } else {
      willBeCreated.push(player);
    }
  }

  return {
    existingPlayers,
    willBeCreated,
    totalUnique: scrapedPlayers.length,
  };
}

async function main() {
  console.log("Fantasy Badminton - Automated Scoring System");
  console.log("=".repeat(50));
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

    // Save scraped dates
    await saveScrapedDates(scrapeResult.scrapedDates);
    console.log(`Saved ${scrapeResult.scrapedDates.length} dates to database`);

    // Generate pre-processing report
    const playerReport = await generatePlayerReport(scrapeResult.dayResults);
    console.log("\nPlayer Analysis:");
    console.log(`Total unique players in scrape: ${playerReport.totalUnique}`);
    console.log(`Already in database: ${playerReport.existingPlayers.length}`);
    console.log(`Will be auto-created: ${playerReport.willBeCreated.length}`);

    if (playerReport.willBeCreated.length > 0) {
      console.log("\nNew players that will be created:");
      playerReport.willBeCreated.forEach((name) => {
        console.log(
          `  - ${name} (price: £${DEFAULT_PLAYER_PRICE}m, category: ${DEFAULT_CATEGORY})`
        );
      });
      console.log(
        "\nNote: New players are created with default values. Update prices/categories manually later."
      );
    }

    console.log("\nStep 3: Processing matches and creating players...");
    const processingResult = await processScrapeResults(scrapeResult.dayResults);

    console.log("\n" + "=".repeat(50));
    console.log("INTEGRATION SUMMARY");
    console.log("=".repeat(50));
    console.log(`Matches processed: ${processingResult.matchesProcessed}`);
    console.log(`New match records created: ${processingResult.newMatchesCreated}`);
    console.log(`Points awarded: ${processingResult.pointsAwarded}`);
    console.log(`Players auto-created: ${processingResult.playersCreated}`);
    console.log(`Errors: ${processingResult.errors.length}`);

    if (processingResult.errors.length > 0) {
      console.log("\nErrors encountered:");
      processingResult.errors.forEach((err) => console.log(`  - ${err}`));
    }

    // Show final player count
    const totalPlayers = await prisma.player.count();
    console.log(`\nTotal players in database: ${totalPlayers}`);

    console.log("\nAll done! Players from Flashscore are now your source of truth.");
  } catch (error) {
    console.error("\nFATAL ERROR:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
