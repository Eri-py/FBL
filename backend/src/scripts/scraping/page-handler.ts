import puppeteer, { Browser, Page } from "puppeteer";
import { wait } from "./utils";

export class PageHandler {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async launchBrowser(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: false,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
      ],
      defaultViewport: { width: 1200, height: 800 },
    });
  }

  async createPage(): Promise<void> {
    if (!this.browser) throw new Error("Browser not launched");

    this.page = await this.browser.newPage();
    await this.setupPageInterception();
    await this.setUserAgent();
  }

  private async setupPageInterception(): Promise<void> {
    if (!this.page) return;

    await this.page.setRequestInterception(true);
    this.page.on("request", (request) => {
      const url = request.url();
      const resourceType = request.resourceType();

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
  }

  private async setUserAgent(): Promise<void> {
    if (!this.page) return;

    await this.page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
  }

  async navigateToBadminton(): Promise<void> {
    if (!this.page) throw new Error("Page not created");

    console.log("Navigating to Flashscore...");
    await this.page.goto("https://www.flashscore.com/badminton/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    await this.page.waitForSelector(".sportName.badminton", { timeout: 10000 });
    console.log("Page loaded successfully\n");
  }

  async closePopups(): Promise<void> {
    if (!this.page) return;

    try {
      const selectors = [
        'button[aria-label="Close"]',
        ".cookie-consent-close",
        ".modal-close",
        '[class*="close"]',
        '[class*="dismiss"]',
      ];

      for (const selector of selectors) {
        const elements = await this.page.$$(selector);
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
  }

  async getCurrentDate(): Promise<string> {
    if (!this.page) throw new Error("Page not created");

    return await this.page.evaluate(() => {
      const dateButton = document.querySelector('[data-testid="wcl-dayPickerButton"]');
      return dateButton?.textContent?.trim() || "";
    });
  }

  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  getPage(): Page {
    if (!this.page) throw new Error("Page not created");
    return this.page;
  }
}
