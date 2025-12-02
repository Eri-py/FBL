import { Page } from "puppeteer";
import { wait } from "./utils";

export class DateNavigator {
  constructor(private page: Page) {}

  async goToPreviousDay(): Promise<boolean> {
    try {
      const prevButton = await this.page.$('[data-day-picker-arrow="prev"]');
      if (!prevButton) {
        console.log("Previous button not found");
        return false;
      }

      const isDisabled = await this.page.evaluate((button) => {
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

      // Scroll the button into view
      await prevButton.scrollIntoView();
      await wait(500);

      await prevButton.click();
      await wait(2000);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log("Error clicking previous button:", errorMessage);
      return false;
    }
  }

  async navigateBackDays(days: number): Promise<void> {
    console.log(`Navigating back ${days} days...`);

    for (let i = 0; i < days; i++) {
      const success = await this.goToPreviousDay();
      if (!success) {
        console.log(`Stopped after ${i} days (cannot navigate further)`);
        break;
      }
      await wait(1000);
    }
  }
}
