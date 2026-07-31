"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postDoubtMessageAction } from "@/app/lib/doubt-actions";

/** Follow-up reply box for a doubt that already has a first answer. */
export default function DoubtReplyForm({ doubtId }: { doubtId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const send = async () => {
    if (!body.trim() || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await postDoubtMessageAction(doubtId, body.trim());
      if (res.ok) {
        setBody("");
        router.refresh();
      } else {
        setErr(res.error ?? "Couldn't send the reply.");
      }
    } catch {
      setErr("Couldn't send the reply.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="Reply to the student…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
        />
        <button
          onClick={send}
          disabled={!body.trim() || busy}
          className="rounded-lg bg-gold-600 hover:bg-gold-700 text-white text-sm font-medium py-2 px-4 disabled:opacity-50"
        >
          {busy ? "Sending…" : "Reply"}
        </button>
      </div>
      {err && <p className="mt-1 text-xs text-amber-700">⚠️ {err}</p>}
    </div>
  );
}
