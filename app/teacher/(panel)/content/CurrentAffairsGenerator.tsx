"use client";

import { useState } from "react";
import { createContentAction } from "../../actions";
import { generateCurrentAffairsAction } from "@/app/lib/ai-actions";

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none";

type Course = { id: string; name: string };

/** AI current-affairs digest generator. The teacher gives a theme or pastes
 * notes; the AI drafts a CLAT-focused digest they edit and submit through the
 * normal content-approval flow. */
export default function CurrentAffairsGenerator({ courses }: { courses: Course[] }) {
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [generated, setGenerated] = useState(false);

  const generate = async () => {
    if (busy || !topic.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await generateCurrentAffairsAction(topic.trim());
      if (res.ok) {
        setTitle(res.title ?? "Current Affairs Digest");
        setBody(res.body ?? "");
        setGenerated(true);
      } else {
        setErr(res.error ?? "Couldn't generate a digest right now.");
      }
    } catch {
      setErr("Couldn't generate a digest right now.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl bg-white border border-slate-200 p-6 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <span>✨</span>
        <h2 className="text-sm font-semibold text-slate-900">Generate a Current Affairs digest with AI</h2>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Give a theme (e.g. “this month’s constitutional & polity developments”) or paste rough notes — AI drafts a CLAT-focused digest you edit before submitting.
      </p>

      <div className="flex flex-col sm:flex-row gap-2">
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={busy}
          rows={2}
          className={inputCls + " resize-y"}
          placeholder="Theme or notes — e.g. “Recent Supreme Court judgments on Article 21” or paste 4–5 headlines"
        />
        <button
          type="button"
          onClick={generate}
          disabled={busy || !topic.trim()}
          className="shrink-0 rounded-lg text-white text-sm font-medium py-2 px-4 disabled:opacity-60 self-start"
          style={{ background: "#3D2411" }}
        >
          {busy ? "Drafting…" : "✨ Generate digest"}
        </button>
      </div>
      {err && <p className="mt-2 text-xs text-amber-700">⚠️ {err}</p>}

      {generated && (
        <form action={createContentAction} className="mt-5 border-t border-slate-100 pt-4 space-y-3">
          <input type="hidden" name="type" value="current-affairs" />
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Title</span>
            <input name="title" required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Course (optional)</span>
            <select name="courseId" className={inputCls} defaultValue="">
              <option value="">— No specific course —</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Digest (edit before submitting)</span>
            <textarea name="body" required value={body} onChange={(e) => setBody(e.target.value)} rows={12} className={inputCls + " resize-y font-mono text-xs leading-relaxed"} />
          </label>
          <p className="text-[11px] text-amber-700">
            ⚠️ AI can get dates, names and figures wrong — verify every fact before submitting. This goes to an admin for approval.
          </p>
          <button className="rounded-lg bg-gold-600 hover:bg-gold-700 text-white text-sm font-medium py-2 px-5">
            Submit for approval
          </button>
        </form>
      )}
    </section>
  );
}
