import { Dashboard } from "@/components/Dashboard";
import { prisma } from "@/lib/db";
import { parseJsonArray } from "@/lib/format";
import { configuredSources } from "@/lib/notion";
import type { JobRunRow, ProspectRow, ResearchCompanyRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [prospects, companies, lastSync, lastJob] = await Promise.all([
    prisma.prospect.findMany({
      include: { assessment: true },
      orderBy: [{ source: "asc" }, { name: "asc" }],
    }),
    prisma.researchCompany.findMany({
      include: { leads: { orderBy: { createdAt: "asc" } } },
      orderBy: [{ priority: "asc" }, { name: "asc" }],
    }),
    prisma.syncRun.findFirst({
      where: { status: "success" },
      orderBy: { finishedAt: "desc" },
    }),
    prisma.jobRun.findFirst({
      where: { job: "daily-research", NOT: { finishedAt: null } },
      orderBy: { finishedAt: "desc" },
    }),
  ]);

  const prospectRows: ProspectRow[] = prospects.map((prospect) => ({
    id: prospect.id,
    notionId: prospect.notionId,
    source: prospect.source,
    name: prospect.name,
    stage: prospect.stage,
    sector: prospect.sector,
    status: prospect.status,
    connectionStatus: prospect.connectionStatus,
    programs: parseJsonArray(prospect.programs),
    notes: prospect.notes,
    keyContacts: prospect.keyContacts,
    nextAction: prospect.nextAction,
    nextActionDate: prospect.nextActionDate?.toISOString() ?? null,
    notionUrl: prospect.notionUrl,
    deliveryModel: prospect.assessment?.deliveryModel ?? "Unknown",
    grantLikelihood: prospect.assessment?.grantLikelihood ?? "Medium",
    rationale: prospect.assessment?.rationale ?? null,
  }));

  const companyRows: ResearchCompanyRow[] = companies.map((company) => ({
    id: company.id,
    name: company.name,
    sector: company.sector,
    hqCity: company.hqCity,
    csrBudget: company.csrBudget,
    csrFocus: company.csrFocus,
    themes: parseJsonArray(company.themes),
    iitConnect: company.iitConnect,
    warmPath: company.warmPath,
    fitRationale: company.fitRationale,
    deliveryModel: company.deliveryModel,
    grantLikelihood: company.grantLikelihood,
    externalGrantEvidence: company.externalGrantEvidence,
    priority: company.priority,
    status: company.status,
    sourceUrls: parseJsonArray(company.sourceUrls),
    notes: company.notes,
    notionPageUrl: company.notionPageUrl,
    discoveredBy: company.discoveredBy,
    createdAt: company.createdAt.toISOString(),
    leads: company.leads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      title: lead.title,
      role: lead.role,
      iitAffiliation: lead.iitAffiliation,
      linkedinUrl: lead.linkedinUrl,
      email: lead.email,
      warmPath: lead.warmPath,
      notes: lead.notes,
      status: lead.status,
    })),
  }));

  const lastJobRow: JobRunRow | null = lastJob
    ? {
        status: lastJob.status,
        found: lastJob.found,
        notified: lastJob.notified,
        summary: lastJob.summary,
        error: lastJob.error,
        finishedAt: lastJob.finishedAt?.toISOString() ?? null,
      }
    : null;

  return (
    <Dashboard
      prospects={prospectRows}
      companies={companyRows}
      lastSyncAt={lastSync?.finishedAt?.toISOString() ?? null}
      notionConfigured={configuredSources().length > 0}
      lastJob={lastJobRow}
    />
  );
}
