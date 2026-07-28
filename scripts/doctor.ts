/**
 * Checks the things that actually go wrong, and says how to fix each one.
 *   npm run doctor
 */

import "dotenv/config";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/**
 * Critical checks are things that break the app for everyone and are decided
 * purely by the code — CI fails on these. Advisory checks depend on local setup
 * (your Notion token, your WhatsApp login), so they only ever warn.
 */
type Check = {
  ok: boolean;
  label: string;
  detail: string;
  fix?: string;
  critical?: boolean;
};

const checks: Check[] = [];

function add(ok: boolean, label: string, detail: string, fix?: string, critical = false) {
  checks.push({ ok, label, detail, fix, critical });
}

// ── Which code is running ────────────────────────────────────────────────────
try {
  const branch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8" }).trim();
  const commit = execSync("git log -1 --format=%h\\ %s", { encoding: "utf8" }).trim();
  add(true, "Code", `${branch} @ ${commit}`);

  const dirty = execSync("git status --porcelain", { encoding: "utf8" }).trim();
  if (dirty) {
    add(false, "Local changes", `${dirty.split("\n").length} uncommitted file(s)`,
      "Updates are blocked while these exist. Run: git stash");
  }
} catch {
  add(false, "Code", "not a git checkout");
}

// ── The failure that keeps biting: generated client vs schema ────────────────
const schemaPath = "prisma/schema.prisma";
const clientModel = "src/generated/prisma/models/Prospect.ts";

if (!fs.existsSync(clientModel)) {
  add(false, "Database client", "not generated",
    "Run: npm run db:migrate", true);
} else {
  const schema = fs.readFileSync(schemaPath, "utf8");
  const client = fs.readFileSync(clientModel, "utf8");

  // Compare only the Prospect block — other models live in their own files.
  const block = schema.match(/model Prospect \{([\s\S]*?)\n\}/)?.[1] ?? "";
  const fields = [...block.matchAll(/^\s{2}(\w+)\s+\w/gm)].map((m) => m[1]);
  const missing = [...new Set(fields)].filter((f) => !client.includes(f));

  if (missing.length) {
    add(false, "Database client", `stale — missing: ${missing.slice(0, 5).join(", ")}`,
      "This causes 'Unknown argument' errors on sync. Run: npm run db:migrate", true);
  } else {
    const age = Math.round(
      (Date.now() - fs.statSync(clientModel).mtimeMs) / 60000,
    );
    add(true, "Database client", `up to date (generated ${age} min ago)`);
  }
}

// ── Migrations applied ───────────────────────────────────────────────────────
try {
  const out = execSync("npx prisma migrate status", { encoding: "utf8", stdio: "pipe" });
  const applied = /up to date|No pending migrations/i.test(out);
  add(applied, "Migrations", applied ? "all applied" : "pending migrations",
    applied ? undefined : "Run: npm run db:migrate", true);
} catch {
  add(false, "Migrations", "could not check", "Run: npm run db:migrate", true);
}

// ── Notion configuration ─────────────────────────────────────────────────────
const dbVars = {
  "CSR Pipeline Tracker": "NOTION_PIPELINE_DB_ID",
  "IT/ITeS Companies": "NOTION_COMPANIES_DB_ID",
  "Donor CRM": "NOTION_DONORS_DB_ID",
  "Research Pipeline": "NOTION_RESEARCH_DB_ID",
};

if (!process.env.NOTION_TOKEN) {
  add(false, "Notion", "NOTION_TOKEN not set",
    "Current leads stays empty without it. See the README.");
} else {
  const configured = Object.entries(dbVars).filter(([, key]) => process.env[key]);
  add(configured.length > 0, "Notion", `token set · ${configured.length}/4 databases configured`,
    configured.length === 4 ? undefined : "Some database IDs are missing from .env");
}

// ── WhatsApp ─────────────────────────────────────────────────────────────────
const profile = process.env.WHATSAPP_PROFILE_DIR ?? ".whatsapp-profile";
const loggedIn = fs.existsSync(path.join(profile, "Default"));
add(loggedIn, "WhatsApp", loggedIn ? "session saved" : "not logged in",
  loggedIn ? undefined : "Run: npm run whatsapp:login");

// ── Report ───────────────────────────────────────────────────────────────────
console.log("\nPARFI Fundraising — checkup\n");
for (const check of checks) {
  console.log(`  ${check.ok ? "✓" : "✗"} ${check.label.padEnd(18)} ${check.detail}`);
  if (!check.ok && check.fix) console.log(`      → ${check.fix}`);
}

const broken = checks.filter((c) => !c.ok && c.critical);
const warnings = checks.filter((c) => !c.ok && !c.critical);

if (broken.length) {
  console.log(`\n${broken.length} thing(s) are broken — see the arrows above.\n`);
  process.exitCode = 1;
} else if (warnings.length) {
  console.log(`\nNothing is broken. ${warnings.length} thing(s) not set up yet.\n`);
} else {
  console.log("\nEverything looks right.\n");
}
