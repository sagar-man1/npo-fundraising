"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DELIVERY_MODELS, GRANT_LIKELIHOODS } from "@/lib/deliveryModels";
import { THEME_LABELS } from "@/lib/format";

const PRIORITIES = ["Tier 1", "Tier 2", "Tier 3"];
const THEMES = Object.keys(THEME_LABELS);

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

export function AddCompanyForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [themes, setThemes] = useState<string[]>([]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);

    const response = await fetch("/api/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        sector: form.get("sector"),
        hqCity: form.get("hqCity"),
        csrBudget: form.get("csrBudget"),
        csrFocus: form.get("csrFocus"),
        warmPath: form.get("warmPath"),
        iitConnect: form.get("iitConnect"),
        fitRationale: form.get("fitRationale"),
        externalGrantEvidence: form.get("externalGrantEvidence"),
        deliveryModel: form.get("deliveryModel"),
        grantLikelihood: form.get("grantLikelihood"),
        priority: form.get("priority"),
        themes,
      }),
    });

    setPending(false);
    if (response.ok) {
      router.refresh();
      onDone();
    } else {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Could not save");
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="name" required placeholder="Company name" className={inputClass} />
        <input name="sector" required placeholder="Sector" className={inputClass} />
        <input name="hqCity" placeholder="HQ city" className={inputClass} />
        <input name="csrBudget" placeholder="CSR budget (e.g. ₹40–60 Cr)" className={inputClass} />
        <select name="deliveryModel" defaultValue="Unknown" className={inputClass}>
          {DELIVERY_MODELS.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
        <select name="grantLikelihood" defaultValue="Medium" className={inputClass}>
          {GRANT_LIKELIHOODS.map((likelihood) => (
            <option key={likelihood} value={likelihood}>
              {likelihood} grant odds
            </option>
          ))}
        </select>
        <select name="priority" defaultValue="Tier 3" className={inputClass}>
          {PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
        <input name="iitConnect" placeholder="IIT connection" className={inputClass} />
      </div>

      <div className="flex flex-wrap gap-3">
        {THEMES.map((theme) => (
          <label key={theme} className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={themes.includes(theme)}
              onChange={(event) =>
                setThemes((current) =>
                  event.target.checked
                    ? [...current, theme]
                    : current.filter((value) => value !== theme),
                )
              }
            />
            {THEME_LABELS[theme]}
          </label>
        ))}
      </div>

      <textarea name="csrFocus" rows={2} placeholder="CSR focus" className={inputClass} />
      <textarea name="warmPath" rows={2} placeholder="Warm path" className={inputClass} />
      <textarea
        name="externalGrantEvidence"
        rows={2}
        placeholder="Evidence it funds external NGOs"
        className={inputClass}
      />
      <textarea name="fitRationale" rows={2} placeholder="Why it fits PARFI" className={inputClass} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
      >
        {pending ? "Saving…" : "Save company"}
      </button>
    </form>
  );
}
