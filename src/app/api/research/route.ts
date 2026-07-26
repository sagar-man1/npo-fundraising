import { prisma } from "@/lib/db";
import { DELIVERY_MODELS, GRANT_LIKELIHOODS } from "@/lib/deliveryModels";

const PRIORITIES = ["Tier 1", "Tier 2", "Tier 3"];
const STATUSES = ["New", "Reviewing", "Approved", "Rejected", "Pushed to Notion"];
const THEMES = ["vocational", "women", "livelihood"];

export async function GET() {
  const companies = await prisma.researchCompany.findMany({
    include: { leads: { orderBy: { createdAt: "asc" } } },
    orderBy: [{ priority: "asc" }, { name: "asc" }],
  });
  return Response.json(companies);
}

function parseCompanyInput(body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const sector = typeof body.sector === "string" ? body.sector.trim() : "";
  if (!name) return { error: "Company name is required" as const };
  if (!sector) return { error: "Sector is required" as const };

  const themes = Array.isArray(body.themes)
    ? body.themes.filter((t): t is string => typeof t === "string" && THEMES.includes(t))
    : [];

  const optional = (key: string) => {
    const value = body[key];
    return typeof value === "string" && value.trim() ? value.trim() : null;
  };

  const oneOf = (key: string, allowed: string[], fallback: string) => {
    const value = body[key];
    return typeof value === "string" && allowed.includes(value) ? value : fallback;
  };

  return {
    data: {
      name,
      sector,
      hqCity: optional("hqCity"),
      csrBudget: optional("csrBudget"),
      csrFocus: optional("csrFocus"),
      themes: JSON.stringify(themes),
      iitConnect: optional("iitConnect"),
      warmPath: optional("warmPath"),
      fitRationale: optional("fitRationale"),
      externalGrantEvidence: optional("externalGrantEvidence"),
      notes: optional("notes"),
      deliveryModel: oneOf("deliveryModel", DELIVERY_MODELS, "Unknown"),
      grantLikelihood: oneOf("grantLikelihood", GRANT_LIKELIHOODS, "Medium"),
      priority: oneOf("priority", PRIORITIES, "Tier 3"),
      status: oneOf("status", STATUSES, "New"),
    },
  };
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = parseCompanyInput(body ?? {});
  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const existing = await prisma.researchCompany.findUnique({
    where: { name: parsed.data.name },
  });
  if (existing) {
    return Response.json({ error: "A company with that name already exists" }, { status: 409 });
  }

  const company = await prisma.researchCompany.create({
    data: parsed.data,
    include: { leads: true },
  });
  return Response.json(company, { status: 201 });
}
