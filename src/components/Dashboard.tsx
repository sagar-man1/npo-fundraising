"use client";

import { useState } from "react";
import { CurrentLeads } from "./CurrentLeads";
import { ResearchTab } from "./ResearchTab";
import { formatRelative } from "@/lib/format";
import type { ProspectRow, ResearchCompanyRow } from "@/lib/types";

type Tab = "current" | "research";

export function Dashboard({
  prospects,
  companies,
  lastSyncAt,
  notionConfigured,
}: {
  prospects: ProspectRow[];
  companies: ResearchCompanyRow[];
  lastSyncAt: string | null;
  notionConfigured: boolean;
}) {
  const [tab, setTab] = useState<Tab>("current");

  const tabs: Array<{ key: Tab; label: string; count: number }> = [
    { key: "current", label: "Current leads", count: prospects.length },
    { key: "research", label: "Research", count: companies.length },
  ];

  return (
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            PARFI Fundraising Leads
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Live Notion pipeline alongside net-new CSR prospect research, scored on
            whether a company actually funds outside partners.
          </p>

          <nav className="mt-4 flex gap-1">
            {tabs.map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  tab === item.key
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                {item.label}
                <span className="ml-1.5 opacity-60">{item.count}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-8">
        {tab === "current" ? (
          <CurrentLeads
            prospects={prospects}
            notionConfigured={notionConfigured}
            lastSyncLabel={formatRelative(lastSyncAt)}
          />
        ) : (
          <ResearchTab companies={companies} notionConfigured={notionConfigured} />
        )}
      </main>
    </div>
  );
}
