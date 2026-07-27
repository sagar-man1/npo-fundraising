import { NotionConfigError, syncAll } from "@/lib/notion";

export async function POST() {
  try {
    const results = await syncAll();
    return Response.json({ ok: true, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    const status = error instanceof NotionConfigError ? 400 : 502;
    return Response.json({ ok: false, error: message }, { status });
  }
}
