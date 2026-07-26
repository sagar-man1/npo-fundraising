import { prisma } from "@/lib/db";
import { DELIVERY_MODELS, GRANT_LIKELIHOODS } from "@/lib/deliveryModels";

export async function PUT(request: Request) {
  const body = await request.json();
  const { notionId, deliveryModel, grantLikelihood, rationale } = body ?? {};

  if (typeof notionId !== "string" || !notionId) {
    return Response.json({ error: "notionId is required" }, { status: 400 });
  }
  if (!DELIVERY_MODELS.includes(deliveryModel)) {
    return Response.json({ error: "Invalid deliveryModel" }, { status: 400 });
  }
  if (!GRANT_LIKELIHOODS.includes(grantLikelihood)) {
    return Response.json({ error: "Invalid grantLikelihood" }, { status: 400 });
  }

  const prospect = await prisma.prospect.findUnique({ where: { notionId } });
  if (!prospect) {
    return Response.json({ error: "Prospect not found" }, { status: 404 });
  }

  const data = {
    deliveryModel,
    grantLikelihood,
    rationale: typeof rationale === "string" ? rationale : null,
  };

  const assessment = await prisma.prospectAssessment.upsert({
    where: { notionId },
    create: { notionId, ...data },
    update: data,
  });

  return Response.json(assessment);
}
