import { NotionConfigError, pushResearchCompanyToNotion } from "@/lib/notion";

export async function POST(_request: Request, ctx: RouteContext<"/api/research/[id]/push">) {
  const { id } = await ctx.params;
  try {
    const result = await pushResearchCompanyToNotion(id);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Push failed";
    const status = error instanceof NotionConfigError ? 400 : 502;
    return Response.json({ ok: false, error: message }, { status });
  }
}
