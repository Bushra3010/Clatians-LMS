"use client";

import { useState } from "react";
import type { TopicDetail } from "../../lib/topic-actions";
import { youtubeId } from "./ClassWatchPage";

const gradient = "linear-gradient(135deg,var(--blue-dark),var(--blue))";

type Tab = "video" | "notes" | "test" | "doubts";

const card: React.CSSProperties = {
  background: "white", borderRadius: 16, padding: "16px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
};

function Empty({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div style={{ ...card, textAlign: "center", padding: "28px 18px" }}>
      <div style={{ fontSize: 34, marginBottom: 6 }}>{icon}</div>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--ink-primary)" }}>{title}</p>
      <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--text-disabled)" }}>{text}</p>
    </div>
  );
}

const isLink = (u: string) => /^(https?:\/\/|\/uploads\/)/i.test(u.trim());

/** One syllabus topic: its video, notes, practice test and the student's doubts on it. */
export default function TopicPage({ topic, onBack, onStartTest, onAskDoubt, onToggleDone }: {
  topic: TopicDetail;
  onBack: () => void;
  onStartTest: (testId: string) => Promise<{ ok: boolean; error?: string }>;
  onAskDoubt: (body: string) => Promise<{ ok: boolean; error?: string }>;
  onToggleDone: (done: boolean) => Promise<void>;
}) {
  const [tab, setTab] = useState<Tab>(topic.videoUrl ? "video" : "notes");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<"doubt" | "test" | "done" | null>(null);
  const [err, setErr] = useState("");

  const ytId = youtubeId(topic.videoUrl);

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: "video", label: "🎥 Video" },
    { key: "notes", label: "📄 Notes" },
    { key: "test", label: "📝 Test" },
    { key: "doubts", label: "💬 Doubts", badge: topic.doubts.length || undefined },
  ];

  const ask = async () => {
    setErr("");
    setBusy("doubt");
    const res = await onAskDoubt(draft);
    setBusy(null);
    if (res.ok) setDraft(""); else setErr(res.error ?? "Could not send your doubt.");
  };

  const start = async (testId: string) => {
    setErr("");
    setBusy("test");
    const res = await onStartTest(testId);
    setBusy(null);
    if (!res.ok) setErr(res.error ?? "Could not start the test.");
  };

  const toggle = async () => {
    setBusy("done");
    await onToggleDone(!topic.completed);
    setBusy(null);
  };

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%", paddingBottom: 96 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "var(--ink-primary)", fontSize: 14, fontWeight: 700, padding: "14px 16px 0" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-primary)" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        {topic.chapter}
      </button>

      <div style={{ padding: "12px 16px 0" }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{topic.subject} · {topic.chapter}</p>
        <h2 style={{ margin: "4px 0 0", fontSize: 19, fontWeight: 900, color: "var(--ink-primary)", lineHeight: 1.3 }}>{topic.title}</h2>
        {topic.completed && <p style={{ margin: "6px 0 0", fontSize: 12, fontWeight: 700, color: "var(--success-text)" }}>✓ You completed this topic</p>}

        {/* Tabs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6, marginTop: 14 }}>
          {tabs.map((t) => (
            <button key={t.key} onClick={() => { setErr(""); setTab(t.key); }} style={{
              padding: "10px 4px", borderRadius: 12, fontSize: 12, fontWeight: 800, border: "none", cursor: "pointer", whiteSpace: "nowrap",
              background: tab === t.key ? "var(--blue)" : "white",
              color: tab === t.key ? "white" : "var(--text-secondary)",
              boxShadow: tab === t.key ? "0 4px 12px rgba(61,36,17,0.25)" : "0 1px 4px rgba(0,0,0,0.05)",
            }}>
              {t.label}{t.badge ? ` (${t.badge})` : ""}
            </button>
          ))}
        </div>

        {err && <p style={{ margin: "12px 0 0", fontSize: 13, color: "var(--error-text)", background: "var(--error)", borderRadius: 10, padding: "10px 12px" }}>{err}</p>}

        <div style={{ marginTop: 14 }}>
          {/* ── VIDEO ── */}
          {tab === "video" && (
            ytId ? (
              <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", borderRadius: 16, overflow: "hidden", background: "#000", boxShadow: "0 6px 20px rgba(0,0,0,0.18)" }}>
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}?rel=0`}
                  title={topic.title}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : topic.videoUrl && /\.(mp4|webm|m3u8)(\?|$)/i.test(topic.videoUrl) ? (
              <video src={topic.videoUrl} controls playsInline style={{ width: "100%", borderRadius: 16, background: "#000" }} />
            ) : topic.videoUrl && isLink(topic.videoUrl) ? (
              <div style={card}>
                <p style={{ margin: "0 0 10px", fontSize: 13, color: "var(--text-secondary)" }}>This lecture opens in a new tab.</p>
                <button onClick={() => window.open(topic.videoUrl.trim(), "_blank", "noopener")} style={{ width: "100%", background: gradient, color: "white", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>▶ Watch lecture</button>
              </div>
            ) : (
              <Empty icon="🎥" title="Video coming soon" text="Faculty will upload this topic's lecture shortly. Meanwhile, read the notes." />
            )
          )}
          {tab === "video" && topic.durationMin > 0 && (
            <p style={{ margin: "8px 2px 0", fontSize: 11.5, color: "var(--text-disabled)" }}>⏱ {topic.durationMin} min lecture</p>
          )}

          {/* ── NOTES ── */}
          {tab === "notes" && (
            topic.notes || topic.notesUrl ? (
              <div style={card}>
                {topic.notesUrl && isLink(topic.notesUrl) && (
                  <button onClick={() => window.open(topic.notesUrl.trim(), "_blank", "noopener")} style={{ width: "100%", marginBottom: topic.notes ? 14 : 0, background: "var(--bg-secondary)", border: "1px solid var(--gold-100)", color: "var(--ink-primary)", borderRadius: 12, padding: "11px", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>📎 Open notes PDF</button>
                )}
                {topic.notes && <div style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{topic.notes}</div>}
              </div>
            ) : (
              <Empty icon="📄" title="Notes coming soon" text="Notes for this topic haven't been added yet." />
            )
          )}

          {/* ── TEST ── */}
          {tab === "test" && (
            topic.test ? (
              <div style={card}>
                <p style={{ margin: 0, fontSize: 10.5, fontWeight: 800, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Topic test</p>
                <p style={{ margin: "4px 0 0", fontSize: 15, fontWeight: 800, color: "var(--ink-primary)" }}>{topic.test.title}</p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
                  {topic.test.questionCount} questions · {topic.test.durationMin > 0 ? `${topic.test.durationMin} min` : "Untimed"}
                  {topic.test.myAttempts > 0 ? ` · ${topic.test.myAttempts} attempt${topic.test.myAttempts > 1 ? "s" : ""}` : ""}
                </p>
                {topic.test.bestScore !== null && (
                  <p style={{ margin: "8px 0 0", display: "inline-block", background: "var(--success)", color: "var(--success-text)", fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20 }}>Best {topic.test.bestScore}/{topic.test.bestTotal}</p>
                )}
                <button onClick={() => start(topic.test!.id)} disabled={busy === "test"} style={{ display: "block", width: "100%", marginTop: 14, background: gradient, color: "white", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 800, cursor: "pointer", opacity: busy === "test" ? 0.7 : 1 }}>
                  {busy === "test" ? "Loading…" : topic.test.myAttempts > 0 ? "Re-attempt →" : "Start test →"}
                </button>
              </div>
            ) : (
              <Empty icon="📝" title="No test for this topic yet" text="A practice test will appear here once faculty adds one." />
            )
          )}

          {/* ── DOUBTS ── */}
          {tab === "doubts" && (
            <>
              <div style={card}>
                <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 800, color: "var(--ink-primary)" }}>Ask a doubt on this topic</p>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={3}
                  placeholder="What didn't make sense? Be specific — faculty will see which topic it's from."
                  style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid var(--border)", borderRadius: 12, padding: "10px 12px", fontSize: 16, fontFamily: "inherit", resize: "vertical", color: "var(--ink-primary)" }}
                />
                <button onClick={ask} disabled={busy === "doubt" || !draft.trim()} style={{ width: "100%", marginTop: 8, background: gradient, color: "white", border: "none", borderRadius: 12, padding: "11px", fontSize: 13.5, fontWeight: 800, cursor: "pointer", opacity: busy === "doubt" || !draft.trim() ? 0.6 : 1 }}>
                  {busy === "doubt" ? "Sending…" : "Send to faculty"}
                </button>
              </div>

              {topic.doubts.map((d) => (
                <div key={d.id} style={{ ...card, marginTop: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--ink-primary)", lineHeight: 1.55 }}>{d.body}</p>
                    <span style={{ flexShrink: 0, alignSelf: "flex-start", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20, background: d.status === "answered" ? "var(--success)" : "var(--warning)", color: d.status === "answered" ? "var(--success-text)" : "#92400E" }}>
                      {d.status === "answered" ? "Answered" : "Pending"}
                    </span>
                  </div>
                  {d.answer && (
                    <div style={{ marginTop: 10, background: "var(--bg-secondary)", border: "1px solid var(--gold-100)", borderRadius: 12, padding: "10px 12px" }}>
                      <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 800, color: "var(--blue)" }}>{d.teacher ?? "Faculty"} replied</p>
                      <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{d.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Mark complete */}
      <div style={{ position: "sticky", bottom: 0, marginTop: 18, background: "white", borderTop: "1px solid var(--gold-100)", padding: "12px 16px" }}>
        <button onClick={toggle} disabled={busy === "done"} style={{
          width: "100%", borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 800, cursor: "pointer",
          border: topic.completed ? "1.5px solid var(--success-border)" : "none",
          background: topic.completed ? "var(--success)" : gradient,
          color: topic.completed ? "var(--success-text)" : "white",
          opacity: busy === "done" ? 0.7 : 1,
        }}>
          {topic.completed ? "✓ Completed — tap to undo" : "Mark topic as complete"}
        </button>
      </div>
    </div>
  );
}
