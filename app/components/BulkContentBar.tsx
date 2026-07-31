"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bulkSetContentStatusAction } from "@/app/admin/actions";

/** Bulk approve/reject for the pending content queue. Reads the checked
 * ".bulk-check" checkboxes rendered on each pending card (no data duplication). */
export default function BulkContentBar() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const selectedIds = () =>
    Array.from(document.querySelectorAll<HTMLInputElement>(".bulk-check:checked")).map((el) => el.value);

  const run = async (status: "approved" | "rejected") => {
    const ids = selectedIds();
    if (busy || ids.length === 0) return;
    setBusy(true);
    try {
      await bulkSetContentStatusAction(ids, status);
      const master = document.getElementById("bulk-select-all") as HTMLInputElement | null;
      if (master) master.checked = false;
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const toggleAll = (checked: boolean) => {
    document.querySelectorAll<HTMLInputElement>(".bulk-check").forEach((el) => (el.checked = checked));
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white border border-slate-200 px-4 py-2.5 mb-3">
      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
        <input id="bulk-select-all" type="checkbox" onChange={(e) => toggleAll(e.target.checked)} className="accent-gold-600" />
        Select all pending
      </label>
      <div className="flex-1" />
      <button onClick={() => run("approved")} disabled={busy} className="text-xs rounded-md px-3 py-1.5 border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-50">
        {busy ? "Working…" : "Approve selected"}
      </button>
      <button onClick={() => run("rejected")} disabled={busy} className="text-xs rounded-md px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50">
        Reject selected
      </button>
    </div>
  );
}
