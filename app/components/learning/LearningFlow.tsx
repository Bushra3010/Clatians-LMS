"use client";

import { useEffect, useState } from "react";
import type { CatalogItem, CatalogBatch } from "../CoursesScreen";
import type { CourseSyllabus, LearningChapter, LearningTopic } from "../../lib/learning";
import { getCourseSyllabusAction, getBatchExtrasAction, type BatchExtras } from "../../lib/learning-actions";
import { fmtIST } from "../../lib/dates";
import { BatchInfoPanel, BatchInfoSwitch, batchInfoTabs, type BatchInfoTab } from "../BatchInfo";
import { AppIcon, courseIconName, subjectIconName, type IconName } from "../AppIcon";

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
  if (nav.view === "chapter") return <ChapterView key={nav.chapterId} {...props} course={course} chapterId={nav.chapterId} />;
  // The batch may not be in the catalog yet right after a purchase — fall back to the course.
  const batch = nav.batchId ? course.batches.find((b) => b.id === nav.batchId) ?? null : null;
  if (nav.view === "subject") return <SubjectView key={nav.subject} {...props} course={course} batch={batch} subject={nav.subject} />;
  return <BatchView key={batch?.id ?? course.id} {...props} course={course} batch={batch} />;
}

/** What a student has bought: each purchased batch, or the course itself when it was bought without one. */
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


// ── 1 · My Learning — the batches they bought ──

type ListTab = "enrolled" | "not-started" | "completed";

function MyLearningList({ catalog, progress, onNav, onBrowseCourses, onOpenLibrary }: LearningFlowProps) {
  const [tab, setTab] = useState<ListTab>("enrolled");
  const prog = (id: string) => progress.find((p) => p.courseId === id) ?? { courseId: id, lessons: 0, done: 0, minutes: 0 };
  const owned = ownedItems(catalog);
  const notStarted = owned.filter((o) => prog(o.course.id).done === 0);
  const completed = owned.filter((o) => { const p = prog(o.course.id); return p.lessons > 0 && p.done >= p.lessons; });
  const shown = tab === "enrolled" ? owned : tab === "not-started" ? notStarted : completed;

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%", paddingBottom: 24 }}>
      <div style={{ background: "white", paddingTop: 14 }}>
        <h2 style={{ margin: "0 16px 2px", fontSize: 21, fontWeight: 900, color: "var(--ink-primary)" }}>My Learning</h2>
        <p style={{ margin: "0 16px 6px", fontSize: 12.5, color: "var(--text-muted)" }}>Batch · Subject · Chapter · Topic</p>
        <Tabs<ListTab>
          tabs={[
            { key: "enrolled", label: `My Batches (${owned.length})` },
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
            <Empty icon="graduation" title="No batch yet" text="Buy a batch and it will show up here with your progress."
              action={<button onClick={onBrowseCourses} style={{ ...primaryBtn, marginTop: 14 }}>Browse courses</button>} />
          ) : (
            <Empty icon={tab === "completed" ? "flag" : "check"} title={tab === "completed" ? "Nothing completed yet" : "You've started everything"}
              text={tab === "completed" ? "Finish every topic of a batch to see it here." : "Every batch you're in has some progress."} />
          )
        )}

        {shown.map(({ key, course: c, batch: b }) => {
          const p = prog(c.id);
          const pct = pctOf(p.done, p.lessons);
          const label = p.lessons > 0 && pct >= 100 ? "Review" : p.done > 0 ? "Continue" : "Start Learning";
          const open = () => onNav({ view: "batch", courseId: c.id, batchId: b?.id ?? null });
          return (
            <div key={key} style={{ ...card, padding: 12, display: "flex", gap: 12 }}>
              <button onClick={open} aria-label={b?.name ?? c.name} style={{ width: 84, height: 84, borderRadius: 14, flexShrink: 0, border: "none", cursor: "pointer", background: gradient, display: "flex", alignItems: "center", justifyContent: "center" }}><AppIcon name={courseIconName(c)} size={36} color="white" strokeWidth={1.7} /></button>
              <div style={{ flex: 1, minWidth: 0 }}>
                {b?.batchType && <span style={{ display: "inline-block", marginBottom: 3, fontSize: 10, fontWeight: 800, color: "var(--blue)", background: "var(--blue-tint)", padding: "2px 8px", borderRadius: 6 }}>{b.batchType}</span>}
                <button onClick={open} style={{ display: "block", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", fontSize: 14.5, fontWeight: 800, color: "var(--ink-primary)", lineHeight: 1.3 }}>{b?.name ?? c.name}</button>
                {b && <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "var(--text-muted)" }}>{c.name}</p>}
                <div style={{ display: "flex", justifyContent: "space-between", margin: "6px 0 5px", fontSize: 11.5, color: "var(--text-muted)" }}>
                  <span>{pct}% Completed</span>
                  <span style={{ fontWeight: 700 }}>{p.lessons > 0 ? `${p.done}/${p.lessons} topics` : ""}</span>
                </div>
                <Bar pct={pct} />
                <button onClick={open} style={{
                  ...primaryBtn, width: "100%", padding: "9px", fontSize: 13, marginTop: 10,
                  ...(label === "Review" ? { background: "var(--blue-tint)", color: "var(--blue)", boxShadow: "none" } : {}),
                }}>{label}</button>
              </div>
            </div>
          );
        })}

        {owned.length > 0 && (
          <button onClick={onOpenLibrary} style={{ ...card, border: "none", cursor: "pointer", padding: "13px 14px", display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
            <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--blue-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AppIcon name="library" size={20} color="var(--blue)" /></span>
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

function ChapterRow({ ch, n, onOpen }: { ch: LearningChapter; n: number; onOpen: () => void }) {
  const done = ch.topics.filter((t) => t.completed).length;
  return (
    <button onClick={onOpen} style={{ ...card, border: "none", width: "100%", cursor: "pointer", textAlign: "left", padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
      <Num n={n} active={done > 0 && done < ch.topics.length} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: "var(--ink-primary)" }}>{ch.title}</span>
        <span style={{ display: "block", fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
          {ch.topics.length} {ch.topics.length === 1 ? "Topic" : "Topics"}
          {done > 0 && <span style={{ color: "var(--success-text)", fontWeight: 700 }}> · {done}/{ch.topics.length} done</span>}
        </span>
      </span>
      {done > 0 && done === ch.topics.length ? <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AppIcon name="check" size={13} strokeWidth={3} color="white" /></span> : <Chevron />}
    </button>
  );
}

// ── 2 · Batch — its subjects ──

type BatchTab = "subjects" | "info" | "announcements";

function BatchView({ course: c, batch: b, onBack, onNav, onOpenTopic }: LearningFlowProps & { course: CatalogItem; batch: CatalogBatch | null }) {
  const [tab, setTab] = useState<BatchTab>("subjects");
  const [infoTab, setInfoTab] = useState<BatchInfoTab>("overview");
  const infoTabs = b ? batchInfoTabs(b, true) : [];
  const { data, error } = useSyllabus(c.id);
  const [extras, setExtras] = useState<BatchExtras | null>(null);
  const subjects = data ? bySubject(data) : [];
  const topics = data ? allTopics(data) : [];
  const done = topics.filter((t) => t.completed).length;
  const next = data ? nextTopic(data) : undefined;

  useEffect(() => {
    if (!b) return;
    let live = true;
    getBatchExtrasAction(b.id).then((res) => { if (live && res.ok) setExtras(res.extras); });
    return () => { live = false; };
  }, [b]);

  const tabs: { key: BatchTab; label: string }[] = [
    { key: "subjects", label: "Subjects" },
    ...(b ? [{ key: "info" as const, label: "Batch Info" }, { key: "announcements" as const, label: "Announcements" }] : []),
  ];

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%", paddingBottom: 24 }}>
      <div style={{ background: "white" }}>
        <Header title={b?.name ?? c.name} onBack={onBack} right={b ? <Pill {...batchState(b)} /> : undefined} />
        <div style={{ padding: "2px 16px 12px" }}>
          <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
            <AppIcon name={courseIconName(c)} size={14} color="var(--text-muted)" />
            <span>{c.name}{b?.startDate ? ` · ${batchDateLine(b)}` : ""}</span>
          </p>
          {topics.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--text-muted)", marginBottom: 4 }}>
                <span>{done} / {topics.length} topics completed</span><span style={{ fontWeight: 700 }}>{pctOf(done, topics.length)}%</span>
              </div>
              <Bar pct={pctOf(done, topics.length)} />
            </div>
          )}
          {next && (
            <button onClick={() => onOpenTopic(next.id)} style={{ ...primaryBtn, width: "100%", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{done > 0 ? "Continue" : "Start"}: {next.title}</span>
            </button>
          )}
        </div>
        {tabs.length > 1 && <Tabs<BatchTab> tabs={tabs} active={tab} onChange={setTab} />}
      </div>

      {tab === "info" && b && (
        <>
          {infoTabs.length > 1 && <BatchInfoSwitch tabs={infoTabs} active={infoTab} onChange={setInfoTab} />}
          <div style={{ padding: infoTabs.length > 1 ? "2px 16px 0" : "14px 16px 0" }}>
            <BatchInfoPanel key={infoTab} b={b} tab={infoTab} />
          </div>
        </>
      )}

      <div style={{ padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {error && <p style={{ margin: 0, fontSize: 13, color: "var(--error-text)" }}>{error}</p>}

        {tab === "subjects" && (
          !data ? <Loading /> : subjects.length === 0 ? (
            <Empty icon="library" title="Subjects coming soon" text="Faculty will add this batch's chapters shortly." />
          ) : subjects.map((s) => {
            const st = s.chapters.flatMap((ch) => ch.topics);
            const sd = st.filter((t) => t.completed).length;
            const pct = pctOf(sd, st.length);
            return (
              <button key={s.name} onClick={() => onNav({ view: "subject", courseId: c.id, batchId: b?.id ?? null, subject: s.name })} style={{ ...card, border: "none", width: "100%", cursor: "pointer", textAlign: "left", padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 46, height: 46, borderRadius: 14, background: "var(--blue-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AppIcon name={subjectIconName(s.name)} size={22} color="var(--blue)" /></span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14.5, fontWeight: 800, color: "var(--ink-primary)" }}>{s.name}</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--text-muted)", margin: "2px 0 6px" }}>
                    {s.chapters.length} {s.chapters.length === 1 ? "Chapter" : "Chapters"} · {st.length} {st.length === 1 ? "Topic" : "Topics"}
                  </span>
                  <Bar pct={pct} height={4} />
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: pct > 0 ? "var(--success-text)" : "var(--text-disabled)", flexShrink: 0 }}>{pct}%</span>
                <Chevron />
              </button>
            );
          })
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
      </div>
    </div>
  );
}

// ── 3 · Subject — its chapters ──

function SubjectView({ course: c, batch: b, subject, onBack, onNav }: LearningFlowProps & { course: CatalogItem; batch: CatalogBatch | null; subject: string }) {
  const { data, error } = useSyllabus(c.id);
  const group = data ? bySubject(data).find((s) => s.name === subject) : undefined;
  const st = group ? group.chapters.flatMap((ch) => ch.topics) : [];
  const sd = st.filter((t) => t.completed).length;

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%", paddingBottom: 24 }}>
      <div style={{ background: "white", paddingBottom: 14 }}>
        <Header title="" onBack={onBack} />
        <div style={{ padding: "0 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 50, height: 50, borderRadius: 15, background: gradient, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AppIcon name={subjectIconName(subject)} size={24} color="white" /></span>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b?.name ?? c.name}</p>
            <h1 style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 900, color: "var(--ink-primary)", lineHeight: 1.25 }}>{subject}</h1>
          </div>
        </div>
        {group && (
          <div style={{ padding: "12px 16px 0" }}>
            <p style={{ margin: "0 0 5px", fontSize: 12, color: "var(--text-muted)" }}>{group.chapters.length} {group.chapters.length === 1 ? "Chapter" : "Chapters"} · {sd} / {st.length} topics completed</p>
            <Bar pct={pctOf(sd, st.length)} />
          </div>
        )}
      </div>

      <div style={{ padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {error && <p style={{ margin: 0, fontSize: 13, color: "var(--error-text)" }}>{error}</p>}
        {!data ? <Loading /> : !group ? (
          <Empty icon="library" title="Subject not found" text="This subject has no chapters right now." />
        ) : group.chapters.map((ch, i) => (
          <ChapterRow key={ch.id} ch={ch} n={i + 1} onOpen={() => onNav({ view: "chapter", courseId: c.id, chapterId: ch.id, from: subject })} />
        ))}
      </div>
    </div>
  );
}

// ── 4 · Chapter — its topics ──

function ChapterView({ course: c, chapterId, onBack, onOpenTopic }: LearningFlowProps & { course: CatalogItem; chapterId: string }) {
  const { data, error } = useSyllabus(c.id);
  const [hint, setHint] = useState("");
  const ch = data?.chapters.find((x) => x.id === chapterId);
  // Chapters are numbered within their subject.
  const number = ch && data ? data.chapters.filter((x) => (x.subject || "General") === (ch.subject || "General")).indexOf(ch) + 1 : 0;

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
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>{ch.subject || "General"} · Chapter {number}</p>
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
                <span style={{ display: "block", fontSize: 11.5, color: "var(--text-disabled)", marginTop: 2 }}>
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
