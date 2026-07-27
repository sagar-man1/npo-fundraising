import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import * as z from "zod/v4";
import { prisma } from "../db";

/**
 * Finds companies that are not already in the pipeline and could plausibly fund
 * PARFI. The screen that matters is delivery model: a company running its own
 * training institutes spends its skilling budget internally and is a weak grant
 * prospect no matter how large that budget is.
 */

const MODEL = "claude-opus-5";

const ProspectSchema = z.object({
  name: z.string(),
  sector: z.string(),
  hqCity: z.string(),
  csrBudget: z.string(),
  csrFocus: z.string(),
  themes: z.array(z.enum(["vocational", "women", "livelihood"])),
  deliveryModel: z.enum(["Grant-maker", "Mixed", "Self-implementer", "Unknown"]),
  grantLikelihood: z.enum(["High", "Medium", "Low"]),
  externalGrantEvidence: z.string(),
  iitConnect: z.string(),
  warmPath: z.string(),
  fitRationale: z.string(),
  priority: z.enum(["Tier 1", "Tier 2", "Tier 3"]),
  sourceUrls: z.array(z.string()),
  leads: z.array(
    z.object({
      name: z.string(),
      title: z.string(),
      role: z.enum(["Decision maker", "CSR lead", "Alumni connector", "Influencer"]),
      iitAffiliation: z.string(),
      warmPath: z.string(),
      notes: z.string(),
    }),
  ),
});

const ResultSchema = z.object({
  prospects: z.array(ProspectSchema),
  notes: z.string(),
});

export type DiscoveredProspect = z.infer<typeof ProspectSchema>;

export class ResearchConfigError extends Error {}

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new ResearchConfigError(
      "ANTHROPIC_API_KEY is not set. Add it to .env so the daily research job can run.",
    );
  }
  return new Anthropic();
}

const BRIEF = `You are a fundraising researcher for the PanIIT Alumni Foundation (PARFI), an
Indian non-profit that builds vocational education at scale: ITI Skill Gurukuls,
ANM/nursing training, and placement-linked livelihood programmes, with a strong
women's participation mandate.

You are looking for NEW corporate CSR prospects in India, and for named people to
approach inside them.

The single most important screen — apply it ruthlessly:

A company that runs its own training institutes is a WEAK prospect no matter how
large its CSR budget. It spends that budget on its own centres and is a peer to
PARFI, not a funder. Tech Mahindra (SMART Academies), L&T (CSTI), Bosch (BRIDGE),
NIIT Foundation, ICICI (Academy for Skills), Reliance Foundation, Adani (Saksham)
and Bharti (Satya Bharti Schools) are all examples of this trap. Mark these
"Self-implementer" with "Low" grant odds, and prefer not to surface them at all.

What you actually want: companies that GRANT money to external NGOs to deliver.
The strongest evidence is a named grant to a named outside organisation. If you
cannot find such evidence, say so honestly in externalGrantEvidence and set
deliveryModel to "Unknown" rather than guessing.

Also value: an IIT alumni connection in senior leadership, a Bengaluru or Mumbai
head office, and CSR themes covering vocational education, women's empowerment,
or livelihoods.

For each company, name real people to approach — decision makers, CSR heads, or
IIT alumni who could open the door. Use only publicly reported names and titles.
Never invent an email address or phone number; leave those out entirely.`;

function buildPrompt(exclude: string[], focus: string | undefined) {
  return `${BRIEF}

Research task for today${focus ? ` — focus area: ${focus}` : ""}:

Search the web for current information and find up to 4 NEW prospects.

These companies are ALREADY in the pipeline. Do not return any of them, and do
not return a subsidiary or foundation of one of them:

${exclude.map((name) => `- ${name}`).join("\n")}

Prefer companies whose CSR is genuinely disbursed to outside NGOs. Quality beats
quantity: returning 2 well-evidenced grant-makers is better than 4 speculative
entries. If you cannot find 4 that clear the bar, return fewer.

For every claim about budgets, programmes or people, rely on what you actually
found in search results, and put the URLs you used in sourceUrls. Where you are
unsure, say so in the relevant field rather than asserting it.`;
}

async function runResearch(client: Anthropic, exclude: string[], focus?: string) {
  // Streaming keeps a long web-search run from hitting the request timeout.
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    thinking: { type: "adaptive" },
    output_config: { effort: "high" },
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 12 }],
    messages: [{ role: "user", content: buildPrompt(exclude, focus) }],
  });

  let message = await stream.finalMessage();

  // Server-side tool loops pause after a set number of iterations; resend to resume.
  const conversation: Anthropic.MessageParam[] = [
    { role: "user", content: buildPrompt(exclude, focus) },
  ];
  let guard = 0;
  while (message.stop_reason === "pause_turn" && guard < 5) {
    guard += 1;
    conversation.push({ role: "assistant", content: message.content });
    const resumed = client.messages.stream({
      model: MODEL,
      max_tokens: 32000,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 12 }],
      messages: conversation,
    });
    message = await resumed.finalMessage();
  }

  if (message.stop_reason === "refusal") {
    throw new Error("Research request was declined by the model's safety classifiers.");
  }

  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

/** Second pass: turn the research narrative into rows we can store. */
async function structure(client: Anthropic, research: string) {
  const message = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    output_config: { format: zodOutputFormat(ResultSchema) },
    messages: [
      {
        role: "user",
        content: `Convert this fundraising research into structured records. Use only
what the research states — do not add companies, people, or facts it does not
mention. Leave a field as an empty string when the research does not support it.

${research}`,
      },
    ],
  });

  return message.parsed_output ?? { prospects: [], notes: "" };
}

function normalise(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Runs one research pass and stores whatever is genuinely new.
 * Returns the companies that were inserted, for the morning message.
 */
export async function discoverProspects(options: { focus?: string; limit?: number } = {}) {
  const client = getClient();

  const [existingResearch, existingProspects] = await Promise.all([
    prisma.researchCompany.findMany({ select: { name: true } }),
    prisma.prospect.findMany({ select: { name: true } }),
  ]);

  const known = [
    ...existingResearch.map((row) => row.name),
    ...existingProspects.map((row) => row.name),
  ];
  const knownKeys = new Set(known.map(normalise));

  const research = await runResearch(client, known, options.focus);
  const { prospects } = await structure(client, research);

  const fresh = prospects
    .filter((prospect) => prospect.name.trim() && !knownKeys.has(normalise(prospect.name)))
    .slice(0, options.limit ?? 4);

  const created = [];
  for (const prospect of fresh) {
    // A second check: the same name may have arrived earlier in this loop.
    const clash = await prisma.researchCompany.findUnique({
      where: { name: prospect.name },
    });
    if (clash) continue;

    const company = await prisma.researchCompany.create({
      data: {
        name: prospect.name,
        sector: prospect.sector || "Unknown",
        hqCity: prospect.hqCity || null,
        csrBudget: prospect.csrBudget || null,
        csrFocus: prospect.csrFocus || null,
        themes: JSON.stringify(prospect.themes),
        deliveryModel: prospect.deliveryModel,
        grantLikelihood: prospect.grantLikelihood,
        externalGrantEvidence: prospect.externalGrantEvidence || null,
        iitConnect: prospect.iitConnect || null,
        warmPath: prospect.warmPath || null,
        fitRationale: prospect.fitRationale || null,
        priority: prospect.priority,
        sourceUrls: JSON.stringify(prospect.sourceUrls ?? []),
        discoveredBy: "agent",
        leads: {
          create: prospect.leads
            .filter((lead) => lead.name.trim())
            .map((lead) => ({
              name: lead.name,
              title: lead.title || null,
              role: lead.role,
              iitAffiliation: lead.iitAffiliation || null,
              warmPath: lead.warmPath || null,
              notes: lead.notes || null,
            })),
        },
      },
      include: { leads: true },
    });

    created.push(company);
  }

  return created;
}
