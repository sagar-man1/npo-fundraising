"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, deliveryTone, likelihoodTone, priorityTone } from "./Badge";
import { AddCompanyForm } from "./AddCompanyForm";
import { NotesEditor } from "./NotesEditor";
import { DELIVERY_MODELS, DELIVERY_MODEL_HELP } from "@/lib/deliveryModels";
import { formatRelative, THEME_LABELS } from "@/lib/format";
import type { JobRunRow, ResearchCompanyRow } from "@/lib/types";

const STATUSES = ["New", "Reviewing", "Approved", "Rejected", "Pushed to Notion"];

type SortKey =
  | "priority"
  | "name"
  | "sector"
  | "deliveryModel"
  | "grantLikelihood"
  | "status"
  | "leads"
  | "newest";

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "priority", label: "Priority" },
  { key: "name", label: "Company" },
  { key: "sector", label: "Sector" },
  { key: "deliveryModel", label: "Funding model" },
  { key: "grantLikelihood", label: "Grant odds" },
  { key: "status", label: "Review status" },
  { key: "leads", label: "Named leads" },
  { key: "newest", label: "Newest first" },
];

/** Ranked so these sort by meaning rather than alphabetically. */
const MODEL_RANK = ["Grant-maker", "Mixed", "Unknown", "Self-implementer"];
const ODDS_RANK = ["High", "Medium", "Low"];
const STATUS_RANK = ["New", "Reviewing", "Approved", "Pushed to Notion", "Rejected"];

function byRank(rank: string[], a: string, b: string) {
  const ai = rank.indexOf(a);
  const bi = rank.indexOf(b);
  return (ai < 0 ? rank.length : ai) - (bi < 0 ? rank.length : bi);
}

type Sorter = (a: ResearchCompanyRow, b: ResearchCompanyRow) => number;

const SORTERS: Record<SortKey, Sorter> = {
  priority: (a, b) => a.priority.localeCompare(b.priority) || a.name.localeCompare(b.name),
  name: (a, b) => a.name.localeCompare(b.name),
  sector: (a, b) => a.sector.localeCompare(b.sector) || a.name.localeCompare(b.name),
  deliveryModel: (a, b) =>
    byRank(MODEL_RANK, a.deliveryModel, b.deliveryModel) || a.name.localeCompare(b.name),
  grantLikelihood: (a, b) =>
    byRank(ODDS_RANK, a.grantLikelihood, b.grantLikelihood) || a.name.localeCompare(b.name),
  status: (a, b) => byRank(STATUS_RANK, a.status, b.status) || a.name.localeCompare(b.name),
  leads: (a, b) => b.leads.length - a.leads.length || a.name.localeCompare(b.name),
  newest: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
};

function isFresh(company: ResearchCompanyRow) {
  if (!["agent", "notion"].includes(company.discoveredBy)) return false;
  const age = Date.now() - new Date(company.createdAt).getTime();
  return age < 36 * 60 * 60 * 1000;
}

export function ResearchTab({
  companies,
  notionConfigured,
  lastJob,
}: {
  companies: ResearchCompanyRow[];
  notionConfigured: boolean;
  lastJob: JobRunRow | null;
}) {
  const [query, setQuery] = useState("");
  const [modelFilter, setModelFilter] = useState("Grant-maker");
  const [showAdd, setShowAdd] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("priority");

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim();
    const rows = companies.filter((company) => {
      if (modelFilter !== "all" && company.deliveryModel !== modelFilter) return false;
      if (!needle) return true;
      const haystack = [
        company.name,
        company.sector,
        company.csrFocus,
        company.warmPath,
        company.fitRationale,
        ...company.leads.map((lead) => `${lead.name} ${lead.title ?? ""}`),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });

    return [...rows].sort(SORTERS[sortKey]);
  }, [companies, query, modelFilter, sortKey]);

  const leadCount = companies.reduce((total, company) => total + company.leads.length, 0);
  const freshCount = companies.filter(isFresh).length;

  return (
    <div className="space-y-4">
      <DailyResearchBar lastJob={lastJob} freshCount={freshCount} />
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search companies, people, warm paths…"
          className="min-w-56 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <select
          value={modelFilter}
          onChange={(event) => setModelFilter(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="all">All funding models</option>
          {DELIVERY_MODELS.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
        <select
          value={sortKey}
          onChange={(event) => setSortKey(event.target.value as SortKey)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              Sort: {option.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowAdd((value) => !value)}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
        >
          {showAdd ? "Cancel" : "Add company"}
        </button>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        {companies.length} researched companies · {leadCount} named leads. Defaults to
        grant-makers because companies that run their own institutes rarely fund an
        outside partner.
      </p>

      {showAdd && <AddCompanyForm onDone={() => setShowAdd(false)} />}

      <div className="space-y-3">
        {filtered.map((company) => (
          <CompanyCard
            key={company.id}
            company={company}
            notionConfigured={notionConfigured}
          />
        ))}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Nothing matches that filter.
          </div>
        )}
      </div>
    </div>
  );
}

function DailyResearchBar({
  lastJob,
  freshCount,
}: {
  lastJob: JobRunRow | null;
  freshCount: number;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runNow(notify: boolean) {
    setRunning(true);
    setError(null);
    setResult(null);

    const response = await fetch("/api/jobs/daily-research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notify }),
    });
    const data = await response.json().catch(() => ({}));
    setRunning(false);

    if (response.ok) {
      setResult(
        data.found
          ? `Found ${data.found}: ${(data.companies ?? []).join(", ")}${
              data.deliveryError ? ` — WhatsApp failed: ${data.deliveryError}` : ""
            }`
          : "No new prospects cleared the bar this run.",
      );
      router.refresh();
    } else {
      setError(data.error ?? "Research run failed");
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Daily research
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {lastJob
              ? `Last run ${formatRelative(lastJob.finishedAt)} · ${lastJob.summary ?? lastJob.status}${
                  lastJob.notified ? " · WhatsApp sent" : ""
                }`
              : "Not run yet. The scheduler runs it every morning; you can also trigger it here."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => runNow(false)}
            disabled={running}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
          >
            {running ? "Researching…" : "Run research now"}
          </button>
          <button
            onClick={() => runNow(true)}
            disabled={running}
            title="Runs research and sends the WhatsApp message"
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
          >
            Run + WhatsApp
          </button>
        </div>
      </div>

      {freshCount > 0 && (
        <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
          {freshCount} new from the last run — marked <strong>New</strong> below.
        </p>
      )}
      {result && (
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{result}</p>
      )}
      {lastJob?.error && !error && (
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
          Last run reported: {lastJob.error}
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function CompanyCard({
  company,
  notionConfigured,
}: {
  company: ResearchCompanyRow;
  notionConfigured: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(status: string) {
    await fetch(`/api/research/${company.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function pushToNotion() {
    setPushing(true);
    setError(null);
    const response = await fetch(`/api/research/${company.id}/push`, { method: "POST" });
    const data = await response.json().catch(() => ({}));
    setPushing(false);
    if (response.ok) {
      router.refresh();
    } else {
      setError(data.error ?? "Could not push to Notion");
    }
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <button
            onClick={() => setOpen((value) => !value)}
            className="text-left text-base font-semibold text-slate-900 dark:text-slate-100"
          >
            {company.name}
          </button>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {[company.sector, company.hqCity, company.csrBudget].filter(Boolean).join(" · ")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {company.notionPageUrl ? (
            <a
              href={company.notionPageUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              In Notion →
            </a>
          ) : (
            <button
              onClick={pushToNotion}
              disabled={pushing || !notionConfigured}
              title={
                notionConfigured
                  ? "Creates a row in the CSR Pipeline Tracker, so it shows under Current leads"
                  : "Connect Notion first"
              }
              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white disabled:opacity-40 hover:bg-emerald-700"
            >
              {pushing ? "Moving…" : "→ Current leads"}
            </button>
          )}
          {isFresh(company) && <Badge tone="green">New</Badge>}
          <Badge tone={priorityTone(company.priority)}>{company.priority}</Badge>
          <Badge
            tone={deliveryTone(company.deliveryModel)}
            title={DELIVERY_MODEL_HELP[company.deliveryModel as keyof typeof DELIVERY_MODEL_HELP]}
          >
            {company.deliveryModel}
          </Badge>
          <Badge tone={likelihoodTone(company.grantLikelihood)}>
            {company.grantLikelihood} odds
          </Badge>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {company.themes.map((theme) => (
          <Badge key={theme} tone="blue">
            {THEME_LABELS[theme] ?? theme}
          </Badge>
        ))}
        {company.leads.length > 0 && (
          <Badge>
            {company.leads.length} named {company.leads.length === 1 ? "lead" : "leads"}
          </Badge>
        )}
      </div>

      {company.fitRationale && (
        <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
          {company.fitRationale}
        </p>
      )}

      {open && (
        <div className="mt-4 space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Field label="CSR focus" value={company.csrFocus} />
            <Field label="Warm path" value={company.warmPath} />
            <Field label="IIT connection" value={company.iitConnect} />
            <Field label="Evidence it funds outsiders" value={company.externalGrantEvidence} />
          </dl>

          {company.leads.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Who to reach
              </p>
              <ul className="mt-2 space-y-2">
                {company.leads.map((lead) => (
                  <li
                    key={lead.id}
                    className="rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {lead.name}
                      </span>
                      {lead.role && <Badge>{lead.role}</Badge>}
                      {lead.iitAffiliation && <Badge tone="violet">{lead.iitAffiliation}</Badge>}
                    </div>
                    {lead.title && (
                      <p className="text-slate-600 dark:text-slate-400">{lead.title}</p>
                    )}
                    {lead.warmPath && (
                      <p className="mt-1 text-slate-600 dark:text-slate-400">
                        <span className="font-medium">Route: </span>
                        {lead.warmPath}
                      </p>
                    )}
                    {lead.notes && (
                      <p className="mt-1 text-slate-600 dark:text-slate-400">{lead.notes}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <NotesEditor
            value={company.notes}
            endpoint={`/api/research/${company.id}`}
          />

          {company.sourceUrls.length > 0 && (
            <div className="flex flex-wrap gap-3 text-xs">
              {company.sourceUrls.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-700 underline dark:text-sky-400"
                >
                  {new URL(url).hostname.replace("www.", "")}
                </a>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={company.status}
              onChange={(event) => updateStatus(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}
    </article>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-slate-700 dark:text-slate-300">{value}</dd>
    </div>
  );
}
