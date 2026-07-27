"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, deliveryTone, likelihoodTone } from "./Badge";
import {
  DELIVERY_MODELS,
  DELIVERY_MODEL_HELP,
  GRANT_LIKELIHOODS,
} from "@/lib/deliveryModels";
import { formatDate } from "@/lib/format";
import type { ProspectRow } from "@/lib/types";

const SOURCE_LABELS: Record<string, string> = {
  pipeline: "CSR Pipeline",
  companies: "IT/ITeS tracker",
};

export function CurrentLeads({
  prospects,
  notionConfigured,
  lastSyncLabel,
}: {
  prospects: ProspectRow[];
  notionConfigured: boolean;
  lastSyncLabel: string | null;
}) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [modelFilter, setModelFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return prospects.filter((prospect) => {
      if (modelFilter !== "all" && prospect.deliveryModel !== modelFilter) return false;
      if (!needle) return true;
      return [prospect.name, prospect.sector, prospect.notes, prospect.keyContacts]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(needle));
    });
  }, [prospects, query, modelFilter]);

  const selfImplementers = prospects.filter(
    (prospect) => prospect.deliveryModel === "Self-implementer",
  ).length;

  async function runSync() {
    setSyncing(true);
    setSyncError(null);
    const response = await fetch("/api/sync", { method: "POST" });
    const data = await response.json().catch(() => ({}));
    setSyncing(false);
    if (response.ok) {
      router.refresh();
    } else {
      setSyncError(data.error ?? "Sync failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search companies, contacts, notes…"
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
        <button
          onClick={runSync}
          disabled={syncing}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
        >
          {syncing ? "Syncing…" : "Sync from Notion"}
        </button>
      </div>

      {lastSyncLabel && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Last synced {lastSyncLabel}
        </p>
      )}

      {syncError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {syncError}
        </p>
      )}

      {!notionConfigured && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Notion is not connected yet. Add <code>NOTION_TOKEN</code> and the database
          IDs to <code>.env</code>, then hit Sync — see the README for the two-minute
          setup.
        </p>
      )}

      {prospects.length > 0 && selfImplementers > 0 && (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {selfImplementers} of {prospects.length} tracked companies run their own
          training institutes. They spend their skilling budget internally, so they
          rank below their headline CSR number — filter by{" "}
          <strong>Grant-maker</strong> to see who actually funds outside partners.
        </p>
      )}

      {prospects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No leads pulled in yet. Connect Notion and run a sync to mirror the CSR
          Pipeline Tracker and the IT/ITeS Companies tracker here.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Funding model</th>
                <th className="px-4 py-3 font-medium">Grant odds</th>
                <th className="px-4 py-3 font-medium">Stage / status</th>
                <th className="px-4 py-3 font-medium">Next action</th>
                <th className="px-4 py-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((prospect) => (
                <ProspectRowView
                  key={prospect.id}
                  prospect={prospect}
                  expanded={expanded === prospect.id}
                  onToggle={() =>
                    setExpanded(expanded === prospect.id ? null : prospect.id)
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProspectRowView({
  prospect,
  expanded,
  onToggle,
}: {
  prospect: ProspectRow;
  expanded: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function updateAssessment(field: "deliveryModel" | "grantLikelihood", value: string) {
    setSaving(true);
    await fetch("/api/assessments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notionId: prospect.notionId,
        deliveryModel: prospect.deliveryModel,
        grantLikelihood: prospect.grantLikelihood,
        rationale: prospect.rationale,
        [field]: value,
      }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
      >
        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
          {prospect.name}
          {prospect.sector && (
            <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
              {prospect.sector}
            </span>
          )}
        </td>
        <td className="px-4 py-3">
          <Badge
            tone={deliveryTone(prospect.deliveryModel)}
            title={DELIVERY_MODEL_HELP[prospect.deliveryModel as keyof typeof DELIVERY_MODEL_HELP]}
          >
            {prospect.deliveryModel}
          </Badge>
        </td>
        <td className="px-4 py-3">
          <Badge tone={likelihoodTone(prospect.grantLikelihood)}>
            {prospect.grantLikelihood}
          </Badge>
        </td>
        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
          {prospect.stage ?? prospect.status ?? "—"}
          {prospect.connectionStatus && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {prospect.connectionStatus}
            </div>
          )}
        </td>
        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
          {prospect.nextAction ?? "—"}
          {prospect.nextActionDate && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {formatDate(prospect.nextActionDate)}
            </div>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
          {SOURCE_LABELS[prospect.source] ?? prospect.source}
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
          <td colSpan={6} className="px-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3 text-sm">
                {prospect.rationale && (
                  <p className="text-slate-700 dark:text-slate-300">
                    <span className="font-medium">Why this rating: </span>
                    {prospect.rationale}
                  </p>
                )}
                {prospect.keyContacts && (
                  <p className="text-slate-700 dark:text-slate-300">
                    <span className="font-medium">Key contacts: </span>
                    {prospect.keyContacts}
                  </p>
                )}
                {prospect.notes && (
                  <p className="text-slate-700 dark:text-slate-300">
                    <span className="font-medium">Notes: </span>
                    {prospect.notes}
                  </p>
                )}
                {prospect.programs.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {prospect.programs.map((program) => (
                      <Badge key={program} tone="blue">
                        {program}
                      </Badge>
                    ))}
                  </div>
                )}
                {prospect.notionUrl && (
                  <a
                    href={prospect.notionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-sm font-medium text-sky-700 underline dark:text-sky-400"
                  >
                    Open in Notion →
                  </a>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Override the assessment
                </p>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={prospect.deliveryModel}
                    disabled={saving}
                    onChange={(event) => updateAssessment("deliveryModel", event.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {DELIVERY_MODELS.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                  <select
                    value={prospect.grantLikelihood}
                    disabled={saving}
                    onChange={(event) => updateAssessment("grantLikelihood", event.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {GRANT_LIKELIHOODS.map((likelihood) => (
                      <option key={likelihood} value={likelihood}>
                        {likelihood}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Stored here, not in Notion — the tracker stays the system of record
                  for stage and owner.
                </p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
