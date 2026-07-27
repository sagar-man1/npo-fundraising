import type { ReactNode } from "react";

const TONES = {
  neutral:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  amber: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  red: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  blue: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  violet: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
} as const;

export type Tone = keyof typeof TONES;

export function Badge({
  children,
  tone = "neutral",
  title,
}: {
  children: ReactNode;
  tone?: Tone;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function deliveryTone(model: string): Tone {
  if (model === "Grant-maker") return "green";
  if (model === "Mixed") return "amber";
  if (model === "Self-implementer") return "red";
  return "neutral";
}

export function likelihoodTone(likelihood: string): Tone {
  if (likelihood === "High") return "green";
  if (likelihood === "Medium") return "amber";
  return "red";
}

export function priorityTone(priority: string): Tone {
  if (priority === "Tier 1") return "violet";
  if (priority === "Tier 2") return "blue";
  return "neutral";
}
