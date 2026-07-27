import { prisma } from "../db";
import { parseJsonArray, THEME_LABELS } from "../format";
import { discoverProspects } from "../research/agent";
import { sendWhatsApp, whatsappContact } from "../notify/whatsapp";
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
 * One morning cycle: research, store, message. The WhatsApp send is best-effort —
 * a delivery failure must not lose the prospects that were already found.
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
