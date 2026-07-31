"use client";

import { useState } from "react";

/** Instant client-side filter for a server-rendered list. Matches each row's
 * visible text against the query and hides non-matching rows. `selector` is a
 * CSS selector for the rows to filter (e.g. "#users-table tbody tr"). No data
 * is duplicated — it operates on the DOM the server already rendered. */
export default function ListFilter({
  selector,
  placeholder = "Search…",
  emptyId,
}: {
  selector: string;
  placeholder?: string;
  emptyId?: string; // optional element to show when nothing matches
}) {
  const [q, setQ] = useState("");

  const apply = (value: string) => {
    setQ(value);
    const needle = value.trim().toLowerCase();
    let shown = 0;
    document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      const match = !needle || (el.textContent ?? "").toLowerCase().includes(needle);
      el.style.display = match ? "" : "none";
      if (match) shown++;
    });
    if (emptyId) {
      const empty = document.getElementById(emptyId);
      if (empty) empty.style.display = shown === 0 ? "" : "none";
    }
  };

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">⌕</span>
      <input
        value={q}
        onChange={(e) => apply(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full sm:w-64 rounded-lg border border-slate-300 pl-8 pr-3 py-2 text-sm text-slate-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
      />
    </div>
  );
}
