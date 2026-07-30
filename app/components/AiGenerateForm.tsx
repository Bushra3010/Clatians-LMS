"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateQuestionsAction } from "@/app/lib/ai-actions";

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none";

const SUBJECTS = ["Legal Reasoning", "English", "GK & Current Affairs", "Logical Reasoning", "Quantitative"];

/** AI question generator for one test — shows a live pending state, a success
 * count, and any error (e.g. the daily quota) instead of failing silently. */
export default function AiGenerateForm({ testId }: { testId: string }) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("Legal Reasoning");
  const [difficulty, setDifficulty] = useState("medium");
  const [count, setCount] = useState(5);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !topic.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await generateQuestionsAction({ testId, topic: topic.trim(), subject, difficulty, count });
      if (res.ok) {
        setMsg({ kind: "ok", text: `Added ${res.added} question${res.added === 1 ? "" : "s"} to this test.` });
        setTopic("");
        router.refresh(); // pull in the newly-inserted questions
      } else {
        setMsg({ kind: "err", text: res.error ?? "Something went wrong. Please try again." });
      }
    } catch {
      setMsg({ kind: "err", text: "Something went wrong. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2">
      <input
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        required
        disabled={busy}
        className={inputCls}
        placeholder="Topic — e.g. Article 21, Law of Torts, July Current Affairs"
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <select value={subject} onChange={(e) => setSubject(e.target.value)} disabled={busy} className={inputCls}>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} disabled={busy} className={inputCls}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select value={count} onChange={(e) => setCount(Number(e.target.value))} disabled={busy} className={inputCls}>
          {[3, 5, 10].map((n) => (
            <option key={n} value={n}>{n} questions</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy || !topic.trim()}
          className="rounded-lg text-white text-sm font-medium py-2 px-4 disabled:opacity-60"
          style={{ background: "#3D2411" }}
        >
          {busy ? "Generating…" : "✨ Generate & add"}
        </button>
        {busy && <span className="text-xs text-slate-500">This can take up to ~40s — hang tight.</span>}
      </div>

      {msg && (
        <p className={`text-xs mt-1 ${msg.kind === "ok" ? "text-green-700" : "text-amber-700"}`}>
          {msg.kind === "ok" ? "✅ " : "⚠️ "}
          {msg.text}
        </p>
      )}
      <p className="text-[11px] text-slate-400">Questions are drafted by AI — review each one before publishing the test.</p>
    </form>
  );
}
