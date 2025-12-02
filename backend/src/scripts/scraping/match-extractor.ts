import { Page } from "puppeteer";
import { CompletedMatch } from "./types";

export class MatchExtractor {
  constructor(private page: Page) {}

  async extractCompletedMatches(currentDate: string): Promise<CompletedMatch[]> {
    return await this.page.evaluate((date: string) => {
      const matches: CompletedMatch[] = [];
      const matchElements = document.querySelectorAll(".event__match");

      matchElements.forEach((match) => {
        const homeScoreEl = match.querySelector(".event__score--home");
        const awayScoreEl = match.querySelector(".event__score--away");
        const homeScore = homeScoreEl?.textContent?.trim() || "";
        const awayScore = awayScoreEl?.textContent?.trim() || "";

        // Skip matches without scores or with placeholder scores
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

        // Check match status
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

        // Find tournament name
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

        // Get team names
        const homeTeamEl = match.querySelector(".event__participant--home");
        const awayTeamEl = match.querySelector(".event__participant--away");
        const homeTeam = homeTeamEl?.textContent?.trim() || "";
        const awayTeam = awayTeamEl?.textContent?.trim() || "";

        if (!homeTeam || !awayTeam || !tournament) {
          return;
        }

        // Calculate winner
        const homeParts = homeScore.split(/[\s\n]+/).filter((s) => s && s !== "-");
        const awayParts = awayScore.split(/[\s\n]+/).filter((s) => s && s !== "-");

        let homeGamesWon = 0;
        let awayGamesWon = 0;

        for (let i = 0; i < Math.min(homeParts.length, awayParts.length); i++) {
          const homePoints = parseInt(homeParts[i]);
          const awayPoints = parseInt(awayParts[i]);

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
          date: date,
          winner,
        });
      });

      return matches;
    }, currentDate);
  }

  async extractAndLogMatches(currentDate: string): Promise<CompletedMatch[]> {
    const matches = await this.extractCompletedMatches(currentDate);

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

    return matches;
  }
}
