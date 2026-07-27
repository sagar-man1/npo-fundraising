import { prisma } from "@/lib/db";

const ROLES = ["Decision maker", "CSR lead", "Alumni connector", "Influencer"];

export async function POST(request: Request, ctx: RouteContext<"/api/research/[id]/leads">) {
  const { id } = await ctx.params;
  const body = (await request.json()) ?? {};

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return Response.json({ error: "Lead name is required" }, { status: 400 });

  const company = await prisma.researchCompany.findUnique({ where: { id } });
  if (!company) return Response.json({ error: "Company not found" }, { status: 404 });

  const optional = (key: string) => {
    const value = body[key];
    return typeof value === "string" && value.trim() ? value.trim() : null;
  };

  const lead = await prisma.researchLead.create({
    data: {
      companyId: id,
      name,
      title: optional("title"),
      role: ROLES.includes(body.role) ? body.role : null,
      iitAffiliation: optional("iitAffiliation"),
      linkedinUrl: optional("linkedinUrl"),
      email: optional("email"),
      warmPath: optional("warmPath"),
      notes: optional("notes"),
    },
  });

  return Response.json(lead, { status: 201 });
}
