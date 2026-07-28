import { prisma } from "@/lib/db";
import { DELIVERY_MODELS, GRANT_LIKELIHOODS } from "@/lib/deliveryModels";
import { setResearchNotes } from "@/lib/notion";

const PRIORITIES = ["Tier 1", "Tier 2", "Tier 3"];
const STATUSES = ["New", "Reviewing", "Approved", "Rejected", "Pushed to Notion"];
const THEMES = ["vocational", "women", "livelihood"];

const TEXT_FIELDS = [
  "name",
  "sector",
  "hqCity",
  "csrBudget",
  "csrFocus",
  "iitConnect",
  "warmPath",
  "fitRationale",
  "externalGrantEvidence",
  "notes",
] as const;

export async function PATCH(request: Request, ctx: RouteContext<"/api/research/[id]">) {
  const { id } = await ctx.params;
  const body = (await request.json()) ?? {};
  const data: Record<string, unknown> = {};

  for (const field of TEXT_FIELDS) {
    const value = body[field];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (field === "name" || field === "sector") {
        if (trimmed) data[field] = trimmed;
      } else {
        data[field] = trimmed || null;
      }
    }
  }

  if (Array.isArray(body.themes)) {
    data.themes = JSON.stringify(
      body.themes.filter((t: unknown): t is string => typeof t === "string" && THEMES.includes(t)),
    );
  }

  const enums: Array<[string, string[]]> = [
    ["deliveryModel", DELIVERY_MODELS],
    ["grantLikelihood", GRANT_LIKELIHOODS],
    ["priority", PRIORITIES],
    ["status", STATUSES],
  ];
  for (const [field, allowed] of enums) {
    if (typeof body[field] === "string" && allowed.includes(body[field])) {
      data[field] = body[field];
    }
  }

  // Notes go back to Notion when the row came from there, so handle separately.
  if (typeof body.notes === "string") {
    delete data.notes;
    try {
      await setResearchNotes(id, body.notes);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save notes";
      return Response.json({ error: message }, { status: 502 });
    }
  }

  if (!Object.keys(data).length) {
    const current = await prisma.researchCompany.findUnique({
      where: { id },
      include: { leads: true },
    });
    return Response.json(current);
  }

  const company = await prisma.researchCompany.update({
    where: { id },
    data,
    include: { leads: true },
  });
  return Response.json(company);
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/research/[id]">) {
  const { id } = await ctx.params;
  await prisma.researchCompany.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
