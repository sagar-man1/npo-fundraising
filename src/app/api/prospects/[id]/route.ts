import { prisma } from "@/lib/db";
import { NotionConfigError, setProspectFlag, setProspectNotes } from "@/lib/notion";

const FLAGS = ["starred", "donor", "not-relevant"];

/**
 * Updates a synced row. Both fields write straight through to Notion so the
 * tracker stays the shared source of truth, then mirror locally.
 * The [id] here is the Notion page ID.
 */
export async function PATCH(request: Request, ctx: RouteContext<"/api/prospects/[id]">) {
  const { id } = await ctx.params;
  const body = (await request.json()) ?? {};

  const prospect = await prisma.prospect.findUnique({ where: { notionId: id } });
  if (!prospect) return Response.json({ error: "Not found" }, { status: 404 });

  try {
    if ("flag" in body) {
      const flag = body.flag;
      if (flag !== null && !FLAGS.includes(flag)) {
        return Response.json({ error: "Invalid flag" }, { status: 400 });
      }
      // Clicking the active flag again clears it.
      await setProspectFlag(id, prospect.flag === flag ? null : flag);
    }

    if (typeof body.notes === "string") {
      await setProspectNotes(id, body.notes);
    }

    const updated = await prisma.prospect.findUnique({ where: { notionId: id } });
    return Response.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    const status = error instanceof NotionConfigError ? 400 : 502;
    return Response.json({ error: message }, { status });
  }
}
