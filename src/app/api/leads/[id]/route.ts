import { prisma } from "@/lib/db";

const ROLES = ["Decision maker", "CSR lead", "Alumni connector", "Influencer"];
const STATUSES = ["New", "Verified", "Contacted", "Dropped"];

const TEXT_FIELDS = [
  "name",
  "title",
  "iitAffiliation",
  "linkedinUrl",
  "email",
  "warmPath",
  "notes",
] as const;

export async function PATCH(request: Request, ctx: RouteContext<"/api/leads/[id]">) {
  const { id } = await ctx.params;
  const body = (await request.json()) ?? {};
  const data: Record<string, unknown> = {};

  for (const field of TEXT_FIELDS) {
    const value = body[field];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (field === "name") {
        if (trimmed) data.name = trimmed;
      } else {
        data[field] = trimmed || null;
      }
    }
  }

  if (typeof body.role === "string" && ROLES.includes(body.role)) data.role = body.role;
  if (typeof body.status === "string" && STATUSES.includes(body.status)) data.status = body.status;

  if (!Object.keys(data).length) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  const lead = await prisma.researchLead.update({ where: { id }, data });
  return Response.json(lead);
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/leads/[id]">) {
  const { id } = await ctx.params;
  await prisma.researchLead.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
