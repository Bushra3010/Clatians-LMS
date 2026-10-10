"use client";

import { useEffect, useState } from "react";
import type { CatalogItem, CatalogBatch } from "../CoursesScreen";
import type { CourseSyllabus, LearningChapter, LearningTopic } from "../../lib/learning";
import { getCourseSyllabusAction, getBatchExtrasAction, type BatchExtras } from "../../lib/learning-actions";
import { fmtIST } from "../../lib/dates";

/** Topics finished per enrolled course — loaded with the page for the My Learning list. */
export type LearningProgress = { courseId: string; lessons: number; done: number; minutes: number };

/** Where the student is in My Learning. Lives in StudentApp so it survives opening a topic. */
export type LearningNav =
  | { view: "list" }
  | { view: "course"; courseId: string }
  | { view: "batch"; courseId: string; batchId: string }
  | { view: "chapter"; courseId: string; chapterId: string; from: string };

const gradient = "linear-gradient(135deg,var(--blue-dark),var(--blue))";
const card: React.CSSProperties = { background: "white", borderRadius: 16, boxShadow: "0 2px 10px rgba(15,23,41,0.06)" };

export const fmtDuration = (min: number) => {
  if (min <= 0) return "";
  const h = Math.floor(min / 60), m = min % 60;
  return h > 0 ? `${h} hr${m ? ` ${m} min` : ""}` : `${m} min`;
};
const pctOf = (done: number, total: number) => (total > 0 ? Math.round((done / total) * 100) : 0);

/** Batch status as the student reads it: Active, Upcoming or Closed. */
function batchState(b: CatalogBatch): { label: "Active" | "Upcoming" | "Closed"; bg: string; color: string } {
  const s = b.status.toLowerCase();
  if (["archived", "closed", "completed", "ended"].includes(s)) return { label: "Closed", bg: "var(--surface-dim)", color: "var(--text-muted)" };
  if (["ongoing", "active", "live"].includes(s)) return { label: "Active", bg: "var(--success)", color: "var(--success-text)" };
  return { label: "Upcoming", bg: "var(--blue-tint)", color: "var(--blue)" };
}
const batchDateLine = (b: CatalogBatch) => {
  if (!b.startDate) return "";
  return `${batchState(b).label === "Upcoming" ? "Starts" : "Started"} on ${b.startDate}`;
};

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

function Empty({ icon, title, text, action }: { icon: string; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div style={{ ...card, textAlign: "center", padding: "28px 18px" }}>
      <div style={{ fontSize: 34, marginBottom: 6 }}>{icon}</div>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--ink-primary)" }}>{title}</p>
      <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--text-disabled)", lineHeight: 1.5 }}>{text}</p>
      {action}
    </div>
  );
}

function Loading() {
  return <p style={{ margin: "24px 0", textAlign: "center", fontSize: 13, color: "var(--text-disabled)" }}>Loading…</p>;
}

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
}

export default function LearningFlow(props: LearningFlowProps) {
  const { catalog, nav } = props;
  const course = nav.view === "list" ? undefined : catalog.find((c) => c.id === nav.courseId);
  if (nav.view === "list" || !course) return <MyLearningList {...props} />;
  if (nav.view === "course") return <CourseView key={course.id} {...props} course={course} />;
  if (nav.view === "batch") {
    const batch = course.batches.find((b) => b.id === nav.batchId);
    if (batch) return <BatchView key={batch.id} {...props} course={course} batch={batch} />;
    return <CourseView key={course.id} {...props} course={course} />;
  }
  return <ChapterView key={nav.chapterId} {...props} course={course} chapterId={nav.chapterId} backLabel={nav.from} />;
}

// ── 2 · My Learning ──

type ListTab = "enrolled" | "not-started" | "completed";

function MyLearningList({ catalog, progress, onNav, onBrowseCourses, onOpenLibrary }: LearningFlowProps) {
  const [tab, setTab] = useState<ListTab>("enrolled");
  const prog = (id: string) => progress.find((p) => p.courseId === id) ?? { courseId: id, lessons: 0, done: 0, minutes: 0 };
  const enrolled = catalog.filter((c) => c.enrolled);
  const notStarted = enrolled.filter((c) => prog(c.id).done === 0);
  const completed = enrolled.filter((c) => { const p = prog(c.id); return p.lessons > 0 && p.done >= p.lessons; });
  const shown = tab === "enrolled" ? enrolled : tab === "not-started" ? notStarted : completed;

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%", paddingBottom: 24 }}>
      <div style={{ background: "white", paddingTop: 14 }}>
        <h2 style={{ margin: "0 16px 2px", fontSize: 21, fontWeight: 900, color: "var(--ink-primary)" }}>My Learning</h2>
        <p style={{ margin: "0 16px 6px", fontSize: 12.5, color: "var(--text-muted)" }}>Course → batch → chapter → topic</p>
        <Tabs<ListTab>
          tabs={[
            { key: "enrolled", label: `Enrolled (${enrolled.length})` },
            { key: "not-started", label: "Not Started" },
            { key: "completed", label: "Completed" },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      <div style={{ padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {shown.length === 0 && (
          tab === "enrolled" ? (
            <Empty icon="🎓" title="No courses yet" text="Enrol in a course and it will show up here with your progress."
              action={<button onClick={onBrowseCourses} style={{ ...primaryBtn, marginTop: 14 }}>Browse courses →</button>} />
          ) : (
            <Empty icon={tab === "completed" ? "🏁" : "✅"} title={tab === "completed" ? "Nothing completed yet" : "You've started everything"}
              text={tab === "completed" ? "Finish every topic of a course to see it here." : "Every course you're enrolled in has some progress."} />
          )
        )}

        {shown.map((c) => {
          const p = prog(c.id);
          const pct = pctOf(p.done, p.lessons);
          const label = p.lessons > 0 && pct >= 100 ? "Review" : p.done > 0 ? "Continue" : "Start Learning";
          return (
            <div key={c.id} style={{ ...card, padding: 12, display: "flex", gap: 12 }}>
              <button onClick={() => onNav({ view: "course", courseId: c.id })} aria-label={c.name} style={{ width: 88, height: 88, borderRadius: 14, flexShrink: 0, border: "none", cursor: "pointer", background: gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38 }}>{c.icon}</button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <button onClick={() => onNav({ view: "course", courseId: c.id })} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", fontSize: 14.5, fontWeight: 800, color: "var(--ink-primary)", lineHeight: 1.3 }}>{c.name}</button>
                <div style={{ display: "flex", justifyContent: "space-between", margin: "4px 0 5px", fontSize: 11.5, color: "var(--text-muted)" }}>
                  <span>{pct}% Completed</span>
                  <span style={{ fontWeight: 700 }}>{pct}%</span>
                </div>
                <Bar pct={pct} />
                <p style={{ margin: "6px 0 8px", fontSize: 11, color: "var(--text-disabled)" }}>
                  {[p.lessons > 0 && `${p.lessons} Lessons`, fmtDuration(p.minutes) || c.duration].filter(Boolean).join(" • ")}
                </p>
                <button onClick={() => onNav({ view: "course", courseId: c.id })} style={{
                  ...primaryBtn, width: "100%", padding: "9px", fontSize: 13,
                  ...(label === "Start Learning" ? { background: "var(--error)", color: "var(--error-text)", boxShadow: "none" }
                    : label === "Review" ? { background: "var(--blue-tint)", color: "var(--blue)", boxShadow: "none" } : {}),
                }}>{label} →</button>
              </div>
            </div>
          );
        })}

        {enrolled.length > 0 && (
          <button onClick={onOpenLibrary} style={{ ...card, border: "none", cursor: "pointer", padding: "13px 14px", display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
            <span style={{ fontSize: 22 }}>📚</span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--ink-primary)" }}>Study library</span>
              <span style={{ display: "block", fontSize: 11.5, color: "var(--text-muted)", marginTop: 1 }}>All videos, notes, tests and current affairs</span>
            </span>
            <Chevron />
          </button>
        )}
      </div>
    </div>
  );
}

// ── 3 · Course details ──

type CourseTab = "overview" | "batches" | "syllabus" | "instructors";

function ChapterRow({ ch, onOpen }: { ch: LearningChapter; onOpen: () => void }) {
  const done = ch.topics.filter((t) => t.completed).length;
  return (
    <button onClick={onOpen} style={{ ...card, border: "none", width: "100%", cursor: "pointer", textAlign: "left", padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
      <Num n={ch.number} active={done > 0 && done < ch.topics.length} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: "var(--ink-primary)" }}>{ch.title}</span>
        <span style={{ display: "block", fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
          {ch.topics.length} {ch.topics.length === 1 ? "Topic" : "Topics"}{ch.subject ? ` · ${ch.subject}` : ""}
          {done > 0 && <span style={{ color: "var(--success-text)", fontWeight: 700 }}> · {done}/{ch.topics.length} done</span>}
        </span>
      </span>
      <Chevron />
    </button>
  );
}

function CourseView({ course: c, onBack, onNav, onOpenTopic }: LearningFlowProps & { course: CatalogItem }) {
  const [tab, setTab] = useState<CourseTab>("batches");
  const { data, error } = useSyllabus(c.id);
  const batches = c.batches.filter((b) => b.status !== "archived" || b.enrolled);
  const topics = data ? allTopics(data) : [];
  const done = topics.filter((t) => t.completed).length;
  const minutes = topics.reduce((n, t) => n + t.durationMin, 0);
  const next = data ? nextTopic(data) : undefined;
  const faculty = [...new Set(c.batches.flatMap((b) => b.faculty))];

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%", paddingBottom: 24 }}>
      {/* Hero */}
      <div style={{ position: "relative", height: 170, background: gradient, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -30, top: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ position: "absolute", left: -20, bottom: -40, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <span style={{ fontSize: 64 }}>{c.icon}</span>
        <button onClick={onBack} aria-label="Back" style={{ position: "absolute", left: 12, top: 12, width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.18)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        {next && (
          <button onClick={() => onOpenTopic(next.id)} aria-label="Continue learning" style={{ position: "absolute", width: 58, height: 58, borderRadius: "50%", border: "none", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 22px rgba(0,0,0,0.25)", right: 18, bottom: 18 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--blue)"><path d="M8 5v14l11-7z" /></svg>
          </button>
        )}
      </div>

      <div style={{ background: "white", padding: "14px 16px 0" }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "var(--ink-primary)", lineHeight: 1.25 }}>{c.name}</h1>
        {(c.tagline || c.description) && <p style={{ margin: "5px 0 0", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{c.tagline || c.description}</p>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", margin: "10px 0 0", fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>
          {topics.length > 0 && <span>📖 {topics.length} Lessons</span>}
          {(fmtDuration(minutes) || c.duration) && <span>⏱ {c.duration || fmtDuration(minutes)}</span>}
          <span>🏅 Certificate</span>
        </div>
        {data?.enrolled && topics.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--text-muted)", marginBottom: 4 }}>
              <span>{done} / {topics.length} completed</span><span style={{ fontWeight: 700 }}>{pctOf(done, topics.length)}%</span>
            </div>
            <Bar pct={pctOf(done, topics.length)} />
          </div>
        )}
        <div style={{ margin: "8px -16px 0" }}>
          <Tabs<CourseTab>
            tabs={[{ key: "overview", label: "Overview" }, { key: "batches", label: "Batches" }, { key: "syllabus", label: "Syllabus" }, { key: "instructors", label: "Instructors" }]}
            active={tab}
            onChange={setTab}
          />
        </div>
      </div>

      <div style={{ padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {error && <p style={{ margin: 0, fontSize: 13, color: "var(--error-text)" }}>{error}</p>}

        {tab === "overview" && (
          <>
            {next && (
              <button onClick={() => onOpenTopic(next.id)} style={{ ...card, border: "none", cursor: "pointer", textAlign: "left", padding: "14px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{done > 0 ? "Continue learning" : "Start here"}</span>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: "var(--ink-primary)", marginTop: 2 }}>{next.title}</span>
                </span>
                <Chevron />
              </button>
            )}
            {(c.overview || c.description) && (
              <div style={{ ...card, padding: 16 }}>
                <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 800, color: "var(--ink-primary)" }}>About this course</p>
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>{c.overview || c.description}</p>
              </div>
            )}
            {c.features.length > 0 && (
              <div style={{ ...card, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--ink-primary)" }}>What you get</p>
                {c.features.map((f, i) => (
                  <p key={i} style={{ margin: 0, fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5 }}><span style={{ color: "var(--green)" }}>✓</span> {f}</p>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "batches" && (
          <>
            <p style={{ margin: "2px 2px 0", fontSize: 15, fontWeight: 800, color: "var(--ink-primary)" }}>Available Batches</p>
            {batches.length === 0 ? (
              <Empty icon="🗓" title="No batch scheduled" text="You can still study every chapter of this course."
                action={<button onClick={() => setTab("syllabus")} style={{ ...primaryBtn, marginTop: 14 }}>View chapters →</button>} />
            ) : (
              <div style={{ ...card, overflow: "hidden" }}>
                {batches.map((b, i) => {
                  const st = batchState(b);
                  return (
                    <button key={b.id} onClick={() => onNav({ view: "batch", courseId: c.id, batchId: b.id })} style={{ width: "100%", background: "none", border: "none", borderTop: i ? "1px solid var(--line)" : "none", cursor: "pointer", textAlign: "left", padding: "13px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: "var(--ink-primary)" }}>{b.name}</span>
                        <span style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>{b.mode || "Live + Recorded"}</span>
                        {batchDateLine(b) && <span style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{batchDateLine(b)}</span>}
                        {b.enrolled && <span style={{ display: "inline-block", marginTop: 5, fontSize: 10, fontWeight: 800, color: "var(--success-text)", background: "var(--success)", padding: "2px 8px", borderRadius: 20 }}>✓ YOUR BATCH</span>}
                      </span>
                      <Pill {...st} />
                      <Chevron />
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "syllabus" && (
          !data ? <Loading /> : data.chapters.length === 0 ? (
            <Empty icon="📚" title="Syllabus coming soon" text="Chapters for this course haven't been added yet." />
          ) : data.chapters.map((ch) => (
            <ChapterRow key={ch.id} ch={ch} onOpen={() => onNav({ view: "chapter", courseId: c.id, chapterId: ch.id, from: c.name })} />
          ))
        )}

        {tab === "instructors" && (
          faculty.length === 0 ? (
            <Empty icon="👩‍🏫" title="Faculty to be announced" text="Instructors are listed here once a batch is assigned." />
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

// ── 4 · Batch details ──

type BatchTab = "chapters" | "announcements" | "students";

function BatchView({ course: c, batch: b, onBack, onNav }: LearningFlowProps & { course: CatalogItem; batch: CatalogBatch }) {
  const [tab, setTab] = useState<BatchTab>("chapters");
  const { data, error } = useSyllabus(c.id);
  const [extras, setExtras] = useState<BatchExtras | null>(null);
  const st = batchState(b);

  useEffect(() => {
    let live = true;
    getBatchExtrasAction(b.id).then((res) => { if (live && res.ok) setExtras(res.extras); });
    return () => { live = false; };
  }, [b.id]);

  const meta = [
    { icon: "🎥", text: b.mode || "Live + Recorded" },
    batchDateLine(b) && { icon: "📅", text: batchDateLine(b) },
    // End dates read either "Jul 2027" or "Till CLAT 2027".
    b.endDate && { icon: "🏁", text: /^till\b/i.test(b.endDate) ? `Runs ${b.endDate.replace(/^till/i, "till")}` : `Batch ends on ${b.endDate}` },
    b.schedule && { icon: "🕒", text: b.schedule },
  ].filter(Boolean) as { icon: string; text: string }[];

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%", paddingBottom: 24 }}>
      <div style={{ background: "white", paddingBottom: 0 }}>
        <Header title={b.name} onBack={onBack} right={<Pill {...st} />} />
        <div style={{ padding: "4px 16px 4px 48px", display: "flex", flexDirection: "column", gap: 5 }}>
          {meta.map((m) => <p key={m.text} style={{ margin: 0, fontSize: 12.5, color: "var(--text-muted)" }}>{m.icon} {m.text}</p>)}
        </div>
        <Tabs<BatchTab>
          tabs={[{ key: "chapters", label: "Chapters" }, { key: "announcements", label: "Announcements" }, { key: "students", label: "Students" }]}
          active={tab}
          onChange={setTab}
        />
      </div>

      <div style={{ padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {error && <p style={{ margin: 0, fontSize: 13, color: "var(--error-text)" }}>{error}</p>}

        {tab === "chapters" && (
          !data ? <Loading /> : data.chapters.length === 0 ? (
            <Empty icon="📚" title="Chapters coming soon" text="Faculty will add this batch's chapters shortly." />
          ) : data.chapters.map((ch) => (
            <ChapterRow key={ch.id} ch={ch} onOpen={() => onNav({ view: "chapter", courseId: c.id, chapterId: ch.id, from: b.name })} />
          ))
        )}

        {tab === "announcements" && (
          !extras ? <Loading /> : extras.announcements.length === 0 ? (
            <Empty icon="📣" title="No announcements yet" text="Updates from your faculty will appear here." />
          ) : extras.announcements.map((a) => (
            <div key={a.id} style={{ ...card, padding: "13px 14px" }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--ink-primary)" }}>{a.title}</p>
              {a.body && <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{a.body}</p>}
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--text-disabled)" }}>{fmtIST(a.createdAt, { day: "numeric", month: "short", year: "numeric" })}</p>
            </div>
          ))
        )}

        {tab === "students" && (
          !extras ? <Loading /> : (
            <div style={{ ...card, padding: 16 }}>
              <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "var(--ink-primary)" }}>{extras.studentCount}</p>
              <p style={{ margin: "0 0 10px", fontSize: 12.5, color: "var(--text-muted)" }}>{extras.studentCount === 1 ? "student" : "students"} in this batch{b.seats > 0 ? ` · ${b.seats} seats` : ""}</p>
              {extras.classmates.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {extras.classmates.map((n, i) => (
                    <span key={i} style={{ background: "var(--blue-tint)", color: "var(--blue-dark)", fontSize: 12, fontWeight: 700, padding: "5px 11px", borderRadius: 20 }}>{n}</span>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-disabled)" }}>Join this batch to see your classmates.</p>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ── 5 · Chapter details ──

function ChapterView({ course: c, chapterId, onBack, onOpenTopic }: LearningFlowProps & { course: CatalogItem; chapterId: string; backLabel: string }) {
  const { data, error } = useSyllabus(c.id);
  const [hint, setHint] = useState("");
  const ch = data?.chapters.find((x) => x.id === chapterId);

  if (!ch) {
    return (
      <div style={{ background: "var(--app-bg)", minHeight: "100%" }}>
        <Header title="Chapter" onBack={onBack} />
        {data || error ? <div style={{ padding: 16 }}><Empty icon="📚" title="Chapter not found" text={error || "This chapter was removed from the course."} /></div> : <Loading />}
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
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>Chapter {ch.number}{ch.subject ? ` · ${ch.subject}` : ""}</p>
          <h1 style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 900, color: "var(--ink-primary)", lineHeight: 1.25 }}>{ch.title}</h1>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
            📄 {ch.topics.length} Topics{fmtDuration(minutes) ? `  •  ⏱ ${fmtDuration(minutes)}` : ""}
          </p>
          <p style={{ margin: "8px 0 5px", fontSize: 12, color: "var(--text-muted)" }}>{done} / {ch.topics.length} completed</p>
          <Bar pct={pctOf(done, ch.topics.length)} />
        </div>
      </div>

      <div style={{ padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 8 }}>
        {hint && <p style={{ margin: 0, fontSize: 12.5, color: "var(--warning-text)", background: "var(--warning)", borderRadius: 10, padding: "9px 12px" }}>{hint}</p>}
        {ch.topics.length === 0 && <Empty icon="📝" title="Topics coming soon" text="Faculty will add this chapter's topics shortly." />}
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
                <span style={{ display: "block", fontSize: 11.5, color: "var(--text-disabled)", marginTop: 2 }}>
                  {[
                    t.durationMin > 0 ? `⏱ ${t.durationMin} min` : t.hasVideo && "Video",
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

/** ✓ done, ▶ next up, 🔒 locked, ▷ open. */
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
