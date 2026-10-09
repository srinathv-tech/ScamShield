// Captures real screenshots of the running prototype for the presentation and docs.
// Needs Playwright (see scripts/e2e.mjs for install notes).
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "../server.js";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "docs", "screenshots");
mkdirSync(OUT, { recursive: true });

const server = createServer();
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const out = (n) => path.join(OUT, n);

// Desktop
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
  await page.goto(base);
  await page.getByRole("button", { name: "Try a fictional sample" }).click();
  await page.getByRole("button", { name: "Check on this device" }).click();
  await page.getByRole("heading", { name: "High caution" }).waitFor();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: out("check-desktop.png") });

  // Verdict plus the first two warning signs
  const box = await page.evaluate(() => {
    const v = document.querySelector(".verdict").getBoundingClientRect();
    const cards = document.querySelectorAll(".indicator");
    const last = cards[Math.min(1, cards.length - 1)].getBoundingClientRect();
    return { x: v.x, y: v.y + window.scrollY, w: v.width, h: last.bottom + window.scrollY - (v.y + window.scrollY) };
  });
  await page.screenshot({ path: out("check-signs.png"), fullPage: true, clip: { x: box.x, y: box.y, width: box.w, height: box.h } });

  await page.getByRole("link", { name: "Learn", exact: true }).click();
  await page.getByRole("button", { name: /Fictional example\s*Parcel redelivery fee/ }).click();
  await page.getByLabel("Asks for a fee, deposit or transfer").check();
  await page.getByLabel("Pressures me to act immediately").check();
  await page.getByRole("button", { name: "Reveal explanation" }).click();
  await page.getByText("Key lesson:").waitFor();
  await page.locator("#example-detail").screenshot({ path: out("learn-example.png") });

  await page.getByRole("link", { name: "Checklist", exact: true }).click();
  await page.getByLabel("What happened?").fill("A message said my parcel was held and asked for a small fee. I did not pay.");
  await page.getByLabel("Where did it happen?").selectOption("Text message (SMS)");
  await page.getByLabel("A one-time code (OTP)").check();
  await page.getByLabel(/Save screenshots/).check();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: out("checklist.png") });
  await page.close();
}

// Phone
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(base);
  await page.getByRole("button", { name: "Try a fictional sample" }).click();
  await page.getByRole("button", { name: "Check on this device" }).click();
  await page.getByRole("heading", { name: "High caution" }).waitFor();
  await page.evaluate(() => document.querySelector(".verdict").scrollIntoView());
  await page.screenshot({ path: out("check-mobile.png") });
  await ctx.close();
}

await browser.close();
await new Promise((r) => server.close(r));
console.log("Screenshots written to docs/screenshots");
