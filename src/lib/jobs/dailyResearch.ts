import { prisma } from "../db";
import { parseJsonArray, THEME_LABELS } from "../format";
import { discoverProspects } from "../research/agent";
import { sendWhatsApp, whatsappContact } from "../notify/whatsapp";
import { researchPipelineConfigured, syncAll } from "../notion";
import type { ResearchCompany, ResearchLead } from "@/generated/prisma/client";

type CompanyWithLeads = ResearchCompany & { leads: ResearchLead[] };

const FOCUS_ROTATION = [
  "Global Capability Centres in Bengaluru and Hyderabad",
  "Pharma and healthcare companies funding health-worker training",
  "BFSI and foreign banks with India CSR programmes",
  "Manufacturing, auto and engineering firms funding technical trades",
  "FMCG and consumer companies funding women's livelihoods",
  "Family foundations and UHNI philanthropy in India",
  "PSUs and infrastructure companies with large CSR pools",
];

/** Rotate the brief by weekday so a week's runs don't retread one sector. */
function focusForToday(date = new Date()) {
  return FOCUS_ROTATION[date.getDay() % FOCUS_ROTATION.length];
}

export function buildMessage(companies: CompanyWithLeads[], date = new Date()) {
  const heading = date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  if (!companies.length) {
    return `PARFI prospects — ${heading}\n\nNo new prospects cleared the bar today. Nothing found that funds outside NGOs in the sectors searched.`;
  }

  const lines = [
    `PARFI prospects — ${heading}`,
    "",
    `${companies.length} new ${companies.length === 1 ? "company" : "companies"} to look at:`,
  ];

  for (const company of companies) {
    const themes = parseJsonArray(company.themes)
      .map((theme) => THEME_LABELS[theme] ?? theme)
      .join(", ");

    lines.push("");
    lines.push(`*${company.name}* — ${company.priority}`);
    lines.push(
      [company.sector, company.hqCity, company.csrBudget].filter(Boolean).join(" · "),
    );
    lines.push(`Funding model: ${company.deliveryModel} (${company.grantLikelihood} odds)`);
    if (themes) lines.push(`Themes: ${themes}`);
    if (company.fitRationale) lines.push(company.fitRationale);
    if (company.warmPath) lines.push(`Route in: ${company.warmPath}`);

    for (const lead of company.leads.slice(0, 3)) {
      const detail = [lead.title, lead.iitAffiliation].filter(Boolean).join(", ");
      lines.push(`• ${lead.name}${detail ? ` — ${detail}` : ""}`);
    }
  }

  lines.push("");
  lines.push("Open the Research tab to triage or push these into Notion.");

  return lines.join("\n");
}

/**
 * The default morning cycle: pull whatever the scheduled Claude Code routine
 * wrote into Notion overnight, then WhatsApp anything not yet sent.
 *
 * No Anthropic key is involved — the research happened in Claude Code, and this
 * side only reads Notion and delivers.
 */
export async function runDailyDigest(options: { notify?: boolean } = {}) {
  const notify = options.notify ?? true;
  const run = await prisma.jobRun.create({
    data: { job: "daily-digest", status: "running" },
  });

  try {
    await syncAll();

    const companies = await prisma.researchCompany.findMany({
      where: {
        discoveredBy: "notion",
        notifiedAt: null,
        status: { notIn: ["Rejected", "Promoted"] },
      },
      include: { leads: true },
      orderBy: [{ priority: "asc" }, { name: "asc" }],
    });

    let notified = false;
    let deliveryError: string | null = null;

    if (notify && companies.length) {
      try {
        await sendWhatsApp({
          contact: whatsappContact(),
          message: buildMessage(companies),
        });
        notified = true;
        await prisma.researchCompany.updateMany({
          where: { id: { in: companies.map((company) => company.id) } },
          data: { notifiedAt: new Date() },
        });
      } catch (error) {
        deliveryError = error instanceof Error ? error.message : String(error);
      }
    }

    const summary = companies.length
      ? `${companies.length} new from Notion: ${companies.map((c) => c.name).join(", ")}`
      : "No new prospects in the Notion research pipeline";

    await prisma.jobRun.update({
      where: { id: run.id },
      data: {
        status: deliveryError ? "error" : "success",
        found: companies.length,
        notified,
        summary,
        error: deliveryError,
        finishedAt: new Date(),
      },
    });

    return { companies, notified, deliveryError, summary };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.jobRun.update({
      where: { id: run.id },
      data: { status: "error", error: message, finishedAt: new Date() },
    });
    throw error;
  }
}

/** True when the Notion research pipeline is wired up and should be preferred. */
export function digestModeAvailable() {
  return researchPipelineConfigured();
}

/**
 * Alternative path: research inside the app using an Anthropic key. Only used
 * when you have not set up the Claude Code routine.
 */
export async function runDailyResearch(options: { notify?: boolean; focus?: string } = {}) {
  const notify = options.notify ?? true;
  const run = await prisma.jobRun.create({
    data: { job: "daily-research", status: "running" },
  });

  try {
    const companies = await discoverProspects({
      focus: options.focus ?? focusForToday(),
    });

    let notified = false;
    let deliveryError: string | null = null;

    if (notify) {
      try {
        await sendWhatsApp({
          contact: whatsappContact(),
          message: buildMessage(companies),
        });
        notified = true;
        if (companies.length) {
          await prisma.researchCompany.updateMany({
            where: { id: { in: companies.map((company) => company.id) } },
            data: { notifiedAt: new Date() },
          });
        }
      } catch (error) {
        deliveryError = error instanceof Error ? error.message : String(error);
      }
    }

    const summary = `${companies.length} new prospect(s): ${
      companies.map((company) => company.name).join(", ") || "none"
    }`;

    await prisma.jobRun.update({
      where: { id: run.id },
      data: {
        status: deliveryError ? "error" : "success",
        found: companies.length,
        notified,
        summary,
        error: deliveryError,
        finishedAt: new Date(),
      },
    });

    return { companies, notified, deliveryError, summary };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.jobRun.update({
      where: { id: run.id },
      data: { status: "error", error: message, finishedAt: new Date() },
    });
    throw error;
  }
}
