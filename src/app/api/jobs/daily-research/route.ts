import { safeEqual } from "@/lib/auth";
import { runDailyResearch } from "@/lib/jobs/dailyResearch";

export const maxDuration = 900;

/**
 * Manual or external trigger for the morning run. The in-process scheduler
 * calls runDailyResearch directly; this exists for the UI button and for any
 * external cron that would rather hit an endpoint.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = request.headers.get("x-cron-secret") ?? "";
    if (!safeEqual(provided, secret)) {
      return Response.json({ error: "Unauthorised" }, { status: 401 });
    }
  }

  const body = await request.json().catch(() => ({}));
  const notify = body?.notify !== false;

  try {
    const result = await runDailyResearch({
      notify,
      focus: typeof body?.focus === "string" ? body.focus : undefined,
    });

    return Response.json({
      ok: true,
      found: result.companies.length,
      companies: result.companies.map((company) => company.name),
      notified: result.notified,
      deliveryError: result.deliveryError,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Research failed";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
