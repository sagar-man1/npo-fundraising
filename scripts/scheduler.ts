/**
 * Always-on scheduler. Runs as its own long-lived process (launchd on the Mac
 * mini) so the morning brief does not depend on anyone's laptop being awake.
 *
 *   RESEARCH_CRON   cron expression, default 07:30 daily
 *   RESEARCH_TZ     IANA timezone, default Asia/Kolkata
 */

import "dotenv/config";
import cron from "node-cron";
import {
  digestModeAvailable,
  runDailyDigest,
  runDailyResearch,
} from "../src/lib/jobs/dailyResearch";

const expression = process.env.RESEARCH_CRON ?? "30 7 * * *";
const timezone = process.env.RESEARCH_TZ ?? "Asia/Kolkata";

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

if (!cron.validate(expression)) {
  console.error(`Invalid RESEARCH_CRON expression: ${expression}`);
  process.exit(1);
}

let running = false;

async function tick(trigger: string) {
  if (running) {
    log(`${trigger}: previous run still in progress, skipping`);
    return;
  }
  running = true;

  // Prefer the Notion pipeline: the research already happened in Claude Code,
  // so this side just syncs and delivers — no Anthropic key needed.
  const digest = digestModeAvailable();
  log(`${trigger}: starting ${digest ? "daily digest (Notion)" : "in-app research"}`);

  try {
    const result = digest ? await runDailyDigest() : await runDailyResearch();
    log(`done — ${result.summary}`);
    if (result.deliveryError) log(`WhatsApp delivery failed: ${result.deliveryError}`);
    else if (result.notified) log("WhatsApp message sent");
  } catch (error) {
    log(`FAILED: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    running = false;
  }
}

cron.schedule(expression, () => void tick("scheduled"), { timezone });

log(`Scheduler up. Running "${expression}" (${timezone}).`);

// `npm run scheduler -- --now` runs one cycle immediately, for testing.
if (process.argv.includes("--now")) void tick("manual");

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    log(`${signal} received, shutting down`);
    process.exit(0);
  });
}
