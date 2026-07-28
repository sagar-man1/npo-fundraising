import { Client, isFullPage } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client";
import { prisma } from "./db";
import { lookupAssessment } from "./deliveryModels";

export type SourceKey = "pipeline" | "companies" | "donors";

export const SOURCE_LABELS: Record<SourceKey, string> = {
  pipeline: "CSR Pipeline Tracker",
  companies: "IT/ITeS Companies Tracker",
  donors: "Donor CRM",
};

const ENV_BY_SOURCE: Record<SourceKey, string> = {
  pipeline: "NOTION_PIPELINE_DB_ID",
  companies: "NOTION_COMPANIES_DB_ID",
  donors: "NOTION_DONORS_DB_ID",
};

/** Notion's Flag option labels to the short keys the app stores. */
const FLAG_TO_KEY: Record<string, string> = {
  "⭐ starred": "starred",
  "✅ existing donor": "donor",
  "🚫 not relevant": "not-relevant",
};

export const FLAG_TO_NOTION: Record<string, string> = {
  starred: "⭐ Starred",
  donor: "✅ Existing Donor",
  "not-relevant": "🚫 Not Relevant",
};

/** Property names that hold free-text notes, in the order we prefer them. */
const NOTE_PROPS = ["Notes", "Comments/Notes", "Notes & Key Contacts"];

/** Notion multi-select labels to the theme keys the UI uses. */
const THEME_KEYS: Record<string, string> = {
  "vocational education": "vocational",
  "women empowerment": "women",
  livelihood: "livelihood",
};

export class NotionConfigError extends Error {}

function getClient() {
  const auth = process.env.NOTION_TOKEN;
  if (!auth) {
    throw new NotionConfigError(
      "NOTION_TOKEN is not set. Create an internal integration at notion.so/my-integrations and add the token to .env.",
    );
  }
  return new Client({ auth });
}

export function getDatabaseId(source: SourceKey) {
  const envKey = ENV_BY_SOURCE[source];
  const id = process.env[envKey];
  if (!id) {
    throw new NotionConfigError(
      `${envKey} is not set. Copy the database ID out of its Notion URL and add it to .env.`,
    );
  }
  return id;
}

export function configuredSources(): SourceKey[] {
  if (!process.env.NOTION_TOKEN) return [];
  return (Object.keys(ENV_BY_SOURCE) as SourceKey[]).filter(
    (source) => !!process.env[ENV_BY_SOURCE[source]],
  );
}

/**
 * API version 2025-09-03 moved rows off databases and onto data sources, so a
 * database ID has to be exchanged for the ID of the data source underneath it.
 */
async function resolveDataSourceId(client: Client, databaseId: string) {
  const database = await client.databases.retrieve({ database_id: databaseId });
  const dataSources = "data_sources" in database ? database.data_sources : [];
  if (!dataSources.length) {
    throw new NotionConfigError(
      `Notion database ${databaseId} has no data sources. Check that the integration has access to it.`,
    );
  }
  return dataSources[0].id;
}

async function queryAllPages(client: Client, dataSourceId: string) {
  const pages: PageObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    const response = await client.dataSources.query({
      data_source_id: dataSourceId,
      start_cursor: cursor,
      page_size: 100,
    });
    pages.push(...response.results.filter(isFullPage));
    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return pages;
}

type Props = PageObjectResponse["properties"];

function findProp(props: Props, names: string[]) {
  for (const name of names) {
    if (props[name]) return props[name];
  }
  return undefined;
}

function readText(props: Props, names: string[]) {
  const prop = findProp(props, names);
  if (!prop) return null;
  if (prop.type === "rich_text") {
    return prop.rich_text.map((t) => t.plain_text).join("").trim() || null;
  }
  if (prop.type === "title") {
    return prop.title.map((t) => t.plain_text).join("").trim() || null;
  }
  return null;
}

function readTitle(props: Props) {
  for (const prop of Object.values(props)) {
    if (prop.type === "title") {
      return prop.title.map((t) => t.plain_text).join("").trim() || null;
    }
  }
  return null;
}

function readSelect(props: Props, names: string[]) {
  const prop = findProp(props, names);
  if (prop?.type === "select") return prop.select?.name ?? null;
  if (prop?.type === "status") return prop.status?.name ?? null;
  return null;
}

function readMultiSelect(props: Props, names: string[]) {
  const prop = findProp(props, names);
  if (prop?.type !== "multi_select") return null;
  return JSON.stringify(prop.multi_select.map((option) => option.name));
}

function readDate(props: Props, names: string[]) {
  const prop = findProp(props, names);
  if (prop?.type !== "date" || !prop.date?.start) return null;
  return new Date(prop.date.start);
}

function mapPage(page: PageObjectResponse, source: SourceKey) {
  const props = page.properties;

  return {
    notionId: page.id,
    source,
    name: readTitle(props) ?? "(untitled)",
    stage: readSelect(props, ["Stage"]),
    sector: readSelect(props, ["Sector"]),
    status: readSelect(props, ["Status"]),
    connectionStatus: readSelect(props, ["Connection Status"]),
    programs: readMultiSelect(props, ["Program", "Programs"]),
    notes: readText(props, ["Notes", "Comments/Notes"]),
    keyContacts: readText(props, ["Notes & Key Contacts", "Key Contacts", "Key Contact"]),
    nextAction: readText(props, ["Next Action"]),
    nextActionDate: readDate(props, ["Next Action Date", "Next Touch Date"]),
    owner: readSelect(props, ["Account Owner", "Owner"]),
    contactDetails: readText(props, ["Contact Details"]),
    pitchAngle: readText(props, ["Pitch Angle"]),
    routeIn: readText(props, ["Route In"]),
    boardConnection: readText(props, ["Board Connection"]),
    csrBudget: readSelect(props, ["CSR Budget"]) ?? readText(props, ["CSR Budget"]),
    priority: readSelect(props, ["Priority"]),
    lastTouch: readDate(props, ["Last Touch"]),
    flag: FLAG_TO_KEY[(readSelect(props, ["Flag"]) ?? "").toLowerCase()] ?? null,
    notionUrl: page.url,
    lastEditedAt: new Date(page.last_edited_time),
    syncedAt: new Date(),
  };
}

/**
 * Seed the funder-vs-self-implementer read for a freshly synced row. Never
 * overwrites an assessment someone has already edited by hand.
 */
async function applyDefaultAssessment(data: ReturnType<typeof mapPage>) {
  const existing = await prisma.prospectAssessment.findUnique({
    where: { notionId: data.notionId },
  });
  if (existing) return;

  const guess = lookupAssessment(
    data.name,
    [data.notes, data.keyContacts].filter(Boolean).join(" "),
  );
  if (!guess) return;

  await prisma.prospectAssessment.create({
    data: { notionId: data.notionId, ...guess },
  });
}

export async function syncSource(source: SourceKey) {
  const run = await prisma.syncRun.create({
    data: { source, status: "running" },
  });

  try {
    const client = getClient();
    const dataSourceId = await resolveDataSourceId(client, getDatabaseId(source));
    const pages = await queryAllPages(client, dataSourceId);

    for (const page of pages) {
      const data = mapPage(page, source);
      await prisma.prospect.upsert({
        where: { notionId: data.notionId },
        create: data,
        update: data,
      });
      await applyDefaultAssessment(data);
    }

    // Rows deleted in Notion should not linger in the local mirror.
    await prisma.prospect.deleteMany({
      where: { source, notionId: { notIn: pages.map((page) => page.id) } },
    });

    await prisma.syncRun.update({
      where: { id: run.id },
      data: { status: "success", recordsIn: pages.length, finishedAt: new Date() },
    });

    return { source, count: pages.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.syncRun.update({
      where: { id: run.id },
      data: { status: "error", error: message, finishedAt: new Date() },
    });
    throw error;
  }
}

/**
 * Writes the Flag select back to the row's Notion page, then mirrors it
 * locally so the UI updates without waiting for the next sync.
 */
export async function setProspectFlag(notionId: string, flag: string | null) {
  const client = getClient();
  const label = flag ? FLAG_TO_NOTION[flag] : null;
  if (flag && !label) throw new Error(`Unknown flag "${flag}"`);

  await client.pages.update({
    page_id: notionId,
    properties: { Flag: { select: label ? { name: label } : null } } as never,
  });

  await prisma.prospect.update({ where: { notionId }, data: { flag } });
}

/** Finds whichever notes-ish rich_text property this database actually has. */
function notesPropertyName(props: Props) {
  for (const name of NOTE_PROPS) {
    if (props[name]?.type === "rich_text") return name;
  }
  return null;
}

/** Notes are written straight back to Notion so the team sees them there too. */
export async function setProspectNotes(notionId: string, text: string) {
  const client = getClient();
  const page = await client.pages.retrieve({ page_id: notionId });
  if (!("properties" in page)) throw new Error("Could not read that Notion page");

  const property = notesPropertyName(page.properties);
  if (!property) {
    throw new Error("That Notion database has no notes property to write into.");
  }

  await client.pages.update({
    page_id: notionId,
    properties: {
      [property]: { rich_text: [{ text: { content: text.slice(0, 1900) } }] },
    } as never,
  });

  await prisma.prospect.update({ where: { notionId }, data: { notes: text || null } });
}

/**
 * Research rows that came from Notion push their notes back; locally-added ones
 * just save to the database.
 */
export async function setResearchNotes(companyId: string, text: string) {
  const company = await prisma.researchCompany.findUnique({ where: { id: companyId } });
  if (!company) throw new Error("Research company not found");

  if (company.notionPageUrl && process.env.NOTION_TOKEN) {
    const pageId = company.notionPageUrl.split("/").pop()?.split("-").pop();
    if (pageId) {
      const client = getClient();
      await client.pages.update({
        page_id: pageId,
        properties: {
          Notes: { rich_text: [{ text: { content: text.slice(0, 1900) } }] },
        } as never,
      });
    }
  }

  return prisma.researchCompany.update({
    where: { id: companyId },
    data: { notes: text || null },
  });
}

function readUrl(props: Props, names: string[]) {
  const prop = findProp(props, names);
  if (prop?.type === "url") return prop.url;
  return null;
}

function readThemes(props: Props, names: string[]) {
  const prop = findProp(props, names);
  if (prop?.type !== "multi_select") return "[]";
  const keys = prop.multi_select
    .map((option) => THEME_KEYS[option.name.toLowerCase()])
    .filter(Boolean);
  return JSON.stringify(keys);
}

/**
 * Notion holds named leads as free text, one per line. Split on the first dash
 * so the UI has a name to show, and keep the remainder as the title.
 */
function parseLeads(text: string | null) {
  if (!text) return [];
  return text
    .split("\n")
    .map((line) => line.replace(/^[•\-*]\s*/, "").trim())
    .filter(Boolean)
    .map((line) => {
      const [name, ...rest] = line.split(/\s+[—–-]\s+/);
      return { name: name.trim(), title: rest.join(" — ").trim() || null };
    })
    .filter((lead) => lead.name);
}

/**
 * Pulls the Research Pipeline database — the one the scheduled Claude Code
 * routine writes into — so agent findings show up in the Research tab without
 * the app needing an Anthropic key of its own.
 */
export async function syncResearchPipeline() {
  const databaseId = process.env.NOTION_RESEARCH_DB_ID;
  if (!databaseId) {
    throw new NotionConfigError(
      "NOTION_RESEARCH_DB_ID is not set. Copy the Research Pipeline database ID out of its Notion URL and add it to .env.",
    );
  }

  const run = await prisma.syncRun.create({
    data: { source: "research", status: "running" },
  });

  try {
    const client = getClient();
    const dataSourceId = await resolveDataSourceId(client, databaseId);
    const pages = await queryAllPages(client, dataSourceId);

    for (const page of pages) {
      const props = page.properties;
      const name = readTitle(props);
      if (!name) continue;

      const leadsText = readText(props, ["Named Leads"]);
      const sourceUrl = readUrl(props, ["Sources"]);

      const data = {
        name,
        sector: readText(props, ["Sector"]) ?? "Unknown",
        hqCity: readText(props, ["HQ City"]),
        csrBudget: readText(props, ["CSR Budget"]),
        csrFocus: readText(props, ["CSR Focus"]),
        themes: readThemes(props, ["Themes"]),
        deliveryModel: readSelect(props, ["Funding Model"]) ?? "Unknown",
        grantLikelihood: readSelect(props, ["Grant Odds"]) ?? "Medium",
        externalGrantEvidence: readText(props, ["Evidence It Funds Outsiders"]),
        iitConnect: readText(props, ["IIT Connection"]),
        warmPath: readText(props, ["Warm Path"]),
        fitRationale: readText(props, ["Why It Fits"]),
        priority: readSelect(props, ["Priority"]) ?? "Tier 3",
        status: readSelect(props, ["Review Status"]) ?? "New",
        sourceUrls: JSON.stringify(sourceUrl ? [sourceUrl] : []),
        notes: readText(props, ["Notes"]),
        notionPageUrl: page.url,
        discoveredBy: "notion",
      };

      const existing = await prisma.researchCompany.findUnique({ where: { name } });
      const company = existing
        ? await prisma.researchCompany.update({ where: { name }, data })
        : await prisma.researchCompany.create({ data });

      // Leads are rebuilt from the Notion text each sync — Notion is the source
      // of truth for this database, so a removed line should disappear here too.
      const leads = parseLeads(leadsText);
      if (leads.length) {
        await prisma.researchLead.deleteMany({ where: { companyId: company.id } });
        await prisma.researchLead.createMany({
          data: leads.map((lead) => ({ ...lead, companyId: company.id })),
        });
      }
    }

    await prisma.syncRun.update({
      where: { id: run.id },
      data: { status: "success", recordsIn: pages.length, finishedAt: new Date() },
    });

    return { source: "research" as const, count: pages.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.syncRun.update({
      where: { id: run.id },
      data: { status: "error", error: message, finishedAt: new Date() },
    });
    throw error;
  }
}

export function researchPipelineConfigured() {
  return !!process.env.NOTION_TOKEN && !!process.env.NOTION_RESEARCH_DB_ID;
}

export async function syncAll() {
  const sources = configuredSources();
  if (!sources.length && !researchPipelineConfigured()) {
    throw new NotionConfigError(
      "No Notion databases are configured. Set NOTION_TOKEN plus NOTION_PIPELINE_DB_ID and/or NOTION_COMPANIES_DB_ID in .env.",
    );
  }

  const results = [];
  for (const source of sources) {
    results.push(await syncSource(source));
  }
  if (researchPipelineConfigured()) {
    results.push(await syncResearchPipeline());
  }
  return results;
}

/**
 * Promote an approved research company into the Notion pipeline so the rest of
 * the team sees it where they already work.
 */
export async function pushResearchCompanyToNotion(companyId: string) {
  const company = await prisma.researchCompany.findUnique({
    where: { id: companyId },
    include: { leads: true },
  });
  if (!company) throw new Error("Research company not found");

  const client = getClient();
  const dataSourceId = await resolveDataSourceId(client, getDatabaseId("pipeline"));
  const dataSource = await client.dataSources.retrieve({ data_source_id: dataSourceId });

  const schema = dataSource.properties;
  const titleKey =
    Object.keys(schema).find((key) => schema[key].type === "title") ?? "Name";

  const leadSummary = company.leads
    .map((lead) =>
      [lead.name, lead.title, lead.iitAffiliation, lead.warmPath]
        .filter(Boolean)
        .join(" — "),
    )
    .join("\n");

  const notes = [
    company.fitRationale,
    company.csrBudget ? `CSR budget: ${company.csrBudget}` : null,
    company.warmPath ? `Warm path: ${company.warmPath}` : null,
    leadSummary ? `Leads:\n${leadSummary}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const properties: Record<string, unknown> = {
    [titleKey]: { title: [{ text: { content: company.name } }] },
  };

  const sectorProp = schema["Sector"];
  if (sectorProp?.type === "select") {
    const match = sectorProp.select.options.find(
      (option) => option.name.toLowerCase() === company.sector.toLowerCase(),
    );
    if (match) properties["Sector"] = { select: { name: match.name } };
  }

  const stageProp = schema["Stage"];
  if (stageProp?.type === "select") {
    const match = stageProp.select.options.find(
      (option) => option.name.toLowerCase() === "prospecting",
    );
    if (match) properties["Stage"] = { select: { name: match.name } };
  }

  if (schema["Notes"]?.type === "rich_text" && notes) {
    properties["Notes"] = { rich_text: [{ text: { content: notes.slice(0, 1900) } }] };
  }

  const page = await client.pages.create({
    parent: { type: "data_source_id", data_source_id: dataSourceId },
    // The Notion SDK types property payloads per-schema; this map is built from
    // the live schema above, which the static types cannot express.
    properties: properties as never,
  });

  const url = "url" in page ? page.url : null;
  await prisma.researchCompany.update({
    where: { id: companyId },
    data: { status: "Pushed to Notion", notionPageUrl: url },
  });

  return { url };
}
