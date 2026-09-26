"use client";

import { useEffect, useRef, useState } from "react";
import { getClassInboxAction, replyClassQuestionAction, type ClassThread } from "@/app/lib/class-chat-actions";

const POLL_MS = 4000;

const fmtClock = (ts: string) => {
  // created_at is stored as UTC "YYYY-MM-DD HH:MM:SS(.us)".
  const d = new Date(ts.replace(" ", "T") + "Z");
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
};

/**
 * The teacher's side of a live class: the stream preview and an inbox of
 * private questions — one thread per student, answered one-to-one.
 */
export default function TeacherLiveConsole({ classId, ytId, title }: { classId: string; ytId: string | null; title: string }) {
  const [threads, setThreads] = useState<ClassThread[]>([]);
  const [status, setStatus] = useState("");
  const [attendees, setAttendees] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const res = await getClassInboxAction(classId);
    if (!res.ok) return;
    setThreads(res.threads);
    setStatus(res.status);
    setAttendees(res.attendees);
  };

  useEffect(() => {
    let alive = true;
    const tick = async () => { if (alive) await load(); };
    tick();
    const t = setInterval(tick, POLL_MS);
    return () => { alive = false; clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  // Follow the first unanswered thread until the teacher picks one.
  const current = threads.find((t) => t.studentId === selected) ?? threads[0] ?? null;
  const pending = threads.filter((t) => t.awaitingReply).length;

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [current?.studentId, current?.messages.length]);

  const reply = async () => {
    if (!current || !draft.trim() || sending) return;
    setSending(true);
    setErr("");
    const res = await replyClassQuestionAction(classId, current.studentId, draft);
    setSending(false);
    if (!res.ok) { setErr(res.error ?? "Could not send."); return; }
    setDraft("");
    setSelected(current.studentId);
    await load();
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-5">
      {/* Stream */}
      <section>
        <div className="relative w-full overflow-hidden rounded-xl bg-black" style={{ paddingTop: "56.25%" }}>
          {ytId ? (
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?rel=0`}
              title={title}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-slate-300">
              Add a YouTube Live link to this class so students can watch it inside the app.
            </p>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className={`rounded px-2 py-1 font-semibold ${status === "live" ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-600"}`}>
            {status === "live" ? "● LIVE" : status || "…"}
          </span>
          <span className="rounded bg-green-50 px-2 py-1 font-semibold text-green-700">{attendees} present</span>
          <span className="rounded bg-amber-50 px-2 py-1 font-semibold text-amber-700">{pending} waiting for reply</span>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Students who join while the class is live are marked present automatically. Their questions below are private:
          each student sees only their own conversation with you.
        </p>
      </section>

      {/* Inbox */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col" style={{ minHeight: 460 }}>
        <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Student questions</h2>
          <span className="text-xs text-slate-400">auto-refreshes</span>
        </div>

        {threads.length === 0 ? (
          <p className="flex-1 flex items-center justify-center p-6 text-center text-sm text-slate-400">
            No questions yet. They&apos;ll appear here as students ask.
          </p>
        ) : (
          <div className="flex-1 grid grid-cols-[150px_minmax(0,1fr)] min-h-0">
            <ul className="border-r border-slate-200 overflow-y-auto" style={{ maxHeight: 520 }}>
              {threads.map((t) => {
                const active = current?.studentId === t.studentId;
                return (
                  <li key={t.studentId}>
                    <button
                      onClick={() => { setSelected(t.studentId); setErr(""); }}
                      className={`w-full text-left px-3 py-2.5 border-b border-slate-100 ${active ? "bg-gold-50" : "hover:bg-slate-50"}`}
                    >
                      <span className="flex items-center gap-1.5">
                        {t.awaitingReply && <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />}
                        <span className="text-sm font-medium text-slate-800 truncate">{t.studentName}</span>
                      </span>
                      <span className="block text-xs text-slate-400 truncate mt-0.5">{t.messages[t.messages.length - 1]?.body}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-col min-h-0">
              <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50" style={{ maxHeight: 420 }}>
                {current?.messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === "teacher" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${m.role === "teacher" ? "bg-gold-600 text-white" : "bg-white border border-slate-200 text-slate-800"}`}>
                      {m.body}
                      <span className={`block mt-0.5 text-[10px] ${m.role === "teacher" ? "text-white/70" : "text-slate-400"}`}>{fmtClock(m.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-200 p-2">
                {err && <p className="mb-1 text-xs text-red-600">{err}</p>}
                <div className="flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") reply(); }}
                    placeholder={current ? `Reply to ${current.studentName}…` : "Reply…"}
                    className="flex-1 min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold-500"
                  />
                  <button onClick={reply} disabled={sending || !draft.trim()} className="rounded-lg bg-gold-600 hover:bg-gold-700 disabled:opacity-50 text-white text-sm font-medium px-4">
                    {sending ? "…" : "Send"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
