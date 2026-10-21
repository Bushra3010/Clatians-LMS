"use client";

import { useState } from "react";
import { answerDoubtAction } from "@/app/lib/doubt-actions";
import { draftDoubtAnswerAction } from "@/app/lib/ai-actions";

/** Answer form for one open doubt, with a "Draft with AI" helper that fills
 * the textarea with a suggested reply the teacher can edit before sending, and
 * an optional solution-video link students see under the topic's doubt videos. */
export default function DoubtAnswerForm({ doubtId }: { doubtId: string }) {
  const [answer, setAnswer] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const draft = async () => {
    if (drafting) return;
    setDrafting(true);
    setErr(null);
    try {
      const res = await draftDoubtAnswerAction(doubtId);
      if (res.ok && res.text) setAnswer(res.text);
      else setErr(res.error ?? "Couldn't draft a reply right now.");
    } catch {
      setErr("Couldn't draft a reply right now.");
    } finally {
      setDrafting(false);
    }
  };

  return (
    <form action={answerDoubtAction} className="mt-3 border-t border-slate-100 pt-3">
      <input type="hidden" name="doubtId" value={doubtId} />
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-slate-500">Your answer</p>
        <button
          type="button"
          onClick={draft}
          disabled={drafting}
          className="text-xs font-semibold rounded-md px-2.5 py-1 border disabled:opacity-60"
          style={{ color: "#6B4A28", borderColor: "#E7D6BA", background: "#F6ECD9" }}
        >
          {drafting ? "Drafting…" : "Draft with AI"}
        </button>
      </div>
      <textarea
        name="answer"
        required
        rows={4}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Write your answer… or let AI draft one you can edit."
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none resize-y"
      />
      {err && <p className="mt-1 text-xs text-amber-700">{err}</p>}
      <p className="mt-1 text-[11px] text-slate-400">AI drafts can contain errors — review and edit before sending.</p>
      <label className="mt-3 block text-xs font-medium text-slate-500" htmlFor={`video-${doubtId}`}>Solution video link (optional)</label>
      <input
        id={`video-${doubtId}`}
        name="videoUrl"
        type="url"
        placeholder="https://youtu.be/…"
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
      />
      <p className="mt-1 text-[11px] text-slate-400">Students on this topic see it under &ldquo;Doubt solving videos&rdquo;.</p>
      <button className="mt-2 rounded-lg bg-gold-600 hover:bg-gold-700 text-white text-sm font-medium py-2 px-5">
        Send answer
      </button>
    </form>
  );
}
