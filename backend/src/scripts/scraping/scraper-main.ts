import { DateNavigator } from "./date-navigator";
import { MatchExtractor } from "./match-extractor";
import { PageHandler } from "./page-handler";
import { ScrapeResult, DayResult } from "./types";
import { wait } from "./utils";

export async function scrapeCompletedMatches(
  alreadyScrapedDates: string[] = []
): Promise<ScrapeResult> {
  console.log("Starting Flashscore scraper for completed matches...\n");

  if (alreadyScrapedDates.length > 0) {
    console.log("Skipping already scraped dates:", alreadyScrapedDates.join(", "));
    console.log();
  }

  const pageHandler = new PageHandler();

  try {
    // Setup
    await pageHandler.launchBrowser();
    await pageHandler.createPage();
    await pageHandler.navigateToBadminton();
    await pageHandler.closePopups();

    const page = pageHandler.getPage();
    const dateNavigator = new DateNavigator(page);
    const matchExtractor = new MatchExtractor(page);

    // Initialize results
    const allMatches: DayResult[] = [];
    const scrapedDates: string[] = [];

    console.log("Starting from today, then going back to yesterday...");

    // Go to yesterday to start (since we want past week, not including today)
    console.log("\nNavigating to yesterday...");
    const wentBack = await dateNavigator.goToPreviousDay();

    if (!wentBack) {
      console.log("Could not navigate to previous day. Exiting.");
      return { totalMatches: 0, dayResults: [], scrapedDates: [] };
    }

    // Scrape 7 days of matches
    for (let day = 0; day < 7; day++) {
      const currentDate = await pageHandler.getCurrentDate();

      // Skip if already scraped
      if (alreadyScrapedDates.includes(currentDate)) {
        console.log(`\nDate: ${currentDate}`);
        console.log("-".repeat(50));
        console.log("Already scraped this date, skipping...");

        if (day < 6) {
          await dateNavigator.goToPreviousDay();
        }
        continue;
      }

      console.log(`\nDate: ${currentDate}`);
      console.log("-".repeat(50));

      // Extract matches for this date
      const matches = await matchExtractor.extractAndLogMatches(currentDate);
      const scrapedAt = new Date();

      allMatches.push({
        date: currentDate,
        dateScraped: scrapedAt,
        matches: matches,
      });

      scrapedDates.push(currentDate);

      // Navigate to previous day if not the last day
      if (day < 6) {
        console.log(`Going to previous day...`);
        const success = await dateNavigator.goToPreviousDay();
        if (!success) {
          console.log("Cannot navigate to previous day. Stopping.");
          break;
        }
      }

      await wait(1000);
    }

    // Generate summary
    const totalMatches = allMatches.reduce((sum, day) => sum + day.matches.length, 0);

    console.log("\n" + "=".repeat(50));
    console.log("SCRAPING SUMMARY - PAST WEEK");
    console.log("=".repeat(50));

    allMatches.forEach((dayResult) => {
      console.log(`${dayResult.date}: ${dayResult.matches.length} matches`);
    });

    console.log(`\nTotal completed matches scraped: ${totalMatches}`);
    console.log(`Dates scraped: ${scrapedDates.join(", ")}`);
    console.log("\nScraping completed.");

    return {
      totalMatches,
      dayResults: allMatches,
      scrapedDates,
    };
  } catch (error) {
    console.error("Error during scraping:", error);
    throw error;
  } finally {
    await wait(3000);
    await pageHandler.close();
    console.log("Browser closed");
  }
}
