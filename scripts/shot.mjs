#!/usr/bin/env node
// Screenshot helper for visual review.
// Usage: node scripts/shot.mjs <url> <out.png> [--width 1440] [--height 900] [--full] [--mobile] [--wait 1500] [--selector css]
import { chromium, devices } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const args = process.argv.slice(2);
const url = args[0];
const out = args[1];
if (!url || !out) {
  console.error("usage: node scripts/shot.mjs <url> <out.png> [--width N] [--height N] [--full] [--mobile] [--wait ms] [--selector css]");
  process.exit(2);
}
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const flag = (name) => args.includes(`--${name}`);

const width = Number(opt("width", 1440));
const height = Number(opt("height", 900));
const wait = Number(opt("wait", 1800));
const selector = opt("selector", null);
const mobile = flag("mobile");
const full = flag("full");

mkdirSync(dirname(out), { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext(
  mobile ? { ...devices["iPhone 14 Pro"], colorScheme: "light" } : { viewport: { width, height }, deviceScaleFactor: 2, colorScheme: "light" },
);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});
await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 }).catch(async () => {
  await page.goto(url, { waitUntil: "load", timeout: 60_000 });
});
await page.waitForTimeout(wait);
if (selector) {
  const el = await page.$(selector);
  if (!el) {
    console.error(`selector not found: ${selector}`);
    process.exit(3);
  }
  await el.screenshot({ path: out });
} else {
  await page.screenshot({ path: out, fullPage: full });
}
const title = await page.title();
const h1 = await page.$eval("h1", (el) => el.textContent?.trim()).catch(() => null);
await browser.close();
console.log(JSON.stringify({ out, title, h1, errors }, null, 2));
