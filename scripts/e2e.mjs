// End-to-end checks for ScamShield using a real headless browser (Playwright).
// Playwright is NOT a project dependency. Install it separately to run this file:
//   npm install --no-save playwright && npx playwright install chromium
// Or point PLAYWRIGHT_MODULE at an existing install.
// Usage: node scripts/e2e.mjs

import assert from "node:assert/strict";
import { createServer } from "../server.js";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");

const server = createServer();
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();

let passed = 0;
const step = async (name, fn) => {
  try { await fn(); passed += 1; console.log("  ok  -", name); }
  catch (e) { console.log("  FAIL-", name, "\n      ", e.message.split("\n")[0]); process.exitCode = 1; }
};

async function newPage(viewport, extra = {}) {
  const ctx = await browser.newContext({ viewport, acceptDownloads: true, permissions: ["clipboard-read", "clipboard-write"], ...extra });
  const page = await ctx.newPage();
  const external = [];
  page.on("request", (req) => { if (!req.url().startsWith(base) && !req.url().startsWith("data:")) external.push(req.url()); });
  page.on("pageerror", (e) => { console.log("      page error:", e.message); process.exitCode = 1; });
  return { page, ctx, external };
}

console.log("Desktop flow");
{
  const { page, ctx, external } = await newPage({ width: 1280, height: 800 });
  await page.goto(base);

  await step("home page shows ScamShield name and safety note", async () => {
    assert.match(await page.title(), /ScamShield/);
    await page.getByText("Safety note:").waitFor();
    await page.getByRole("heading", { name: "Check a suspicious message or link" }).waitFor();
  });

  await step("empty submit shows a clear validation message", async () => {
    await page.getByRole("button", { name: "Check on this device" }).click();
    await page.getByText("Paste a message, enter a link, or both.").waitFor();
  });

  await step("sample message gives High caution with indicators and next steps", async () => {
    await page.getByRole("button", { name: "Try a fictional sample" }).click();
    await page.getByRole("button", { name: "Check on this device" }).click();
    await page.getByRole("heading", { name: "High caution" }).waitFor();
    assert.ok((await page.locator(".indicator").count()) >= 3);
    await page.getByText("Asks for a secret code or password").waitFor();
    await page.getByText("Why this matters").first().waitFor();
    await page.getByRole("heading", { name: "Safe next steps" }).waitFor();
    await page.getByText("does not prove a message is legitimate").waitFor();
  });

  await step("URL-only check works and the link is never requested", async () => {
    await page.getByRole("button", { name: "Clear everything" }).click();
    assert.equal(await page.locator("#msg").inputValue(), "");
    await page.locator("#url").fill("https://bit.ly/demo-offer");
    await page.getByRole("button", { name: "Check on this device" }).click();
    await page.getByRole("heading", { name: "Review carefully" }).waitFor();
    await page.getByText("Link shortener hides the real destination").waitFor();
    assert.deepEqual(external.filter((u) => /bit\.ly/.test(u)), []);
  });

  await step("bad link gets a friendly error", async () => {
    await page.locator("#url").fill("not a link");
    await page.getByRole("button", { name: "Check on this device" }).click();
    await page.getByText(/does not look like a single web address/).waitFor();
  });

  await step("ordinary message shows 'No obvious warning signs detected' plus the caution", async () => {
    await page.locator("#url").fill("");
    await page.locator("#msg").fill("Hi, are we still meeting for lunch at 1pm tomorrow?");
    await page.getByRole("button", { name: "Check on this device" }).click();
    await page.getByRole("heading", { name: "No obvious warning signs detected" }).waitFor();
    await page.getByText("That does not mean it is safe.").waitFor();
  });

  await step("nothing is saved unless the user chooses to save", async () => {
    const keys = await page.evaluate(() => Object.keys(localStorage));
    assert.ok(!keys.includes("scamshield.saved"));
  });

  await step("explicit save persists across reload, and can be deleted", async () => {
    await page.locator("#msg").fill("Pay a fee of Rs. 99 now, code 123456 to claim your prize");
    await page.getByRole("button", { name: "Check on this device" }).click();
    await page.getByRole("button", { name: "Save to this device" }).click();
    await page.getByText("Saved on this device.").waitFor();
    await page.reload();
    await page.getByRole("link", { name: "Learn", exact: true }).click();
    await page.getByText("Saved on this device", { exact: true }).waitFor();
    const text = await page.locator(".message-box").last().textContent();
    assert.ok(!text.includes("123456"), "long digits should be masked");
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page.getByText("Nothing saved yet.").waitFor();
  });

  await step("learning hub: inspect an example, pick signs, reveal explanation", async () => {
    await page.getByRole("button", { name: /Fictional example\s*Parcel redelivery fee/ }).click();
    await page.getByText("Fictional example. For education only.").waitFor();
    await page.getByLabel("Asks for a fee, deposit or transfer").check();
    await page.getByLabel("Pressures me to act immediately").check();
    await page.getByRole("button", { name: "Reveal explanation" }).click();
    await page.getByText(/You spotted \d of \d main warning signs/).waitFor();
    await page.getByText("Key lesson:").waitFor();
    const lines = (await page.locator("#example-detail").innerText()).split("\n").map((l) => l.trim());
    assert.ok(!lines.includes("null") && !lines.includes("undefined"), "stray null/undefined text");
  });

  await step("quiz gives immediate feedback and a final score", async () => {
    await page.getByRole("button", { name: "Start the quiz" }).click();
    for (let i = 0; i < 7; i += 1) {
      await page.locator(".option-btn").first().click();
      await page.locator("#quiz .notice").waitFor();
      await page.getByRole("button", { name: /Next question|See my result/ }).click();
    }
    await page.getByText(/You answered \d of 7 correctly/).waitFor();
    await page.getByText("Your score is not saved or sent anywhere.").waitFor();
  });

  await step("checklist builds a local summary and masks secrets", async () => {
    await page.getByRole("link", { name: "Checklist", exact: true }).click();
    await page.getByLabel("What happened?").fill("Got a call asking for my OTP. My otp is 556677 and card 4111 1111 1111 1111");
    await page.getByLabel("Where did it happen?").selectOption("Phone call");
    await page.getByLabel("Was money sent?").selectOption("Not sure");
    await page.getByLabel("A one-time code (OTP)").check();
    await page.getByLabel(/Save screenshots/).check();
    const preview = await page.locator("#inc-preview").textContent();
    assert.match(preview, /Phone call/);
    assert.match(preview, /\[x\] Save screenshots/);
    assert.ok(!preview.includes("556677") && !preview.includes("4111"), "secrets must be hidden");
    await page.getByText(/looked like a card number or a secret code/).waitFor();
  });

  await step("copy and download work without any upload", async () => {
    await page.getByRole("button", { name: "Copy summary" }).click();
    await page.getByText(/Copied\./).waitFor();
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    assert.match(clip, /INCIDENT SUMMARY/);
    const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download as text file" }).click()]);
    assert.equal(dl.suggestedFilename(), "scamshield-incident-summary.txt");
  });

  await step("checklist is not stored; clear resets the form", async () => {
    await page.getByRole("button", { name: "Clear everything" }).click();
    assert.equal(await page.getByLabel("What happened?").inputValue(), "");
    const keys = await page.evaluate(() => Object.keys(localStorage));
    assert.ok(!keys.some((k) => /incident|checklist/i.test(k)));
  });

  await step("text size preference persists after reload; delete-all clears it", async () => {
    await page.getByRole("button", { name: "Larger text" }).click();
    await page.reload();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.size), "large");
    await page.getByRole("link", { name: "Privacy", exact: true }).click();
    await page.getByRole("button", { name: /Delete everything ScamShield stored/ }).click();
    await page.getByText("All ScamShield data on this device was deleted.").waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.size), "normal");
    assert.deepEqual(await page.evaluate(() => Object.keys(localStorage)), []);
  });

  await step("keyboard: skip link and tab order reach the main controls", async () => {
    await page.goto(base);
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement.className), "skip-link");
    await page.keyboard.press("Enter");
    for (let i = 0; i < 4; i += 1) await page.keyboard.press("Tab");
    const tag = await page.evaluate(() => document.activeElement.tagName);
    assert.ok(["TEXTAREA", "INPUT", "BUTTON", "A"].includes(tag));
  });

  await step("no request ever left localhost during the whole session", async () => {
    assert.deepEqual(external, []);
  });
  await ctx.close();
}

console.log("Phone-size flow (390 x 844)");
{
  const { page, ctx } = await newPage({ width: 390, height: 844 }, { isMobile: true, hasTouch: true });
  await page.goto(base);
  const noOverflow = async () => {
    const w = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    assert.ok(w[0] <= w[1] + 1, `horizontal scroll: ${w}`);
  };
  await step("check screen fits without sideways scrolling", noOverflow);
  await step("phone: result renders", async () => {
    await page.getByRole("button", { name: "Try a fictional sample" }).click();
    await page.getByRole("button", { name: "Check on this device" }).click();
    await page.getByRole("heading", { name: "High caution" }).waitFor();
    await noOverflow();
  });
  for (const name of ["Learn", "Checklist", "Privacy"]) {
    await step(`phone: ${name} fits`, async () => {
      await page.getByRole("link", { name, exact: true }).click();
      await page.waitForTimeout(100);
      await noOverflow();
    });
  }
  await ctx.close();
}

await browser.close();
await new Promise((r) => server.close(r));
console.log(`\n${passed} checks passed${process.exitCode ? ", with failures" : ""}`);
