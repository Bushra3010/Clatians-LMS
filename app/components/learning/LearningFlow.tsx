"use client";

import { useEffect, useState } from "react";
import type { CatalogItem, CatalogBatch } from "../CoursesScreen";
import type { CourseSyllabus, LearningChapter, LearningTopic } from "../../lib/learning";
import { getCourseSyllabusAction, getBatchExtrasAction, type BatchExtras } from "../../lib/learning-actions";
import { fmtIST } from "../../lib/dates";
import { BatchInfoPanel, BatchInfoSwitch, batchInfoTabs, Check, type BatchInfoTab } from "../BatchInfo";
import { AppIcon, courseIconName, type IconName } from "../AppIcon";
import { shareText } from "../../lib/share";

/** Topics finished per enrolled course — loaded with the page for the My Learning list. */
export type LearningProgress = { courseId: string; lessons: number; done: number; minutes: number };

/** Where the student is in My Learning. Lives in StudentApp so it survives opening a topic. */
export type LearningNav =
  | { view: "list" }
  | { view: "batch"; courseId: string; batchId: string | null }
  | { view: "subject"; courseId: string; batchId: string | null; subject: string }
  | { view: "chapter"; courseId: string; chapterId: string; from: string };

const gradient = "linear-gradient(135deg,var(--blue-dark),var(--blue))";
const card: React.CSSProperties = { background: "white", borderRadius: 16, boxShadow: "0 2px 10px rgba(15,23,41,0.06)" };

export const fmtDuration = (min: number) => {
  if (min <= 0) return "";
  const h = Math.floor(min / 60), m = min % 60;
  return h > 0 ? `${h} hr${m ? ` ${m} min` : ""}` : `${m} min`;
};
const pctOf = (done: number, total: number) => (total > 0 ? Math.round((done / total) * 100) : 0);

// ── Shared bits ──

function Chevron({ color = "var(--text-muted)" }: { color?: string }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6" /></svg>;
}

function Header({ title, onBack, right }: { title: string; onBack: () => void; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px 6px" }}>
      <button onClick={onBack} aria-label="Back" style={{ background: "none", border: "none", padding: 4, margin: -4, cursor: "pointer", display: "flex" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--ink-primary)" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
      </button>
      <h2 style={{ flex: 1, minWidth: 0, margin: 0, fontSize: 16.5, fontWeight: 800, color: "var(--ink-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</h2>
      {right}
    </div>
  );
}

function Pill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 8, background: bg, color }}>{label}</span>;
}

/** Underlined tab strip, as in the mockups. */
function Tabs<T extends string>({ tabs, active, onChange }: { tabs: { key: T; label: string }[]; active: T; onChange: (t: T) => void }) {
  return (
    <div style={{ display: "flex", borderBottom: "1px solid var(--line)", margin: "0 16px", overflowX: "auto", scrollbarWidth: "none" }}>
      {tabs.map((t) => (
        <button key={t.key} onClick={() => onChange(t.key)} style={{
          flex: "1 0 auto", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap",
          padding: "11px 8px 10px", fontSize: 13, fontWeight: active === t.key ? 800 : 600,
          color: active === t.key ? "var(--blue)" : "var(--text-muted)",
          borderBottom: `2.5px solid ${active === t.key ? "var(--blue)" : "transparent"}`, marginBottom: -1,
        }}>{t.label}</button>
      ))}
    </div>
  );
}

function Bar({ pct, height = 6 }: { pct: number; height?: number }) {
  return (
    <div style={{ height, background: "var(--surface-dim)", borderRadius: height, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: "var(--green)", borderRadius: height }} />
    </div>
  );
}

function Num({ n, active }: { n: number; active?: boolean }) {
  return (
    <span style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, background: active ? "var(--blue-tint)" : "var(--surface-dim)", color: active ? "var(--blue)" : "var(--ink-primary)", border: active ? "1.5px solid var(--blue)" : "none" }}>{n}</span>
  );
}

function Empty({ icon, title, text, action }: { icon: IconName; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div style={{ ...card, textAlign: "center", padding: "28px 18px" }}>
      <span style={{ width: 56, height: 56, borderRadius: 18, background: "var(--blue-tint)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
        <AppIcon name={icon} size={26} color="var(--blue)" />
      </span>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--ink-primary)" }}>{title}</p>
      <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--text-disabled)", lineHeight: 1.5 }}>{text}</p>
      {action}
    </div>
  );
}

function Loading() {
  return <p style={{ margin: "24px 0", textAlign: "center", fontSize: 13, color: "var(--text-disabled)" }}>Loading…</p>;
}

const heroBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.18)",
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
};
const primaryBtn: React.CSSProperties = {
  background: gradient, color: "white", border: "none", borderRadius: 12, padding: "11px 16px",
  fontSize: 13.5, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 12px rgba(11,92,255,0.25)",
};

// ── Data ──

// Kept across remounts (opening a topic unmounts the flow) so coming back
// shows the last copy at once while a fresh one loads.
const syllabusCache = new Map<string, CourseSyllabus>();

function useSyllabus(courseId: string) {
  const [data, setData] = useState<CourseSyllabus | null>(() => syllabusCache.get(courseId) ?? null);
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    getCourseSyllabusAction(courseId).then((res) => {
      if (!live) return;
      if (res.ok) { syllabusCache.set(courseId, res.syllabus); setData(res.syllabus); }
      else setError(res.error);
    });
    return () => { live = false; };
  }, [courseId]);
  return { data, error };
}

const allTopics = (s: CourseSyllabus) => s.chapters.flatMap((c) => c.topics);
/** The first open topic the student hasn't finished — where "Continue" goes. */
const nextTopic = (s: CourseSyllabus): LearningTopic | undefined => allTopics(s).find((t) => !t.completed && !t.locked);

// ── Flow ──

interface LearningFlowProps {
  catalog: CatalogItem[];
  progress: LearningProgress[];
  nav: LearningNav;
  onNav: (next: LearningNav) => void;
  onBack: () => void;
  onOpenTopic: (topicId: string) => void;
  onBrowseCourses: () => void;
  onOpenLibrary: () => void;
  onOpenNotifications?: () => void;
  unreadCount?: number;
  /** Saved batches, as "courseId:batchId" keys (the heart on a batch). */
  savedBatchKeys?: string[];
  onToggleSaveBatch?: (key: string, title: string, subtitle: string) => void;
}

/**
 * My Learning, laid out like the mockup with subjects where it shows batches:
 * purchased batches → batch (Subjects tab) → subject (Chapters) → chapter (topics) → topic.
 */
export default function LearningFlow(props: LearningFlowProps) {
  const { catalog, nav } = props;
  const course = nav.view === "list" ? undefined : catalog.find((c) => c.id === nav.courseId);
  if (nav.view === "list" || !course) return <MyLearningList {...props} />;
  if (nav.view === "chapter") return <ChapterView key={nav.chapterId} {...props} course={course} chapterId={nav.chapterId} />;
  // Right after a purchase the batch may not be in the catalog yet; fall back to the course's own enrolled batch.
  const batch = (nav.batchId ? course.batches.find((b) => b.id === nav.batchId) : undefined) ?? course.batches.find((b) => b.enrolled) ?? null;
  if (nav.view === "subject") return <SubjectView key={`${batch?.id ?? course.id}-${nav.subject}`} {...props} course={course} batch={batch} subject={nav.subject} />;
  return <BatchHome key={batch?.id ?? course.id} {...props} course={course} batch={batch} />;
}

/** What the student bought: each purchased batch, or the course itself when it was bought without one. */
type Owned = { key: string; course: CatalogItem; batch: CatalogBatch | null };
function ownedItems(catalog: CatalogItem[]): Owned[] {
  return catalog.flatMap((c): Owned[] => {
    const mine = c.batches.filter((b) => b.enrolled);
    if (mine.length > 0) return mine.map((b) => ({ key: b.id, course: c, batch: b }));
    return c.enrolled ? [{ key: c.id, course: c, batch: null }] : [];
  });
}

/** Chapters grouped by subject, in syllabus order. */
type SubjectGroup = { name: string; chapters: LearningChapter[] };
function bySubject(s: CourseSyllabus): SubjectGroup[] {
  const out: SubjectGroup[] = [];
  for (const ch of s.chapters) {
    const name = ch.subject || "General";
    let g = out.find((x) => x.name === name);
    if (!g) { g = { name, chapters: [] }; out.push(g); }
    g.chapters.push(ch);
  }
  return out;
}

/** A chapter's number inside its own subject (1-based). */
function localChapterNumber(s: CourseSyllabus, ch: LearningChapter): number {
  return s.chapters.filter((x) => (x.subject || "General") === (ch.subject || "General")).findIndex((x) => x.id === ch.id) + 1;
}

/** A subject's status pill, in the spirit of the mockup's Active / Upcoming / Closed. */
function subjectState(done: number, total: number): { label: string; bg: string; color: string } {
  if (total > 0 && done >= total) return { label: "Completed", bg: "var(--success)", color: "var(--success-text)" };
  if (done > 0) return { label: "In progress", bg: "var(--blue-tint)", color: "var(--blue)" };
  return { label: "Not started", bg: "var(--surface-dim)", color: "var(--text-muted)" };
}

function Meta({ icon, children }: { icon: IconName; children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <AppIcon name={icon} size={14} color="var(--text-muted)" />{children}
    </span>
  );
}

// ── 2 · My Learning — the batches they bought ──

type ListTab = "enrolled" | "resources";

function MyLearningList({ catalog, progress, onNav, onBrowseCourses, onOpenLibrary, onOpenNotifications, unreadCount = 0 }: LearningFlowProps) {
  const [tab, setTab] = useState<ListTab>("enrolled");
  const prog = (id: string) => progress.find((p) => p.courseId === id) ?? { courseId: id, lessons: 0, done: 0, minutes: 0 };
  const owned = ownedItems(catalog);

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%", paddingBottom: 24 }}>
      <div style={{ background: "white", paddingTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 16px 10px" }}>
          <span style={{ width: 36 }} />
          <h2 style={{ flex: 1, margin: 0, fontSize: 21, fontWeight: 900, color: "var(--ink-primary)", textAlign: "center" }}>My Learning</h2>
          {onOpenNotifications ? (
            <button onClick={onOpenNotifications} aria-label="Notifications" style={{ position: "relative", width: 36, height: 36, borderRadius: "50%", border: "none", background: "var(--app-bg)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AppIcon name="bell" size={19} color="var(--ink-primary)" />
              {unreadCount > 0 && <span style={{ position: "absolute", top: 6, right: 7, width: 8, height: 8, borderRadius: "50%", background: "#E03131", border: "1.5px solid white" }} />}
            </button>
          ) : <span style={{ width: 36 }} />}
        </div>
        <Tabs<ListTab>
          tabs={[
            { key: "enrolled", label: `Enrolled (${owned.length})` },
            { key: "resources", label: "Free Resources" },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      <div style={{ padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {tab === "enrolled" ? (
          <>
            {owned.length === 0 && (
              <Empty icon="graduation" title="No batch yet" text="Buy a batch and it shows up here with your progress."
                action={<button onClick={onBrowseCourses} style={{ ...primaryBtn, marginTop: 14 }}>Browse courses</button>} />
            )}

            {owned.map(({ key, course: c, batch: b }) => {
              const p = prog(c.id);
              const pct = pctOf(p.done, p.lessons);
              const label = p.lessons > 0 && pct >= 100 ? "Review" : p.done > 0 ? "Continue" : "Start Learning";
              const open = () => onNav({ view: "batch", courseId: c.id, batchId: b?.id ?? null });
              return (
                <div key={key} style={{ ...card, padding: 12, display: "flex", gap: 12 }}>
                  <button onClick={open} aria-label={b?.name ?? c.name} style={{ width: 88, height: 88, borderRadius: 14, flexShrink: 0, border: "none", cursor: "pointer", background: gradient, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <AppIcon name={courseIconName(c)} size={38} color="white" strokeWidth={1.6} />
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <button onClick={open} style={{ display: "block", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", fontSize: 14.5, fontWeight: 800, color: "var(--ink-primary)", lineHeight: 1.3 }}>{b?.name ?? c.name}</button>
                    {b && <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "var(--text-muted)" }}>{c.name}</p>}
                    <div style={{ display: "flex", justifyContent: "space-between", margin: "5px 0 5px", fontSize: 11.5, color: "var(--text-muted)" }}>
                      <span>{pct}% Completed</span>
                      <span style={{ fontWeight: 700 }}>{pct}%</span>
                    </div>
                    <Bar pct={pct} />
                    <p style={{ margin: "6px 0 8px", fontSize: 11, color: "var(--text-disabled)", display: "flex", alignItems: "center", gap: 5 }}>
                      <AppIcon name="file" size={12} color="var(--text-disabled)" />
                      {[p.lessons > 0 && `${p.lessons} Lessons`, (b?.duration || c.duration || fmtDuration(p.minutes)).replace(/\s*\(.*\)$/, "")].filter(Boolean).join(" • ")}
                    </p>
                    <button onClick={open} style={{
                      ...primaryBtn, width: "100%", padding: "9px", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      ...(label === "Start Learning" ? { background: "var(--error)", color: "var(--error-text)", boxShadow: "none" }
                        : label === "Review" ? { background: "var(--blue-tint)", color: "var(--blue)", boxShadow: "none" } : {}),
                    }}>{label}<AppIcon name="arrowRight" size={14} /></button>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <>
            <button onClick={onOpenLibrary} style={{ ...card, border: "none", cursor: "pointer", padding: "16px", display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}>
              <span style={{ width: 48, height: 48, borderRadius: 14, background: gradient, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AppIcon name="library" size={23} color="white" /></span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 14.5, fontWeight: 800, color: "var(--ink-primary)" }}>Free Study Resources</span>
                <span style={{ display: "block", fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>Open to every student, no batch needed</span>
              </span>
              <Chevron />
            </button>

            <div style={{ ...card, padding: 0, overflow: "hidden" }}>
              {[
                { icon: "video" as IconName, label: "Video Lectures" },
                { icon: "file" as IconName, label: "Study Notes" },
                { icon: "clipboard" as IconName, label: "Practice Questions" },
                { icon: "newspaper" as IconName, label: "Current Affairs" },
              ].map((r, i) => (
                <button key={r.label} onClick={onOpenLibrary} style={{ width: "100%", background: "none", border: "none", borderTop: i ? "1px solid var(--line)" : "none", cursor: "pointer", textAlign: "left", padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--blue-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AppIcon name={r.icon} size={17} color="var(--blue)" /></span>
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: "var(--ink-primary)" }}>{r.label}</span>
                  <Chevron />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ChapterRow({ ch, n, onOpen }: { ch: LearningChapter; n: number; onOpen: () => void }) {
  const done = ch.topics.filter((t) => t.completed).length;
  const all = ch.topics.length > 0 && done === ch.topics.length;
  return (
    <button onClick={onOpen} style={{ ...card, border: "none", width: "100%", cursor: "pointer", textAlign: "left", padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
      <Num n={n} active={done > 0 && !all} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: "var(--ink-primary)" }}>{ch.title}</span>
        <span style={{ display: "block", fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
          {ch.topics.length} {ch.topics.length === 1 ? "Topic" : "Topics"}
          {done > 0 && <span style={{ color: "var(--success-text)", fontWeight: 700 }}> · {done}/{ch.topics.length} done</span>}
        </span>
      </span>
      {all
        ? <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AppIcon name="check" size={13} strokeWidth={3} color="white" /></span>
        : <Chevron />}
    </button>
  );
}

// ── 3 · Batch — mockup screen 3, with the batch's Subjects where the mockup lists batches ──

type HomeTab = "overview" | "subjects" | "instructors";

function BatchHome({ course: c, batch: b, onBack, onNav, onOpenTopic, savedBatchKeys = [], onToggleSaveBatch }: LearningFlowProps & { course: CatalogItem; batch: CatalogBatch | null }) {
  const [tab, setTab] = useState<HomeTab>("subjects");
  const { data, error } = useSyllabus(c.id);
  const [infoTab, setInfoTab] = useState<BatchInfoTab>("overview");
  const infoTabs = b ? batchInfoTabs(b, true) : [];
  const subjects = data ? bySubject(data) : [];
  const topics = data ? allTopics(data) : [];
  const done = topics.filter((t) => t.completed).length;
  const minutes = topics.reduce((n, t) => n + t.durationMin, 0);
  const next = data ? nextTopic(data) : undefined;
  const faculty = b?.faculty.length ? b.faculty : [...new Set(c.batches.flatMap((x) => x.faculty))];
  const duration = (b?.duration || c.duration || fmtDuration(minutes)).replace(/\s*\(.*\)$/, "");

  const saveKey = `${c.id}:${b?.id ?? ""}`;
  const saved = savedBatchKeys.includes(saveKey);
  const [shareNote, setShareNote] = useState("");
  const share = async () => {
    const r = await shareText(b?.name ?? c.name, `${c.name} — CLATians · clatians.com/courses`);
    if (r === "copied") { setShareNote("Link copied"); setTimeout(() => setShareNote(""), 1500); }
  };
  const showSwitch = tab === "overview" && !!b && infoTabs.length > 1;
  const openSubject = (subject: string) => onNav({ view: "subject", courseId: c.id, batchId: b?.id ?? null, subject });

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%", paddingBottom: 24 }}>
      {/* Hero */}
      <div style={{ position: "relative", height: 180, background: gradient, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -30, top: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ position: "absolute", left: -20, bottom: -40, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <AppIcon name={courseIconName(c)} size={next ? 120 : 66} color={next ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.9)"} strokeWidth={1.3} />
        <button onClick={onBack} aria-label="Back" style={{ ...heroBtn, position: "absolute", left: 12, top: 12 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div style={{ position: "absolute", right: 12, top: 12, display: "flex", gap: 8 }}>
          {onToggleSaveBatch && b && (
            <button onClick={() => onToggleSaveBatch(saveKey, b.name, c.name)} aria-label={saved ? "Remove from saved" : "Save batch"} style={heroBtn}>
              <AppIcon name="heart" size={18} color="white" fill={saved ? "white" : "none"} />
            </button>
          )}
          <button onClick={share} aria-label="Share batch" style={heroBtn}>
            <AppIcon name="share" size={17} color="white" />
          </button>
        </div>
        {shareNote && <span style={{ position: "absolute", right: 14, top: 56, fontSize: 11, fontWeight: 700, color: "white", background: "rgba(0,0,0,0.35)", padding: "3px 8px", borderRadius: 8 }}>{shareNote}</span>}
        {next && (
          <button onClick={() => onOpenTopic(next.id)} aria-label="Continue learning" style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 62, height: 62, borderRadius: "50%", border: "none", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 22px rgba(0,0,0,0.3)" }}>
            <AppIcon name="play" size={24} color="var(--blue)" fill="var(--blue)" style={{ marginLeft: 3 }} />
          </button>
        )}
      </div>

      <div style={{ background: "white", padding: "14px 16px 0" }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "var(--ink-primary)", lineHeight: 1.25 }}>{b?.name ?? c.name}</h1>
        <p style={{ margin: "5px 0 0", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{b ? c.name : c.tagline || c.description}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", margin: "10px 0 0", fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>
          {topics.length > 0 && <Meta icon="file">{topics.length} Lessons</Meta>}
          {duration && <Meta icon="clock">{duration}</Meta>}
          <Meta icon="award">Certificate</Meta>
        </div>
        {topics.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--text-muted)", marginBottom: 4 }}>
              <span>{done} / {topics.length} completed</span><span style={{ fontWeight: 700 }}>{pctOf(done, topics.length)}%</span>
            </div>
            <Bar pct={pctOf(done, topics.length)} />
          </div>
        )}
        <div style={{ margin: "8px -16px 0" }}>
          <Tabs<HomeTab>
            tabs={[{ key: "overview", label: "Overview" }, { key: "subjects", label: "Subjects" }, { key: "instructors", label: "Instructors" }]}
            active={tab}
            onChange={setTab}
          />
        </div>
      </div>

      {showSwitch && <BatchInfoSwitch tabs={infoTabs} active={infoTab} onChange={setInfoTab} />}

      <div style={{ padding: showSwitch ? "2px 16px 0" : "14px 16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {error && <p style={{ margin: 0, fontSize: 13, color: "var(--error-text)" }}>{error}</p>}

        {tab === "overview" && (
          <>
            {next && (
              <button onClick={() => onOpenTopic(next.id)} style={{ ...card, border: "none", cursor: "pointer", textAlign: "left", padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <AppIcon name="play" size={14} color="white" fill="white" style={{ marginLeft: 2 }} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{done > 0 ? "Continue learning" : "Start here"}</span>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: "var(--ink-primary)", marginTop: 2 }}>{next.title}</span>
                </span>
                <Chevron />
              </button>
            )}
            {b ? <BatchInfoPanel key={`${b.id}-${infoTab}`} b={b} tab={infoTab} /> : (
              <>
                {(c.overview || c.description) && (
                  <div style={{ ...card, padding: 16 }}>
                    <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 800, color: "var(--ink-primary)" }}>About this course</p>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>{c.overview || c.description}</p>
                  </div>
                )}
                {c.features.length > 0 && (
                  <div style={{ ...card, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--ink-primary)" }}>What you get</p>
                    {c.features.map((f, i) => <Check key={i}>{f}</Check>)}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {tab === "subjects" && (
          <>
            <p style={{ margin: "2px 2px 0", fontSize: 15, fontWeight: 800, color: "var(--ink-primary)" }}>Subjects</p>
            {!data ? <Loading /> : subjects.length === 0 ? (
              <Empty icon="library" title="Subjects coming soon" text="Faculty will add this batch's chapters shortly." />
            ) : (
              <div style={{ ...card, overflow: "hidden" }}>
                {subjects.map((s, i) => {
                  const st = s.chapters.flatMap((ch) => ch.topics);
                  const sd = st.filter((t) => t.completed).length;
                  return (
                    <button key={s.name} onClick={() => openSubject(s.name)} style={{ width: "100%", background: "none", border: "none", borderTop: i ? "1px solid var(--line)" : "none", cursor: "pointer", textAlign: "left", padding: "13px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: "var(--ink-primary)" }}>{s.name}</span>
                        <span style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>{s.chapters.length} {s.chapters.length === 1 ? "Chapter" : "Chapters"} · {st.length} {st.length === 1 ? "Topic" : "Topics"}</span>
                        <span style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{sd} / {st.length} completed</span>
                      </span>
                      <Pill {...subjectState(sd, st.length)} />
                      <Chevron />
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "instructors" && (
          faculty.length === 0 ? (
            <Empty icon="user" title="Faculty to be announced" text="Instructors are listed here once a batch is assigned." />
          ) : faculty.map((f) => (
            <div key={f} style={{ ...card, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 42, height: 42, borderRadius: "50%", background: gradient, color: "white", fontSize: 14, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {f.replace(/[^A-Za-z ]/g, "").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("")}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-primary)" }}>{f}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── 4 · Subject — mockup screen 4: Chapters / Announcements / Students ──

type SubjectTab = "chapters" | "announcements" | "students";

function SubjectView({ course: c, batch: b, subject, onBack, onNav }: LearningFlowProps & { course: CatalogItem; batch: CatalogBatch | null; subject: string }) {
  const [tab, setTab] = useState<SubjectTab>("chapters");
  const { data, error } = useSyllabus(c.id);
  const [extras, setExtras] = useState<BatchExtras | null>(null);
  const group = data ? bySubject(data).find((s) => s.name === subject) : undefined;
  const topics = group ? group.chapters.flatMap((ch) => ch.topics) : [];
  const done = topics.filter((t) => t.completed).length;
  const minutes = topics.reduce((n, t) => n + t.durationMin, 0);

  useEffect(() => {
    if (!b) return;
    let live = true;
    getBatchExtrasAction(b.id).then((res) => { if (live && res.ok) setExtras(res.extras); });
    return () => { live = false; };
  }, [b]);

  const meta = [
    { icon: "layers" as IconName, text: b?.name ?? c.name },
    group && { icon: "file" as IconName, text: `${group.chapters.length} ${group.chapters.length === 1 ? "Chapter" : "Chapters"} · ${topics.length} ${topics.length === 1 ? "Topic" : "Topics"}` },
    fmtDuration(minutes) && { icon: "clock" as IconName, text: `${fmtDuration(minutes)} of lessons` },
  ].filter(Boolean) as { icon: IconName; text: string }[];

  const tabs: { key: SubjectTab; label: string }[] = [
    { key: "chapters", label: "Chapters" },
    ...(b ? [{ key: "announcements" as const, label: "Announcements" }, { key: "students" as const, label: "Students" }] : []),
  ];

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%", paddingBottom: 24 }}>
      <div style={{ background: "white" }}>
        <Header title={subject} onBack={onBack} right={<Pill {...subjectState(done, topics.length)} />} />
        <div style={{ padding: "4px 16px 8px 48px", display: "flex", flexDirection: "column", gap: 6 }}>
          {meta.map((m) => (
            <p key={m.text} style={{ margin: 0, fontSize: 12.5, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 7 }}>
              <AppIcon name={m.icon} size={14} color="var(--blue)" />{m.text}
            </p>
          ))}
        </div>
        {tabs.length > 1 ? <Tabs<SubjectTab> tabs={tabs} active={tab} onChange={setTab} /> : <div style={{ height: 6 }} />}
      </div>

      <div style={{ padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {error && <p style={{ margin: 0, fontSize: 13, color: "var(--error-text)" }}>{error}</p>}

        {tab === "chapters" && (
          !data ? <Loading /> : !group || group.chapters.length === 0 ? (
            <Empty icon="library" title="Chapters coming soon" text="Faculty will add this subject's chapters shortly." />
          ) : group.chapters.map((ch, i) => (
            <ChapterRow key={ch.id} ch={ch} n={i + 1} onOpen={() => onNav({ view: "chapter", courseId: c.id, chapterId: ch.id, from: subject })} />
          ))
        )}

        {tab === "announcements" && (
          !extras ? <Loading /> : extras.announcements.length === 0 ? (
            <Empty icon="megaphone" title="No announcements yet" text="Updates from your faculty will appear here." />
          ) : extras.announcements.map((a) => (
            <div key={a.id} style={{ ...card, padding: "13px 14px" }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--ink-primary)" }}>{a.title}</p>
              {a.body && <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{a.body}</p>}
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--text-disabled)" }}>{fmtIST(a.createdAt, { day: "numeric", month: "short", year: "numeric" })}</p>
            </div>
          ))
        )}

        {tab === "students" && b && (
          !extras ? <Loading /> : (
            <div style={{ ...card, padding: 16 }}>
              <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "var(--ink-primary)" }}>{extras.studentCount}</p>
              <p style={{ margin: "0 0 10px", fontSize: 12.5, color: "var(--text-muted)" }}>{extras.studentCount === 1 ? "student" : "students"} in this batch{b.seats > 0 && b.seats < 500 ? ` · ${b.seats} seats` : ""}</p>
              {extras.classmates.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {extras.classmates.map((n, i) => (
                    <span key={i} style={{ background: "var(--blue-tint)", color: "var(--blue-dark)", fontSize: 12, fontWeight: 700, padding: "5px 11px", borderRadius: 20 }}>{n}</span>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-disabled)" }}>Your classmates appear here as they join.</p>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ── 5 · Chapter details — its topics ──

function ChapterView({ course: c, chapterId, onBack, onOpenTopic }: LearningFlowProps & { course: CatalogItem; chapterId: string }) {
  const { data, error } = useSyllabus(c.id);
  const [hint, setHint] = useState("");
  const ch = data?.chapters.find((x) => x.id === chapterId);

  if (!ch) {
    return (
      <div style={{ background: "var(--app-bg)", minHeight: "100%" }}>
        <Header title="Chapter" onBack={onBack} />
        {data || error ? <div style={{ padding: 16 }}><Empty icon="library" title="Chapter not found" text={error || "This chapter was removed from the course."} /></div> : <Loading />}
      </div>
    );
  }

  const done = ch.topics.filter((t) => t.completed).length;
  const minutes = ch.topics.reduce((n, t) => n + t.durationMin, 0);
  const current = ch.topics.find((t) => !t.completed && !t.locked);

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%", paddingBottom: 24 }}>
      <div style={{ background: "white", paddingBottom: 14 }}>
        <Header title="" onBack={onBack} />
        <div style={{ padding: "0 16px" }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>Chapter {localChapterNumber(data!, ch)}{ch.subject ? ` · ${ch.subject}` : ""}</p>
          <h1 style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 900, color: "var(--ink-primary)", lineHeight: 1.25 }}>{ch.title}</h1>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
            <AppIcon name="file" size={13} color="var(--text-muted)" />{ch.topics.length} Topics
            {fmtDuration(minutes) && <><span style={{ margin: "0 3px" }}>·</span><AppIcon name="clock" size={13} color="var(--text-muted)" />{fmtDuration(minutes)}</>}
          </p>
          <p style={{ margin: "8px 0 5px", fontSize: 12, color: "var(--text-muted)" }}>{done} / {ch.topics.length} completed</p>
          <Bar pct={pctOf(done, ch.topics.length)} />
        </div>
      </div>

      <div style={{ padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 8 }}>
        {hint && <p style={{ margin: 0, fontSize: 12.5, color: "var(--warning-text)", background: "var(--warning)", borderRadius: 10, padding: "9px 12px" }}>{hint}</p>}
        {ch.topics.length === 0 && <Empty icon="file" title="Topics coming soon" text="Faculty will add this chapter's topics shortly." />}
        {ch.topics.map((t, i) => {
          const isCurrent = current?.id === t.id;
          return (
            <button
              key={t.id}
              onClick={() => t.locked
                ? setHint(data?.enrolled ? "Finish the previous topic to unlock this one." : "Enrol in a batch to unlock this topic.")
                : onOpenTopic(t.id)}
              style={{
                ...card, width: "100%", textAlign: "left", cursor: "pointer", padding: "11px 12px", display: "flex", alignItems: "center", gap: 12,
                border: isCurrent ? "1.5px solid var(--blue)" : "1.5px solid transparent",
                background: isCurrent ? "var(--blue-tint)" : "white",
              }}
            >
              <Num n={i + 1} active={isCurrent} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: t.locked ? "var(--text-muted)" : "var(--ink-primary)" }}>{t.title}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "var(--text-disabled)", marginTop: 2 }}>
                  <AppIcon name={t.durationMin > 0 || t.hasVideo ? "clock" : "file"} size={12} color="var(--text-disabled)" />
                  {[
                    t.durationMin > 0 ? `${t.durationMin} min` : t.hasVideo && "Video",
                    t.hasNotes && "Notes",
                    t.hasTest && "Test",
                    t.isFree && !data?.enrolled && "Free preview",
                  ].filter(Boolean).join(" · ") || "Topic"}
                </span>
              </span>
              <TopicState topic={t} current={isCurrent} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Done (green tick), next up (filled play), locked (padlock), open (outlined play). */
export function TopicState({ topic, current }: { topic: LearningTopic; current: boolean }) {
  if (topic.completed) {
    return (
      <span style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
      </span>
    );
  }
  if (topic.locked) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--text-disabled)" style={{ flexShrink: 0 }}><path d="M7 10V7a5 5 0 0 1 10 0v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1zm2 0h6V7a3 3 0 0 0-6 0v3z" /></svg>
    );
  }
  return (
    <span style={{ width: 26, height: 26, borderRadius: "50%", background: current ? "var(--blue)" : "white", border: current ? "none" : "1.5px solid var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill={current ? "white" : "var(--blue)"}><path d="M7 4v16l13-8z" /></svg>
    </span>
  );
}
