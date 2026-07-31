"use client";

type Cell = string | number | null | undefined;

/** Client-side CSV export. Builds a CSV from headers + rows and downloads it —
 * no server round-trip. Fields are quoted and quotes doubled per RFC 4180. */
export default function ExportCsvButton({
  filename,
  headers,
  rows,
  label = "⬇ Export CSV",
}: {
  filename: string;
  headers: string[];
  rows: Cell[][];
  label?: string;
}) {
  const download = () => {
    const esc = (v: Cell) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
    // Prepend a BOM so Excel opens UTF-8 (₹, names) correctly.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={download}
      disabled={rows.length === 0}
      className="text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed transition"
    >
      {label}
    </button>
  );
}
