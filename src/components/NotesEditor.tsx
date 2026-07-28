"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Inline notes box. Saves on blur or Cmd/Ctrl+Enter, and writes through to
 * Notion so the team sees the same text there.
 */
export function NotesEditor({
  value,
  endpoint,
  label = "Notes",
  placeholder = "Add a note…",
}: {
  value: string | null;
  endpoint: string;
  label?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const [text, setText] = useState(value ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (text === (value ?? "")) return;
    setState("saving");
    setError(null);

    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: text }),
    });

    if (response.ok) {
      setState("saved");
      router.refresh();
      setTimeout(() => setState("idle"), 2000);
    } else {
      const data = await response.json().catch(() => ({}));
      setState("error");
      setError(data.error ?? "Could not save");
    }
  }

  return (
    <div onClick={(event) => event.stopPropagation()}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <span className="text-xs text-slate-400">
          {state === "saving" && "Saving…"}
          {state === "saved" && "Saved to Notion"}
          {state === "error" && <span className="text-red-600">{error}</span>}
        </span>
      </div>
      <textarea
        value={text}
        rows={3}
        placeholder={placeholder}
        onChange={(event) => setText(event.target.value)}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            (event.target as HTMLTextAreaElement).blur();
          }
        }}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
      />
    </div>
  );
}
