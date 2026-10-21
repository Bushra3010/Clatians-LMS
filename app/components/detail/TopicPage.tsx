"use client";

import { useEffect, useState } from "react";
import type { TopicDetail } from "../../lib/topic-actions";
import type { LiveClassItem } from "./LiveClassesPage";
import { youtubeId } from "./ClassWatchPage";
import PdfViewer, { isPdfUrl } from "../PdfViewer";
import { TopicState } from "../learning/LearningFlow";
import { fmtIST, parseServerDate } from "../../lib/dates";
import { AppIcon, type IconName } from "../AppIcon";
import { shareText } from "../../lib/share";

const gradient = "linear-gradient(135deg,var(--blue-dark),var(--blue))";

type Tab = "content" | "live" | "notes" | "doubt";

const card: React.CSSProperties = {
  background: "white", borderRadius: 16, padding: "16px", boxShadow: "0 2px 10px rgba(15,23,41,0.06)",
};
const iconBtn: React.CSSProperties = { background: "none", border: "none", padding: 6, margin: "-4px -2px", cursor: "pointer", display: "flex", flexShrink: 0 };
const sectionTitle: React.CSSProperties = { margin: "18px 2px 10px", fontSize: 15, fontWeight: 800, color: "var(--ink-primary)" };
const primaryBtn: React.CSSProperties = {
  background: gradient, color: "white", border: "none", borderRadius: 12, padding: "12px",
  fontSize: 14, fontWeight: 800, cursor: "pointer", width: "100%",
};
const outlineBtn: React.CSSProperties = {
  background: "white", color: "var(--blue)", border: "1.5px solid var(--blue)", borderRadius: 12, padding: "11px",
  fontSize: 13.5, fontWeight: 800, cursor: "pointer", width: "100%",
};
const smallBtn: React.CSSProperties = {
  background: "var(--blue-tint)", color: "var(--blue)", border: "none", borderRadius: 10, padding: "8px 14px",
  fontSize: 12.5, fontWeight: 800, cursor: "pointer", flexShrink: 0,
};

const isVideoFile = (url: string) => /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(url);

/** Plays a solution video in place: YouTube embed, a video file, or a link out. */
function SolutionPlayer({ url }: { url: string }) {
  const yt = youtubeId(url);
  if (yt) {
    return (
      <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: 12, overflow: "hidden", background: "#000", marginTop: 10 }}>
        <iframe src={`https://www.youtube.com/embed/${yt}?autoplay=1&rel=0`} title="Solution video" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
      </div>
    );
  }
  if (isVideoFile(url)) return <video src={url} controls autoPlay playsInline style={{ width: "100%", borderRadius: 12, marginTop: 10, background: "#000" }} />;
  return <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 10, fontSize: 13, fontWeight: 800, color: "var(--blue)" }}>Open video</a>;
}

/** Thumbnail for a solution video: the YouTube frame when there is one. */
function VideoThumb({ url }: { url: string }) {
  const yt = youtubeId(url);
  return (
    <span style={{ position: "relative", width: 92, height: 56, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg,#1f2937,#0f172a)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {yt && <img src={`https://i.ytimg.com/vi/${yt}/mqdefault.jpg`} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
      <span style={{ position: "relative", width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.92)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <AppIcon name="play" size={11} color="#0f172a" fill="#0f172a" style={{ marginLeft: 2 }} />
      </span>
    </span>
  );
}

function Empty({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  return (
    <div style={{ ...card, textAlign: "center", padding: "28px 18px" }}>
      <span style={{ width: 56, height: 56, borderRadius: 18, background: "var(--blue-tint)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
        <AppIcon name={icon} size={26} color="var(--blue)" />
      </span>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--ink-primary)" }}>{title}</p>
      <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--text-disabled)" }}>{text}</p>
    </div>
  );
}

const isLink = (u: string) => /^(https?:\/\/|\/uploads\/)/i.test(u.trim());

function Check({ on }: { on: boolean }) {
  return on ? (
    <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
    </span>
  ) : (
    <span style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid var(--line-strong)", flexShrink: 0, boxSizing: "border-box" }} />
  );
}

/** Days / hours / minutes until a class starts, refreshed every 30 s. */
function useCountdown(iso: string | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!iso) return;
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, [iso]);
  if (!iso) return null;
  const ms = Math.max(0, parseServerDate(iso).getTime() - now);
  const mins = Math.floor(ms / 60_000);
  return { days: Math.floor(mins / 1440), hours: Math.floor((mins % 1440) / 60), minutes: mins % 60 };
}

/** Google Calendar "add event" link for a class. */
function calendarUrl(c: LiveClassItem) {
  const start = parseServerDate(c.startAt);
  const end = new Date(start.getTime() + c.durationMin * 60_000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const q = new URLSearchParams({ action: "TEMPLATE", text: c.title, dates: `${fmt(start)}/${fmt(end)}`, details: [c.subject, c.teacher].filter(Boolean).join(" · ") });
  return `https://calendar.google.com/calendar/render?${q}`;
}

/** One syllabus topic: its lecture, live class, notes and the student's doubts on it. */
export default function TopicPage({ topic, onBack, onStartTest, onAskDoubt, onToggleDone, onOpenTopic, onJoinClass, onWatchRecording, saved = false, onToggleSave }: {
  topic: TopicDetail;
  /** Whether the student has saved this topic (the heart). */
  saved?: boolean;
  onToggleSave?: () => void;
  onBack: () => void;
  onStartTest: (testId: string) => Promise<{ ok: boolean; error?: string }>;
  onAskDoubt: (body: string) => Promise<{ ok: boolean; error?: string }>;
  onToggleDone: (done: boolean) => Promise<void>;
  /** Another topic of the same chapter. */
  onOpenTopic: (id: string) => void;
  onJoinClass: (id: string) => void;
  onWatchRecording: (cls: LiveClassItem) => void;
}) {
  const [tab, setTab] = useState<Tab>("content");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<"doubt" | "test" | "done" | null>(null);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [shareNote, setShareNote] = useState("");
  const share = async () => {
    const r = await shareText(topic.title, `${topic.chapter} · ${topic.subject} — CLATians`);
    if (r === "copied") { setShareNote("Copied"); setTimeout(() => setShareNote(""), 1500); }
  };

  const ytId = youtubeId(topic.videoUrl);
  const idx = topic.siblings.findIndex((s) => s.id === topic.id);
  const nextSibling = idx >= 0 ? topic.siblings[idx + 1] : undefined;
  const next = topic.nextClass;
  const countdown = useCountdown(next && next.status !== "live" ? next.startAt : undefined);
  const recordings = topic.pastClasses.filter((c) => c.recordingUrl);
  const notesIsPdf = !!topic.notesUrl && isLink(topic.notesUrl) && isPdfUrl(topic.notesUrl);

  const tabs: { key: Tab; label: string }[] = [
    { key: "content", label: "Content" },
    { key: "live", label: "Live Class" },
    { key: "notes", label: "Notes" },
    { key: "doubt", label: topic.doubts.length ? `Doubt (${topic.doubts.length})` : "Doubt" },
  ];

  const switchTab = (t: Tab) => { setErr(""); setSent(false); setTab(t); };

  const ask = async () => {
    setErr("");
    setBusy("doubt");
    const res = await onAskDoubt(draft);
    setBusy(null);
    if (res.ok) { setDraft(""); setSent(true); } else setErr(res.error ?? "Could not send your doubt.");
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

  // The opening paragraph of the notes (often a heading line + a sentence).
  const lead = topic.notes.trim().split(/\n\s*\n/)[0];
  const about = lead
    ? (lead.length > 260 ? lead.slice(0, 260).trimEnd() + "…" : lead)
    : `This topic is part of ${topic.chapter} in ${topic.subject}. Watch the lecture, read the notes and ask your doubts here.`;

  const steps = [
    { label: "Watch Video (Recorded)", done: topic.completed, tab: "content" as Tab, show: true },
    { label: "Attend Live Class (If Scheduled)", done: !!next?.attended, tab: "live" as Tab, show: true },
    { label: "Read Notes (PDF)", done: topic.completed && !!(topic.notes || topic.notesUrl), tab: "notes" as Tab, show: true },
    { label: "Take Topic Test", done: (topic.test?.myAttempts ?? 0) > 0, tab: "notes" as Tab, show: !!topic.test },
    { label: "Ask Doubt (If Any)", done: topic.doubts.length > 0, tab: "doubt" as Tab, show: true },
  ].filter((s) => s.show);

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "white" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "14px 16px 4px" }}>
          <button onClick={onBack} aria-label="Back" style={{ background: "none", border: "none", padding: 4, margin: -4, cursor: "pointer", display: "flex" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--ink-primary)" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: "var(--ink-primary)", lineHeight: 1.3 }}>{topic.title}</h2>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
              {topic.durationMin > 0 && <><AppIcon name="clock" size={12} style={{ display: "inline-block", verticalAlign: "-2px", marginRight: 4 }} />{topic.durationMin} min  •  </>}
              <span style={{ color: topic.completed ? "var(--success-text)" : "var(--text-muted)", fontWeight: topic.completed ? 700 : 500 }}>{topic.completed ? "Completed" : "Not Completed"}</span>
            </p>
          </div>
          {onToggleSave && (
            <button onClick={onToggleSave} aria-label={saved ? "Remove from saved" : "Save topic"} style={iconBtn}>
              <AppIcon name="heart" size={21} color={saved ? "#E03131" : "var(--ink-primary)"} fill={saved ? "#E03131" : "none"} />
            </button>
          )}
          <button onClick={share} aria-label="Share topic" style={iconBtn}>
            <AppIcon name="share" size={20} color="var(--ink-primary)" />
          </button>
          {shareNote && <span style={{ alignSelf: "center", fontSize: 11, fontWeight: 700, color: "var(--success-text)" }}>{shareNote}</span>}
        </div>
        <div style={{ display: "flex", borderBottom: "1px solid var(--line)", margin: "6px 16px 0" }}>
          {tabs.map((t) => (
            <button key={t.key} onClick={() => switchTab(t.key)} style={{
              flex: 1, background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap",
              padding: "11px 4px 10px", fontSize: 13, fontWeight: tab === t.key ? 800 : 600,
              color: tab === t.key ? "var(--blue)" : "var(--text-muted)",
              borderBottom: `2.5px solid ${tab === t.key ? "var(--blue)" : "transparent"}`, marginBottom: -1,
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: "14px 16px 18px" }}>
        {err && <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--error-text)", background: "var(--error)", borderRadius: 10, padding: "10px 12px" }}>{err}</p>}

        {/* ── 6/7 · CONTENT: lecture, about, steps, the chapter's video lessons ── */}
        {tab === "content" && (
          <>
            {ytId ? (
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
              <button onClick={() => window.open(topic.videoUrl.trim(), "_blank", "noopener")} style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: 16, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#0f1729,#1e2a4a)", color: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <span style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                </span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Watch lecture (opens in a new tab)</span>
              </button>
            ) : (
              <div style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: 16, background: "linear-gradient(135deg,#0f1729,#1e2a4a)", color: "rgba(255,255,255,0.8)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, textAlign: "center", padding: 16, boxSizing: "border-box" }}>
                <AppIcon name="video" size={30} color="currentColor" />
                <span style={{ fontSize: 13.5, fontWeight: 800, color: "white" }}>Video coming soon</span>
                <span style={{ fontSize: 12 }}>Meanwhile, read the notes for this topic.</span>
              </div>
            )}

            <p style={sectionTitle}>About this topic</p>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65, whiteSpace: "pre-line" }}>{about}</p>

            <div style={{ ...card, marginTop: 12, padding: "6px 14px" }}>
              {steps.map((s, i) => (
                <button key={s.label} onClick={() => switchTab(s.tab)} style={{ width: "100%", background: "none", border: "none", borderTop: i ? "1px solid var(--line)" : "none", cursor: "pointer", textAlign: "left", padding: "11px 0", display: "flex", alignItems: "center", gap: 12 }}>
                  <Check on={s.done} />
                  <span style={{ flex: 1, fontSize: 13, color: "var(--ink-primary)", fontWeight: 600 }}>{s.label}</span>
                </button>
              ))}
            </div>

            {topic.siblings.length > 1 && (
              <>
                <p style={sectionTitle}>Video Lessons</p>
                <div style={{ ...card, padding: "4px 12px" }}>
                  {topic.siblings.map((s, i) => {
                    const isMe = s.id === topic.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => !isMe && !s.locked && onOpenTopic(s.id)}
                        disabled={isMe || s.locked}
                        style={{ width: "100%", background: "none", border: "none", borderTop: i ? "1px solid var(--line)" : "none", cursor: isMe || s.locked ? "default" : "pointer", textAlign: "left", padding: "10px 0", display: "flex", alignItems: "center", gap: 12 }}
                      >
                        <span style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, background: isMe ? "var(--blue-tint)" : "var(--surface-dim)", color: isMe ? "var(--blue)" : "var(--ink-primary)" }}>{i + 1}</span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: "block", fontSize: 13, fontWeight: isMe ? 800 : 600, color: s.locked ? "var(--text-muted)" : "var(--ink-primary)" }}>{s.title}{isMe ? " (Now playing)" : ""}</span>
                          {s.durationMin > 0 && <span style={{ display: "block", fontSize: 11, color: "var(--text-disabled)", marginTop: 1 }}>⏱ {s.durationMin} min</span>}
                        </span>
                        <TopicState topic={s} current={isMe} />
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* ── 8 · LIVE CLASS ── */}
        {tab === "live" && (
          <>
            {next ? (
              <div style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <p style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: "var(--ink-primary)" }}>{next.status === "live" ? "Live now" : "Upcoming Live Class"}</p>
                  {next.status === "live" && (
                    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 800, color: "var(--red)" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--red)" }} /> Live
                    </span>
                  )}
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 700, color: "var(--text-secondary)" }}>{next.title}</p>
                <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "var(--text-muted)" }}>
                  <AppIcon name="calendar" size={13} style={{ display: "inline-block", verticalAlign: "-2px", marginRight: 5 }} />{fmtIST(next.startAt, { day: "numeric", month: "short", year: "numeric" })}  •  {fmtIST(next.startAt, { hour: "numeric", minute: "2-digit", hour12: true })} – {fmtIST(new Date(parseServerDate(next.startAt).getTime() + next.durationMin * 60_000).toISOString(), { hour: "numeric", minute: "2-digit", hour12: true })}
                </p>
                {next.teacher && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                    <span style={{ width: 38, height: 38, borderRadius: "50%", background: gradient, color: "white", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {next.teacher.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                    </span>
                    <span>
                      <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--ink-primary)" }}>{next.teacher}</span>
                      {next.subject && <span style={{ display: "block", fontSize: 11.5, color: "var(--text-muted)" }}>{next.subject}</span>}
                    </span>
                  </div>
                )}
                {countdown && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginTop: 14 }}>
                    {[["Days", countdown.days], ["Hours", countdown.hours], ["Minutes", countdown.minutes]].map(([l, v]) => (
                      <div key={l} style={{ background: "var(--app-bg)", borderRadius: 12, padding: "10px 4px", textAlign: "center" }}>
                        <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "var(--ink-primary)" }}>{v}</p>
                        <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>{l}</p>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => onJoinClass(next.id)} disabled={next.status !== "live"} style={{ ...primaryBtn, marginTop: 14, opacity: next.status === "live" ? 1 : 0.55, cursor: next.status === "live" ? "pointer" : "not-allowed" }}>
                  {next.status === "live" ? "▶ Join Live Class" : "Join opens when the class starts"}
                </button>
                {next.status !== "live" && (
                  <button onClick={() => window.open(calendarUrl(next), "_blank", "noopener")} style={{ ...outlineBtn, marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><AppIcon name="calendar" size={15} />Add to Calendar</button>
                )}
              </div>
            ) : (
              <Empty icon="video" title="No live class scheduled" text="When faculty schedule a live class for this course it shows up here." />
            )}

            <p style={sectionTitle}>Previous Live Classes</p>
            {recordings.length === 0 ? (
              <Empty icon="video" title="No recordings yet" text="Recordings of past classes appear here." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {recordings.map((c) => (
                  <div key={c.id} style={{ ...card, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ width: 44, height: 44, borderRadius: 12, background: "var(--blue-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AppIcon name="video" size={20} color="var(--blue)" /></span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--ink-primary)" }}>{c.title}</span>
                      <span style={{ display: "block", fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>{fmtIST(c.startAt, { day: "numeric", month: "short", year: "numeric" })}  •  {c.durationMin} min</span>
                    </span>
                    <button onClick={() => onWatchRecording(c)} style={smallBtn}>Watch</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── 9 · NOTES ── */}
        {tab === "notes" && (
          <>
            {(topic.notesUrl || !topic.notes) && <p style={{ ...sectionTitle, marginTop: 0 }}>Download Notes</p>}
            {topic.notesUrl && isLink(topic.notesUrl) ? (
              <>
                <div style={{ ...card, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 42, height: 48, borderRadius: 8, background: "var(--red)", color: "white", fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{notesIsPdf ? "PDF" : "FILE"}</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: "var(--ink-primary)" }}>{topic.title} – Notes</span>
                  {notesIsPdf && <button onClick={() => setShowPdf(!showPdf)} style={{ ...smallBtn, background: "white", border: "1.5px solid var(--blue-tint)" }}>{showPdf ? "Hide" : "View"}</button>}
                  <a href={topic.notesUrl.trim()} target="_blank" rel="noopener noreferrer" download style={{ ...smallBtn, textDecoration: "none" }}>Download</a>
                </div>
                {showPdf && notesIsPdf && <div style={{ marginTop: 10 }}><PdfViewer key={topic.notesUrl} url={topic.notesUrl} title={topic.title} /></div>}
              </>
            ) : !topic.notes ? (
              <Empty icon="file" title="Notes coming soon" text="Notes for this topic haven't been added yet." />
            ) : null}

            {topic.notes && (
              <div style={{ ...card, marginTop: topic.notesUrl ? 10 : 0 }}>
                <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 800, color: "var(--ink-primary)" }}>Topic notes</p>
                <div style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{topic.notes}</div>
              </div>
            )}

            {topic.test && (
              <>
                <p style={sectionTitle}>Additional Resources</p>
                <div style={{ ...card, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 42, height: 42, borderRadius: 10, background: "var(--gold-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AppIcon name="file" size={20} color="#B45309" /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--ink-primary)" }}>{topic.test.title}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
                      {topic.test.questionCount} questions · {topic.test.durationMin > 0 ? `${topic.test.durationMin} min` : "Untimed"}
                      {topic.test.bestScore !== null ? ` · Best ${topic.test.bestScore}/${topic.test.bestTotal}` : ""}
                    </span>
                  </span>
                  <button onClick={() => start(topic.test!.id)} disabled={busy === "test"} style={{ ...smallBtn, opacity: busy === "test" ? 0.6 : 1 }}>
                    {busy === "test" ? "…" : topic.test.myAttempts > 0 ? "Retry" : "Start"}
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* ── 10 · DOUBT ── */}
        {tab === "doubt" && (
          <>
            <p style={{ ...sectionTitle, marginTop: 0 }}>Ask Your Doubt</p>
            <div style={card}>
              <textarea
                value={draft}
                onChange={(e) => { setDraft(e.target.value); setSent(false); }}
                rows={4}
                placeholder="Type your doubt here… faculty will see it's about this topic."
                style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid var(--border)", borderRadius: 12, padding: "10px 12px", fontSize: 16, fontFamily: "inherit", resize: "vertical", color: "var(--ink-primary)" }}
              />
              <button onClick={ask} disabled={busy === "doubt" || !draft.trim()} style={{ ...primaryBtn, marginTop: 8, opacity: busy === "doubt" || !draft.trim() ? 0.6 : 1 }}>
                {busy === "doubt" ? "Sending…" : "Submit Doubt"}
              </button>
              {sent && <p style={{ margin: "8px 0 0", fontSize: 12.5, fontWeight: 700, color: "var(--success-text)", display: "flex", alignItems: "center", gap: 6 }}><AppIcon name="check" size={14} strokeWidth={3} />Sent to faculty. You&apos;ll be notified when they reply.</p>}
            </div>

            <p style={sectionTitle}>Doubt Solving Videos</p>
            {topic.solutionVideos.length === 0 ? (
              <div style={{ ...card, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--blue-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AppIcon name="video" size={20} color="var(--blue)" /></span>
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5 }}>When faculty answer a doubt on this topic with a video, it shows up here.</p>
              </div>
            ) : (
              <div style={{ ...card, padding: 0, overflow: "hidden" }}>
                {topic.solutionVideos.map((v, i) => {
                  const on = playing === v.id;
                  return (
                    <div key={v.id} style={{ borderTop: i ? "1px solid var(--line)" : "none", padding: "10px 12px" }}>
                      <button onClick={() => setPlaying(on ? null : v.id)} style={{ width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 12 }}>
                        <VideoThumb url={v.videoUrl} />
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontSize: 13, fontWeight: 700, color: "var(--ink-primary)", lineHeight: 1.4 }}>{v.question}</span>
                          <span style={{ display: "block", fontSize: 11.5, color: "var(--text-muted)", marginTop: 3 }}>{v.teacher ?? "Faculty"} · {fmtIST(v.createdAt, { day: "numeric", month: "short" })}</span>
                        </span>
                        <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <AppIcon name={on ? "chevronDown" : "play"} size={12} color="white" fill={on ? "none" : "white"} style={{ marginLeft: on ? 0 : 2 }} />
                        </span>
                      </button>
                      {on && <SolutionPlayer url={v.videoUrl} />}
                    </div>
                  );
                })}
              </div>
            )}

            {topic.doubts.length > 0 && <p style={sectionTitle}>Your doubts on this topic</p>}
            {topic.doubts.map((d) => (
              <div key={d.id} style={{ ...card, marginTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--ink-primary)", lineHeight: 1.55 }}>{d.body}</p>
                  <span style={{ flexShrink: 0, alignSelf: "flex-start", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20, background: d.status === "answered" ? "var(--success)" : "var(--warning)", color: d.status === "answered" ? "var(--success-text)" : "#92400E" }}>
                    {d.status === "answered" ? "Answered" : "Pending"}
                  </span>
                </div>
                {d.answer && (
                  <div style={{ marginTop: 10, background: "var(--blue-tint)", borderRadius: 12, padding: "10px 12px" }}>
                    <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 800, color: "var(--blue)" }}>{d.teacher ?? "Faculty"} replied</p>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{d.answer}</p>
                    {d.videoUrl && (
                      playing === `own-${d.id}` ? <SolutionPlayer url={d.videoUrl} /> : (
                        <button onClick={() => setPlaying(`own-${d.id}`)} style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, background: "white", border: "1.5px solid var(--blue)", color: "var(--blue)", borderRadius: 10, padding: "7px 12px", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>
                          <AppIcon name="play" size={12} fill="var(--blue)" />Watch solution video
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Mark complete → next topic */}
      <div style={{ position: "sticky", bottom: 0, background: "white", borderTop: "1px solid var(--line)", padding: "12px 16px calc(12px + env(safe-area-inset-bottom))", display: "flex", gap: 8 }}>
        <button onClick={toggle} disabled={busy === "done"} style={{
          flex: 1, borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 800, cursor: "pointer",
          border: topic.completed ? "1.5px solid var(--success-border)" : "none",
          background: topic.completed ? "var(--success)" : gradient,
          color: topic.completed ? "var(--success-text)" : "white",
          opacity: busy === "done" ? 0.7 : 1,
        }}>
          {topic.completed ? "Completed" : "Mark as complete"}
        </button>
        {topic.completed && nextSibling && (
          <button onClick={() => onOpenTopic(nextSibling.id)} style={{ flex: 1, borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 800, cursor: "pointer", border: "none", background: gradient, color: "white" }}>
            Next topic
          </button>
        )}
      </div>
    </div>
  );
}
