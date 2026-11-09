"use client";

import { useEffect, useRef, useState } from "react";
import type { TopicDetail } from "../../lib/topic-actions";
import type { LiveClassItem } from "./LiveClassesPage";
import { youtubeId } from "./ClassWatchPage";
import PdfViewer, { isPdfUrl } from "../PdfViewer";
import { TopicState } from "../learning/LearningFlow";
import { fmtIST, parseServerDate } from "../../lib/dates";
import { AppIcon, type IconName } from "../AppIcon";
import { shareText } from "../../lib/share";
import { AttachmentPicker, AttachmentPreview, type Attachment } from "../DoubtAttachment";
import { DEMO_VIDEO, DEMO_NOTES, DEMO_POSTER } from "../../lib/demo-media";

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

/** The lecture on its own screen: black backdrop, video filling the width, full-screen button. */
function LecturePlayer({ title, subtitle, ytId, src, demo, completed, busy, onToggleDone, onNext, onClose }: {
  title: string;
  subtitle: string;
  ytId: string | null;
  src: string;
  demo: boolean;
  completed: boolean;
  busy: boolean;
  onToggleDone: () => void;
  onNext?: () => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !document.fullscreenElement) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  const fullScreen = () => {
    const v = videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    const el = v ?? frameRef.current;
    if (el?.requestFullscreen) el.requestFullscreen().catch(() => v?.webkitEnterFullscreen?.());
    else v?.webkitEnterFullscreen?.();
  };

  const barBtn: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, padding: "12px 10px", fontSize: 13, fontWeight: 800, cursor: "pointer", flex: 1 };

  return (
    <div role="dialog" aria-label={`${title} lecture`} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#05070d", display: "flex", flexDirection: "column", color: "white" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "calc(12px + env(safe-area-inset-top)) 14px 12px", maxWidth: 900, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        <button onClick={onClose} aria-label="Close video" style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.12)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <AppIcon name="chevronRight" size={20} color="white" strokeWidth={2.5} style={{ transform: "rotate(180deg)" }} />
        </button>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 15, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
          <span style={{ display: "block", fontSize: 11.5, color: "rgba(255,255,255,0.6)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subtitle}</span>
        </span>
        {demo && <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 800, letterSpacing: "0.05em", padding: "3px 8px", borderRadius: 6, background: "rgba(8,189,128,0.9)" }}>DEMO</span>}
      </div>

      <div ref={frameRef} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0, background: "#000" }}>
        {ytId ? (
          <div style={{ position: "relative", width: "100%", maxWidth: 900, aspectRatio: "16 / 9", maxHeight: "100%" }}>
            <iframe src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&playsinline=1`} title={title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
          </div>
        ) : (
          <video ref={videoRef} src={src} autoPlay controls playsInline controlsList="nodownload" onContextMenu={(e) => e.preventDefault()}
            style={{ width: "100%", maxWidth: 900, maxHeight: "100%", background: "#000" }} />
        )}
      </div>

      <div style={{ display: "flex", gap: 8, padding: "12px 14px calc(14px + env(safe-area-inset-bottom))", maxWidth: 900, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {!ytId && (
          <button onClick={fullScreen} style={{ ...barBtn, border: "1.5px solid rgba(255,255,255,0.25)", background: "transparent", color: "white" }}>
            <AppIcon name="expand" size={15} color="white" />Full screen
          </button>
        )}
        {onNext ? (
          <button onClick={onNext} style={{ ...barBtn, border: "none", background: "var(--blue)", color: "white" }}>Next topic<AppIcon name="arrowRight" size={15} color="white" /></button>
        ) : (
          <button onClick={onToggleDone} disabled={busy} style={{ ...barBtn, border: "none", background: completed ? "#16a34a" : "var(--blue)", color: "white", opacity: busy ? 0.7 : 1 }}>
            {completed ? <><AppIcon name="check" size={15} color="white" strokeWidth={3} />Completed</> : "Mark as complete"}
          </button>
        )}
      </div>
    </div>
  );
}

/** One syllabus topic: its lecture, live class, notes and the student's doubts on it. */
export default function TopicPage({ topic, onBack, onStartTest, onAskDoubt, onToggleDone, onOpenTopic, onJoinClass, onDemoClass, onWatchRecording, saved = false, onToggleSave }: {
  topic: TopicDetail;
  /** Whether the student has saved this topic (the heart). */
  saved?: boolean;
  onToggleSave?: () => void;
  onBack: () => void;
  onStartTest: (testId: string) => Promise<{ ok: boolean; error?: string }>;
  onAskDoubt: (body: string, attachmentUrl?: string) => Promise<{ ok: boolean; error?: string }>;
  onToggleDone: (done: boolean) => Promise<void>;
  /** Another topic of the same chapter. */
  onOpenTopic: (id: string) => void;
  onJoinClass: (id: string) => void;
  /** No class scheduled: open the sample live class or recording, so the student sees how it works. */
  onDemoClass?: (kind: "live" | "recording") => void;
  onWatchRecording: (cls: LiveClassItem) => void;
}) {
  const [tab, setTab] = useState<Tab>("content");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<"doubt" | "test" | "done" | null>(null);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  // Notes open straight away inside the app; "Hide" collapses them.
  const [showPdf, setShowPdf] = useState(true);
  const [playing, setPlaying] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [shareNote, setShareNote] = useState("");
  // The checklist's "Watch Video" scrolls to the player and starts it.
  const [playerOpen, setPlayerOpen] = useState(false);
  const [stepHint, setStepHint] = useState("");
  const doubtRef = useRef<HTMLTextAreaElement>(null);
  const share = async () => {
    const r = await shareText(topic.title, `${topic.chapter} · ${topic.subject} — CLATians`);
    if (r === "copied") { setShareNote("Copied"); setTimeout(() => setShareNote(""), 1500); }
  };

  const ytId = youtubeId(topic.videoUrl);
  const idx = topic.siblings.findIndex((s) => s.id === topic.id);
  const nextSibling = idx >= 0 ? topic.siblings[idx + 1] : undefined;
  const next = topic.nextClass;
  // No class scheduled yet: a sample one (tomorrow, 10 AM) and a sample recording
  // fill the Live Class tab, so Join and Watch Recording work in a demo.
  const [demoTimes] = useState(() => {
    const start = new Date(); start.setDate(start.getDate() + 1); start.setHours(10, 0, 0, 0);
    const past = new Date(); past.setDate(past.getDate() - 3); past.setHours(17, 0, 0, 0);
    return { start: start.toISOString(), past: past.toISOString() };
  });
  const demoNext: LiveClassItem = { id: "demo", title: `${topic.title} — Live Session`, subject: topic.subject, teacher: "CLATians Faculty", startAt: demoTimes.start, durationMin: 60, status: "upcoming", joinUrl: "", attended: false };
  const cls = next ?? demoNext;
  const countdown = useCountdown(cls.status !== "live" ? cls.startAt : undefined);
  const recordings = topic.pastClasses.filter((c) => c.recordingUrl);
  const notesIsPdf = !!topic.notesUrl && isLink(topic.notesUrl) && isPdfUrl(topic.notesUrl);
  const notesIsImage = !!topic.notesUrl && isLink(topic.notesUrl) && /\.(png|jpe?g|webp|gif)($|[?#])/i.test(topic.notesUrl.trim());

  const tabs: { key: Tab; label: string }[] = [
    { key: "content", label: "Content" },
    { key: "live", label: "Live Class" },
    { key: "notes", label: "Notes" },
    { key: "doubt", label: topic.doubts.length ? `Doubt (${topic.doubts.length})` : "Doubt" },
  ];

  const switchTab = (t: Tab) => { setErr(""); setSent(false); setStepHint(""); setTab(t); };
  /** Show a tab from the checklist, starting at its top. */
  const goTab = (t: Tab) => {
    switchTab(t);
    requestAnimationFrame(() => document.getElementById("screen-content")?.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const ask = async () => {
    setErr("");
    setBusy("doubt");
    const res = await onAskDoubt(draft, attachment?.url ?? "");
    setBusy(null);
    if (res.ok) { setDraft(""); setAttachment(null); setSent(true); } else setErr(res.error ?? "Could not send your doubt.");
  };

  const [testBusy, setTestBusy] = useState<string | null>(null);
  const start = async (testId: string) => {
    setErr("");
    setBusy("test");
    setTestBusy(testId);
    const res = await onStartTest(testId);
    setBusy(null);
    setTestBusy(null);
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

  // Nothing uploaded yet: the demo lecture plays, so every step works in-app.
  const demoVideo = !topic.videoUrl || !isLink(topic.videoUrl);
  const demoNotes = !topic.notesUrl || !isLink(topic.notesUrl);
  const fileVideo = !!topic.videoUrl && isVideoFile(topic.videoUrl.trim());
  /** A lecture link that can't play in the app (not YouTube, not a video file). */
  const externalVideo = !ytId && !fileVideo && !demoVideo;
  const playerSrc = fileVideo ? topic.videoUrl.trim() : DEMO_VIDEO;
  const poster = ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : demoVideo ? DEMO_POSTER : undefined;
  const watch = () => {
    setStepHint("");
    if (externalVideo) window.open(topic.videoUrl.trim(), "_blank", "noopener");
    else setPlayerOpen(true);
  };
  const liveSub = !next ? "No class scheduled yet"
    : next.status === "live" ? "Live now"
    : `Next: ${fmtIST(next.startAt, { day: "numeric", month: "short" })}, ${fmtIST(next.startAt, { hour: "numeric", minute: "2-digit", hour12: true })}`;

  /** A topic's tests open in order: Topic Test 2 unlocks once Topic Test 1 is attempted. */
  const testLocked = (i: number) => i > 0 && topic.tests[i - 1].myAttempts === 0;
  const testSub = (t: TopicDetail["tests"][number], i: number) => testLocked(i)
    ? `Attempt Topic Test ${i} to unlock`
    : `${t.questionCount} questions${t.durationMin > 0 ? ` · ${t.durationMin} min` : ""}${t.myAttempts ? ` · ${t.myAttempts} attempt${t.myAttempts === 1 ? "" : "s"}` : ""}`;

  type StepKey = "video" | "live" | "notes" | "doubt" | `test:${string}`;
  const steps: { key: StepKey; label: string; sub: string; icon: IconName; action: string; done: boolean; live?: boolean; locked?: boolean }[] = [
    { key: "video", label: "Watch Video (Recorded)", sub: demoVideo ? "Demo lecture" : topic.durationMin > 0 ? `${topic.durationMin} min lecture` : "Recorded lecture", icon: "video", action: "Watch", done: topic.completed },
    { key: "live", label: "Attend Live Class (If Scheduled)", sub: next ? liveSub : `Next: ${fmtIST(demoNext.startAt, { day: "numeric", month: "short" })}, ${fmtIST(demoNext.startAt, { hour: "numeric", minute: "2-digit", hour12: true })}`, icon: "users", action: "Join", done: !!next?.attended, live: next?.status === "live" },
    { key: "notes", label: "Read Notes (PDF)", sub: demoNotes ? "Demo PDF notes" : notesIsPdf ? "PDF notes" : "Topic notes", icon: "file", action: "Read", done: topic.completed },
    ...topic.tests.map((t, i) => ({
      key: `test:${t.id}` as StepKey, label: `Topic Test ${i + 1}`, sub: testSub(t, i),
      icon: (testLocked(i) ? "lock" : "clipboard") as IconName,
      action: testBusy === t.id ? "Starting…" : testLocked(i) ? "Locked" : t.myAttempts ? "Retake" : "Start",
      done: t.myAttempts > 0, locked: testLocked(i),
    })),
    { key: "doubt", label: "Ask Doubt (If Any)", sub: topic.doubts.length ? `${topic.doubts.length} asked` : "Faculty answer on this topic", icon: "chat", action: "Ask", done: topic.doubts.length > 0 },
  ];
  /** What each checklist row does when tapped. */
  const onStep = (key: StepKey) => {
    if (key === "video") watch();
    else if (key === "live") goTab("live");
    else if (key === "notes") goTab("notes");
    else if (key.startsWith("test:")) {
      const i = topic.tests.findIndex((t) => `test:${t.id}` === key);
      if (i < 0 || busy === "test") return;
      if (testLocked(i)) setStepHint(`Attempt Topic Test ${i} first — then Topic Test ${i + 1} unlocks.`);
      else start(topic.tests[i].id);
    }
    else { goTab("doubt"); setTimeout(() => doubtRef.current?.focus(), 250); }
  };

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
            {externalVideo ? (
              <button onClick={watch} style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: 16, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#0f1729,#1e2a4a)", color: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <span style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AppIcon name="play" size={22} color="white" fill="white" style={{ marginLeft: 3 }} />
                </span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Watch lecture (opens in a new tab)</span>
              </button>
            ) : (
              // Tap to watch: the lecture opens in its own full-screen player.
              <button onClick={watch} aria-label={`Play ${topic.title}`} style={{ position: "relative", display: "block", width: "100%", aspectRatio: "16 / 9", padding: 0, border: "none", borderRadius: 16, overflow: "hidden", cursor: "pointer", background: "linear-gradient(135deg,#0f1729,#1e2a4a)", boxShadow: "0 6px 20px rgba(0,0,0,0.18)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {poster && <img src={poster} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
                <span style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.65) 100%)" }} />
                <span style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 62, height: 62, borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 22px rgba(0,0,0,0.35)" }}>
                  <AppIcon name="play" size={24} color="var(--blue)" fill="var(--blue)" style={{ marginLeft: 3 }} />
                </span>
                {demoVideo && <span style={{ position: "absolute", top: 10, left: 10, fontSize: 10, fontWeight: 800, letterSpacing: "0.05em", padding: "3px 8px", borderRadius: 6, background: "rgba(8,189,128,0.92)", color: "white" }}>DEMO LECTURE</span>}
                <span style={{ position: "absolute", left: 12, right: 12, bottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, color: "white", textAlign: "left" }}>
                  <span style={{ fontSize: 13, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Watch lecture</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700, flexShrink: 0 }}><AppIcon name="clock" size={12} color="white" />{topic.durationMin > 0 ? `${topic.durationMin} min` : "Full screen"}</span>
                </span>
              </button>
            )}

            <p style={sectionTitle}>About this topic</p>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65, whiteSpace: "pre-line" }}>{about}</p>

            <div style={{ ...card, marginTop: 12, padding: "4px 12px" }}>
              {steps.map((s, i) => (
                <button key={s.key} onClick={() => onStep(s.key)} className="press" style={{ width: "100%", background: "none", border: "none", borderTop: i ? "1px solid var(--line)" : "none", cursor: "pointer", textAlign: "left", padding: "11px 0", display: "flex", alignItems: "center", gap: 11 }}>
                  <Check on={s.done} />
                  <span style={{ width: 34, height: 34, borderRadius: 10, background: s.live ? "#FFE4E6" : s.locked ? "var(--surface-dim)" : "var(--blue-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <AppIcon name={s.icon} size={17} color={s.live ? "#E03131" : s.locked ? "var(--text-disabled)" : "var(--blue)"} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13, color: s.locked ? "var(--text-muted)" : "var(--ink-primary)", fontWeight: 700 }}>{s.label}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: s.live ? "#E03131" : "var(--text-muted)", fontWeight: s.live ? 700 : 500, marginTop: 2 }}>
                      {s.live && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#E03131" }} />}
                      {s.sub}
                    </span>
                  </span>
                  <span style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 2, fontSize: 12, fontWeight: 800, color: s.live ? "#E03131" : s.locked ? "var(--text-disabled)" : "var(--blue)" }}>
                    {s.action}{!s.locked && <AppIcon name="chevronRight" size={14} />}
                  </span>
                </button>
              ))}
            </div>
            {stepHint && <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "var(--warning-text)", background: "var(--warning)", borderRadius: 10, padding: "9px 12px" }}>{stepHint}</p>}

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
        {tab === "live" && (() => {
          const isDemo = !next;
          const isLive = cls.status === "live";
          const canJoin = isDemo || isLive;
          const end = new Date(parseServerDate(cls.startAt).getTime() + cls.durationMin * 60_000).toISOString();
          const teacher = cls.teacher || "CLATians Faculty";
          const pastList: LiveClassItem[] = recordings.length ? recordings
            : isDemo ? [{ id: "demo-rec", title: `${topic.title} — Doubt Session`, subject: topic.subject, teacher: "CLATians Faculty", startAt: demoTimes.past, durationMin: 45, status: "ended", joinUrl: "", attended: false, recordingUrl: "demo" }] : [];
          return (
            <>
              <div style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--ink-primary)" }}>{isLive ? "Live Now" : "Upcoming Live Class"}</p>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 800, color: "#E03131" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#E03131" }} />Live
                  </span>
                </div>
                <p style={{ margin: "10px 0 0", display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--text-secondary)" }}>
                  <AppIcon name="calendar" size={15} color="var(--blue)" />
                  {fmtIST(cls.startAt, { day: "numeric", month: "short", year: "numeric" })}
                  <span style={{ color: "var(--text-disabled)" }}>•</span>
                  {fmtIST(cls.startAt, { hour: "numeric", minute: "2-digit", hour12: true })} – {fmtIST(end, { hour: "numeric", minute: "2-digit", hour12: true })}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                  <span style={{ width: 40, height: 40, borderRadius: "50%", background: gradient, color: "white", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {teacher.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                  </span>
                  <span>
                    <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: "var(--ink-primary)" }}>{teacher}</span>
                    <span style={{ display: "block", fontSize: 12, color: "var(--text-muted)" }}>{cls.subject ? `${cls.subject} Expert` : "Faculty"}</span>
                  </span>
                </div>
                {countdown && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginTop: 14 }}>
                    {[["Days", countdown.days], ["Hours", countdown.hours], ["Minutes", countdown.minutes]].map(([l, v]) => (
                      <div key={l} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: "10px 4px", textAlign: "center" }}>
                        <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "var(--ink-primary)" }}>{v}</p>
                        <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>{l}</p>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => (isDemo ? onDemoClass?.("live") : onJoinClass(cls.id))} disabled={!canJoin} style={{ ...primaryBtn, marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: canJoin ? 1 : 0.55, cursor: canJoin ? "pointer" : "not-allowed" }}>
                  <AppIcon name="video" size={16} color="white" />{canJoin ? "Join Live Class" : "Join opens when the class starts"}
                </button>
                <button onClick={() => window.open(calendarUrl(cls), "_blank", "noopener")} style={{ ...outlineBtn, marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                  <AppIcon name="calendar" size={15} />Add to Calendar
                </button>
                {isDemo && <p style={{ margin: "10px 0 0", display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--text-muted)" }}><AppIcon name="info" size={13} />Sample class — tap Join to see how a live class works.</p>}
              </div>

              <p style={sectionTitle}>Previous Live Classes</p>
              {pastList.length === 0 ? (
                <Empty icon="video" title="No recordings yet" text="Recordings of past classes appear here." />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {pastList.map((c) => (
                    <div key={c.id} style={{ ...card, padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <span style={{ width: 48, height: 48, borderRadius: 12, background: "var(--blue-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AppIcon name="video" size={22} color="var(--blue)" /></span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--ink-primary)" }}>{c.title}</span>
                        <span style={{ display: "block", fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>{fmtIST(c.startAt, { day: "numeric", month: "short", year: "numeric" })}  •  {c.durationMin} min</span>
                        <button onClick={() => (c.id === "demo-rec" ? onDemoClass?.("recording") : onWatchRecording(c))} style={{ ...smallBtn, marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <AppIcon name="play" size={11} color="var(--blue)" fill="var(--blue)" />Watch Recording
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          );
        })()}

        {/* ── 9 · NOTES ── */}
        {tab === "notes" && (
          <>
            <p style={{ ...sectionTitle, marginTop: 0 }}>{topic.notesDownload ? "Download Notes" : "Notes"}</p>
            {topic.notesUrl && isLink(topic.notesUrl) ? (
              <>
                <div style={{ ...card, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 42, height: 48, borderRadius: 8, background: "var(--red)", color: "white", fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{notesIsPdf ? "PDF" : notesIsImage ? "IMG" : "FILE"}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--ink-primary)" }}>{topic.title} – Notes</span>
                    {!topic.notesDownload && (notesIsPdf || notesIsImage) && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2, fontSize: 11, color: "var(--text-muted)" }}><AppIcon name="lock" size={11} color="var(--text-muted)" />View in app only</span>
                    )}
                  </span>
                  {(notesIsPdf || notesIsImage) && <button onClick={() => setShowPdf(!showPdf)} style={{ ...smallBtn, background: "white", border: "1.5px solid var(--blue-tint)" }}>{showPdf ? "Hide" : "View"}</button>}
                  {(topic.notesDownload || !(notesIsPdf || notesIsImage)) && (
                    <a href={topic.notesUrl.trim()} target="_blank" rel="noopener noreferrer" download={topic.notesDownload || undefined} style={{ ...smallBtn, textDecoration: "none" }}>{topic.notesDownload ? "Download" : "Open"}</a>
                  )}
                </div>
                {showPdf && notesIsPdf && <div style={{ marginTop: 10 }}><PdfViewer key={topic.notesUrl} url={topic.notesUrl} title={topic.title} allowDownload={topic.notesDownload} /></div>}
                {showPdf && notesIsImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={topic.notesUrl.trim()} alt={`${topic.title} notes`} draggable={false} onContextMenu={topic.notesDownload ? undefined : (e) => e.preventDefault()}
                    style={{ display: "block", width: "100%", marginTop: 10, borderRadius: 12, background: "white", userSelect: "none", WebkitTouchCallout: topic.notesDownload ? undefined : "none" }} />
                )}
              </>
            ) : (
              // No PDF uploaded yet: the sample notes PDF opens in the app.
              <>
                <div style={{ ...card, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 42, height: 48, borderRadius: 8, background: "var(--red)", color: "white", fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>PDF</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--ink-primary)" }}>Sample notes (demo)</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2, fontSize: 11, color: "var(--text-muted)" }}><AppIcon name="lock" size={11} color="var(--text-muted)" />View in app only</span>
                  </span>
                  <button onClick={() => setShowPdf(!showPdf)} style={{ ...smallBtn, background: "white", border: "1.5px solid var(--blue-tint)" }}>{showPdf ? "Hide" : "View"}</button>
                </div>
                {showPdf && <div style={{ marginTop: 10 }}><PdfViewer key={DEMO_NOTES} url={DEMO_NOTES} title={`${topic.title} – sample notes`} allowDownload={false} /></div>}
              </>
            )}


            {topic.tests.length > 0 && (
              <>
                <p style={sectionTitle}>Topic Tests</p>
                <div style={{ ...card, padding: 0, overflow: "hidden" }}>
                  {topic.tests.map((t, i) => {
                    const locked = testLocked(i);
                    return (
                      <div key={t.id} style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, borderTop: i ? "1px solid var(--line)" : "none" }}>
                        <span style={{ width: 40, height: 40, borderRadius: 10, background: locked ? "var(--surface-dim)" : "var(--gold-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <AppIcon name={locked ? "lock" : "clipboard"} size={18} color={locked ? "var(--text-disabled)" : "#B45309"} />
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: locked ? "var(--text-muted)" : "var(--ink-primary)" }}>Topic Test {i + 1}</span>
                          <span style={{ display: "block", fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
                            {testSub(t, i)}{!locked && t.bestScore !== null ? ` · Best ${t.bestScore}/${t.bestTotal}` : ""}
                          </span>
                        </span>
                        {locked ? (
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700, color: "var(--text-disabled)" }}><AppIcon name="lock" size={13} color="var(--text-disabled)" />Locked</span>
                        ) : (
                          <button onClick={() => start(t.id)} disabled={busy === "test"} style={{ ...smallBtn, opacity: busy === "test" && testBusy !== t.id ? 0.6 : 1 }}>
                            {testBusy === t.id ? "…" : t.myAttempts > 0 ? "Retake" : "Start"}
                          </button>
                        )}
                      </div>
                    );
                  })}
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
                ref={doubtRef}
                value={draft}
                onChange={(e) => { setDraft(e.target.value); setSent(false); }}
                rows={4}
                placeholder="Type your doubt here… faculty will see it's about this topic."
                style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid var(--border)", borderRadius: 12, padding: "10px 12px", fontSize: 16, fontFamily: "inherit", resize: "vertical", color: "var(--ink-primary)" }}
              />
              <div style={{ marginTop: 8 }}>
                <AttachmentPicker value={attachment} onChange={(a) => { setAttachment(a); setSent(false); }} disabled={busy === "doubt"} />
              </div>
              <button onClick={ask} disabled={busy === "doubt" || (!draft.trim() && !attachment)} style={{ ...primaryBtn, marginTop: 8, opacity: busy === "doubt" || (!draft.trim() && !attachment) ? 0.6 : 1 }}>
                {busy === "doubt" ? "Sending…" : "Submit Doubt"}
              </button>
              {sent && <p style={{ margin: "8px 0 0", fontSize: 12.5, fontWeight: 700, color: "var(--success-text)", display: "flex", alignItems: "center", gap: 6 }}><AppIcon name="check" size={14} strokeWidth={3} />Sent to faculty. You&apos;ll be notified when they reply.</p>}
            </div>

            <p style={sectionTitle}>Doubt Solving Videos</p>
            {topic.solutionVideos.length === 0 ? (
              // None yet: a sample, so the student sees what a video answer looks like.
              <div style={{ ...card, padding: "10px 12px" }}>
                <button onClick={() => setPlaying(playing === "demo" ? null : "demo")} style={{ width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 12 }}>
                  <VideoThumb url={DEMO_VIDEO} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 10, fontWeight: 800, color: "var(--green)", letterSpacing: "0.05em" }}>SAMPLE</span>
                    <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--ink-primary)", lineHeight: 1.4 }}>How do I find the main idea when a passage gives two views?</span>
                    <span style={{ display: "block", fontSize: 11.5, color: "var(--text-muted)", marginTop: 3 }}>CLATians Faculty · video answer</span>
                  </span>
                  <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <AppIcon name={playing === "demo" ? "chevronDown" : "play"} size={12} color="white" fill={playing === "demo" ? "none" : "white"} style={{ marginLeft: playing === "demo" ? 0 : 2 }} />
                  </span>
                </button>
                {playing === "demo" && <SolutionPlayer url={DEMO_VIDEO} />}
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

            {!topic.doubts.some((d) => d.answer) && (
              <>
                <p style={sectionTitle}>How an answer looks</p>
                <div style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--ink-primary)", lineHeight: 1.55 }}>In the tree passage, is &quot;trees lower temperatures&quot; the main idea?</p>
                    <span style={{ flexShrink: 0, alignSelf: "flex-start", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20, background: "var(--surface-dim)", color: "var(--text-muted)" }}>Example</span>
                  </div>
                  <div style={{ marginTop: 10, background: "var(--blue-tint)", borderRadius: 12, padding: "10px 12px" }}>
                    <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 800, color: "var(--blue)" }}>CLATians Faculty replied</p>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>No — that is a supporting detail. The main idea is the author&apos;s claim that trees should be funded like infrastructure; the temperature fact is evidence for it.</p>
                  </div>
                </div>
              </>
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
                {d.attachmentUrl && <AttachmentPreview url={d.attachmentUrl} />}
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

      {playerOpen && (
        <LecturePlayer
          title={topic.title}
          subtitle={`${topic.chapter} · ${topic.subject}`}
          ytId={ytId}
          src={playerSrc}
          demo={demoVideo}
          completed={topic.completed}
          busy={busy === "done"}
          onToggleDone={toggle}
          onNext={topic.completed && nextSibling ? () => { setPlayerOpen(false); onOpenTopic(nextSibling.id); } : undefined}
          onClose={() => setPlayerOpen(false)}
        />
      )}

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
