/**
 * One-time WhatsApp Web login. Opens a browser against the persistent profile
 * the scheduler uses; scan the QR code with your phone, then close the window.
 * The session is stored on disk so every later run is already logged in.
 */

import "dotenv/config";
import path from "node:path";
import { chromium } from "playwright";

const profile =
  process.env.WHATSAPP_PROFILE_DIR ?? path.join(process.cwd(), ".whatsapp-profile");

async function main() {
  console.log(`Using profile: ${profile}`);
  const context = await chromium.launchPersistentContext(profile, {
    headless: false,
    viewport: { width: 1280, height: 900 },
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto("https://web.whatsapp.com/");

  console.log("\nScan the QR code with WhatsApp on your phone.");
  console.log("Waiting for the chat list to appear (up to 3 minutes)...");

  try {
    await page.getByRole("textbox", { name: /search/i }).first().waitFor({
      state: "visible",
      timeout: 180_000,
    });
    console.log("\nLogged in. Session saved — you can close this window.");
    console.log("Leave it open for a few seconds so WhatsApp finishes syncing.");
    await page.waitForTimeout(8000);
  } catch {
    console.error("\nTimed out waiting for login. Re-run and scan more quickly.");
    process.exitCode = 1;
  } finally {
    await context.close();
  }
}

main();
