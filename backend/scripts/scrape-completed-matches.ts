// Flashscore scraper - Past week completed matches only
// Save as: backend/scripts/scrape-completed-matches.ts
// Run with: npx tsx backend/scripts/scrape-completed-matches.ts

import puppeteer from "puppeteer";

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

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

type ScrapeResult = {
  totalMatches: number;
  dayResults: DayResult[];
  scrapedDates: string[];
};

async function scrapeCompletedMatches(alreadyScrapedDates: string[] = []): Promise<ScrapeResult> {
  console.log("Starting Flashscore scraper for completed matches...\n");

  if (alreadyScrapedDates.length > 0) {
    console.log("Skipping already scraped dates:", alreadyScrapedDates.join(", "));
    console.log();
  }

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
    defaultViewport: { width: 1200, height: 800 },
  });

  try {
    const page = await browser.newPage();

    // Block ads and tracking
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const url = request.url();
      const resourceType = request.resourceType();

      // Block ads, trackers, and unnecessary resources
      if (
        resourceType === "image" ||
        resourceType === "font" ||
        url.includes("doubleclick.net") ||
        url.includes("googleadservices.com") ||
        url.includes("googlesyndication.com") ||
        url.includes("adnxs.com") ||
        url.includes("advertising.com") ||
        url.includes("/ads/") ||
        url.includes("analytics")
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Set user agent to avoid detection
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    console.log("Navigating to Flashscore...");
    await page.goto("https://www.flashscore.com/badminton/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    await page.waitForSelector(".sportName.badminton", { timeout: 10000 });
    console.log("Page loaded successfully\n");

    // Close any popups/overlays that might appear
    const closePopups = async (): Promise<void> => {
      try {
        const selectors = [
          'button[aria-label="Close"]',
          ".cookie-consent-close",
          ".modal-close",
          '[class*="close"]',
          '[class*="dismiss"]',
        ];

        for (const selector of selectors) {
          const elements = await page.$$(selector);
          for (const element of elements) {
            try {
              await element.click();
              await wait(500);
            } catch {
              // Ignore if element is not clickable
            }
          }
        }
      } catch {
        // Ignore errors in closing popups
      }
    };

    await closePopups();

    const getCurrentDate = async (): Promise<string> => {
      const dateText = await page.evaluate(() => {
        const dateButton = document.querySelector('[data-testid="wcl-dayPickerButton"]');
        return dateButton?.textContent?.trim() || "";
      });
      return dateText;
    };

    const extractCompletedMatches = async (currentDate: string): Promise<CompletedMatch[]> => {
      return await page.evaluate((date) => {
        const matches: CompletedMatch[] = [];
        const matchElements = document.querySelectorAll(".event__match");

        matchElements.forEach((match) => {
          const homeScore = match.querySelector(".event__score--home")?.textContent?.trim();
          const awayScore = match.querySelector(".event__score--away")?.textContent?.trim();

          if (
            !homeScore ||
            !awayScore ||
            homeScore === "-" ||
            awayScore === "-" ||
            homeScore === "" ||
            awayScore === ""
          ) {
            return;
          }

          const statusElement = match.querySelector(".event__stage");
          const statusText = statusElement?.textContent?.trim()?.toLowerCase() || "";

          if (
            statusText.includes("live") ||
            statusText.includes("interrupted") ||
            statusText.includes("postponed") ||
            statusText.includes("suspended")
          ) {
            return;
          }

          let tournament = "";
          let element: Element | null = match.previousElementSibling;
          while (element) {
            if (element.classList.contains("headerLeague__wrapper")) {
              const titleElement = element.querySelector(".headerLeague__title-text");
              tournament = titleElement?.textContent?.trim() || "";
              break;
            }
            element = element.previousElementSibling;
          }

          const homeTeam =
            match.querySelector(".event__participant--home")?.textContent?.trim() || "";
          const awayTeam =
            match.querySelector(".event__participant--away")?.textContent?.trim() || "";

          if (!homeTeam || !awayTeam || !tournament) {
            return;
          }

          const homeScoreParts = homeScore.split(/[\s\n]+/).filter((s) => s && s !== "-");
          const awayScoreParts = awayScore.split(/[\s\n]+/).filter((s) => s && s !== "-");

          let homeGamesWon = 0;
          let awayGamesWon = 0;

          for (let i = 0; i < Math.min(homeScoreParts.length, awayScoreParts.length); i++) {
            const homePoints = parseInt(homeScoreParts[i]);
            const awayPoints = parseInt(awayScoreParts[i]);

            if (!isNaN(homePoints) && !isNaN(awayPoints)) {
              if (homePoints > awayPoints) {
                homeGamesWon++;
              } else if (awayPoints > homePoints) {
                awayGamesWon++;
              }
            }
          }

          const winner = homeGamesWon > awayGamesWon ? homeTeam : awayTeam;

          matches.push({
            tournament,
            homeTeam,
            awayTeam,
            homeScore,
            awayScore,
            date,
            winner,
          });
        });

        return matches;
      }, currentDate);
    };

    const goToPreviousDay = async (): Promise<boolean> => {
      try {
        // Close any popups before clicking
        await closePopups();

        const prevButton = await page.$('[data-day-picker-arrow="prev"]');
        if (!prevButton) {
          console.log("Previous button not found");
          return false;
        }

        const isDisabled = await page.evaluate((button) => {
          return (
            button.hasAttribute("disabled") ||
            button.classList.contains("disabled") ||
            button.getAttribute("aria-hidden") === "true"
          );
        }, prevButton);

        if (isDisabled) {
          console.log("Previous button is disabled");
          return false;
        }

        // Scroll the button into view to avoid clicking hidden elements
        await prevButton.scrollIntoView();
        await wait(500);

        await prevButton.click();
        await wait(2000);
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log("Error clicking previous button:", errorMessage);
      }
      return false;
    };

    const allMatches: DayResult[] = [];
    const scrapedDates: string[] = [];

    console.log("Starting from today, then going back to yesterday...");
    const todayDate = await getCurrentDate();
    console.log(`Current date: ${todayDate}`);

    console.log("\nNavigating to yesterday...");
    const wentBack = await goToPreviousDay();

    if (!wentBack) {
      console.log("Could not navigate to previous day. Exiting.");
      return { totalMatches: 0, dayResults: [], scrapedDates: [] };
    }

    const startDate = await getCurrentDate();
    console.log(`Starting scrape from: ${startDate}\n`);

    for (let day = 0; day < 7; day++) {
      const currentDate = await getCurrentDate();

      // Skip if we already scraped this date
      if (alreadyScrapedDates.includes(currentDate)) {
        console.log(`\nDate: ${currentDate}`);
        console.log("-".repeat(50));
        console.log("Already scraped this date, skipping...");

        if (day < 6) {
          await goToPreviousDay();
        }
        continue;
      }

      console.log(`\nDate: ${currentDate}`);
      console.log("-".repeat(50));

      const matches = await extractCompletedMatches(currentDate);
      const scrapedAt = new Date();

      allMatches.push({
        date: currentDate,
        dateScraped: scrapedAt,
        matches: matches,
      });

      scrapedDates.push(currentDate);

      if (matches.length === 0) {
        console.log("No completed matches found for this date");
      } else {
        console.log(`Found ${matches.length} completed matches:`);
        matches.forEach((match, index) => {
          console.log(`${index + 1}. Tournament: ${match.tournament}`);
          console.log(
            `   ${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}`
          );
          console.log(`   Winner: ${match.winner}`);
          console.log();
        });
      }

      if (day < 6) {
        console.log(`Going to previous day...`);
        const success = await goToPreviousDay();
        if (!success) {
          console.log("Cannot navigate to previous day. Stopping.");
          break;
        }
      }

      await wait(1000);
    }

    console.log("\n" + "=".repeat(50));
    console.log("SCRAPING SUMMARY - PAST WEEK");
    console.log("=".repeat(50));

    let totalMatches = 0;
    allMatches.forEach((dayResult) => {
      console.log(`${dayResult.date}: ${dayResult.matches.length} matches`);
      totalMatches += dayResult.matches.length;
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
    console.error("Error:", error);
    throw error;
  } finally {
    await wait(3000);
    await browser.close();
    console.log("Browser closed");
  }
}

// Export the function so it can be imported by other modules
export { scrapeCompletedMatches };

// Self-executing function for direct script execution (ES modules version)
(async () => {
  // Check if this file is being run directly
  if (process.argv[1] && process.argv[1].endsWith("scrape-completed-matches.ts")) {
    try {
      await scrapeCompletedMatches();
      process.exit(0);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  }
})();
