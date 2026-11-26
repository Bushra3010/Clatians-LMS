"use client";

import { useEffect, useState } from "react";
import type { CatalogItem, CatalogBatch } from "../CoursesScreen";
import type { CourseSyllabus, LearningChapter, LearningTopic } from "../../lib/learning";
import { getCourseSyllabusAction, getBatchExtrasAction, getCourseTestsAction, getBatchMocksAction, type BatchExtras, type ChapterTest, type MockTest } from "../../lib/learning-actions";
import { fmtIST } from "../../lib/dates";
import { Check } from "../BatchInfo";
import { WebsiteBatchHero, WebsiteBatchBody } from "../WebsiteBatch";
import { AppIcon, courseIconName, subjectIconName, type IconName } from "../AppIcon";
import * as kit from "../ui/kit";
import { FREE_CATEGORIES, type FreeCategory } from "../detail/FreeResourcesPage";
import { shareText } from "../../lib/share";
import type { SlotBooking } from "../detail/SlotsPage";

/** Topics finished per enrolled course — loaded with the page for the My Learning list. */
export type LearningProgress = { courseId: string; lessons: number; done: number; minutes: number };

/** Where the student is in My Learning. Lives in StudentApp so it survives opening a topic. */
export type LearningNav =
  /** The list remembers its tab, so Back from a batch returns to Enrolled; tapping My Learning opens Free Resources. */
  | { view: "list"; tab?: "enrolled" | "resources" }
  /** The batch remembers its tab, so Back from a test returns to Tests. */
  | { view: "batch"; courseId: string; batchId: string | null; tab?: HomeTab }
  | { view: "subject"; courseId: string; batchId: string | null; subject: string }
  | { view: "chapter"; courseId: string; chapterId: string; from: string };

const gradient = kit.gradient;
const card: React.CSSProperties = kit.card;

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

function Header({ title, onBack, right, subtitle }: { title: string; onBack: () => void; right?: React.ReactNode; subtitle?: string }) {
  return <kit.ScreenHeader title={title} subtitle={subtitle} onBack={onBack} right={right} />;
}

function Pill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 8, background: bg, color }}>{label}</span>;
}

/** Pill tab switcher, shared with the rest of the app. */
function Tabs<T extends string>({ tabs, active, onChange }: { tabs: { key: T; label: string }[]; active: T; onChange: (t: T) => void }) {
  return <div style={{ padding: "0 16px" }}><kit.Segmented tabs={tabs} active={active} onChange={onChange} /></div>;
}

function Bar({ pct, height = 6, onDark }: { pct: number; height?: number; onDark?: boolean }) {
  return <kit.Progress pct={pct} height={height} onDark={onDark} />;
}

function Num({ n, active }: { n: number; active?: boolean }) {
  return (
    <span style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, background: active ? "var(--blue-tint)" : "var(--surface-dim)", color: active ? "var(--blue)" : "var(--ink-primary)", border: active ? "1.5px solid var(--blue)" : "none" }}>{n}</span>
  );
}

function Empty({ icon, title, text, action }: { icon: IconName; title: string; text: string; action?: React.ReactNode }) {
  return <kit.EmptyState icon={icon} title={title} text={text} action={action} />;
}

function Loading() {
  return <p style={{ margin: "24px 0", textAlign: "center", fontSize: 13, color: "var(--text-disabled)" }}>Loading…</p>;
}

const primaryBtn: React.CSSProperties = { ...kit.primaryBtn, borderRadius: 12, padding: "10px 16px", fontSize: 13 };

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

/** The course's chapter tests, grouped by chapter id. Loads once `active` turns true. */
function useCourseTests(courseId: string, active = true) {
  const [tests, setTests] = useState<Map<string, ChapterTest[]> | null>(null);
  useEffect(() => {
    if (!active) return;
    let live = true;
    getCourseTestsAction(courseId).then((res) => {
      if (!live) return;
      const map = new Map<string, ChapterTest[]>();
      if (res.ok) for (const t of res.tests) map.set(t.chapterId, [...(map.get(t.chapterId) ?? []), t]);
      setTests(map);
    });
    return () => { live = false; };
  }, [courseId, active]);
  return tests;
}

/** The batch's full mock tests. Loads once `active` turns true. */
function useBatchMocks(courseId: string, active = true) {
  const [mocks, setMocks] = useState<MockTest[] | null>(null);
  useEffect(() => {
    if (!active) return;
    let live = true;
    getBatchMocksAction(courseId).then((res) => { if (live) setMocks(res.ok ? res.tests : []); });
    return () => { live = false; };
  }, [courseId, active]);
  return mocks;
}

const SECTION_SHORT: Record<string, string> = {
  "English": "English", "GK & Current Affairs": "GK", "Current Affairs & GK": "GK",
  "Legal Reasoning": "Legal", "Logical Reasoning": "Logical", "Quantitative": "Quant", "Quantitative Techniques": "Quant",
};

/** Full mock tests as Test 1, Test 2…, each mixing every section. They open in order: a test unlocks once the one before it is attempted. */
function MockTestList({ tests, onStartTest }: { tests: MockTest[]; onStartTest?: LearningFlowProps["onStartTest"] }) {
  const [starting, setStarting] = useState<string | null>(null);
  const [startError, setStartError] = useState("");
  const tried = tests.filter((t) => t.attempts > 0).length;

  const start = async (testId: string) => {
    if (!onStartTest || starting) return;
    setStarting(testId);
    setStartError("");
    const res = await onStartTest(testId);
    setStarting(null);
    if (!res.ok) setStartError(res.error || "Couldn't start this test. Try again.");
  };

  return (
    <>
      <div style={{ ...card, padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 40, height: 40, borderRadius: 12, background: gradient, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <AppIcon name="clipboard" size={19} color="white" />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: "var(--ink-primary)" }}>Full Mock Tests</span>
          <span style={{ display: "block", fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>All sections mixed, like the real CLAT paper</span>
        </span>
        <span style={{ textAlign: "right", flexShrink: 0 }}>
          <span style={{ display: "block", fontSize: 16, fontWeight: 900, color: "var(--ink-primary)", lineHeight: 1 }}>{tried}/{tests.length}</span>
          <span style={{ display: "block", fontSize: 10.5, color: "var(--text-muted)", marginTop: 3 }}>attempted</span>
        </span>
      </div>
      {startError && <p style={{ margin: 0, fontSize: 13, color: "var(--error-text)" }}>{startError}</p>}

      {tests.map((t, i) => {
        const done = t.attempts > 0;
        const locked = i > 0 && tests[i - 1].attempts === 0;
        return (
          <div key={t.testId} style={{ ...card, padding: "13px 14px", opacity: locked ? 0.75 : 1 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: done ? "var(--success)" : locked ? "var(--surface-dim)" : "var(--blue-tint)", color: done ? "var(--success-text)" : locked ? "var(--text-disabled)" : "var(--blue)" }}>
                {locked ? <AppIcon name="lock" size={18} color="var(--text-disabled)" /> : <>
                  <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: "0.06em" }}>TEST</span>
                  <span style={{ fontSize: 17, fontWeight: 900, lineHeight: 1 }}>{i + 1}</span>
                </>}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--ink-primary)", lineHeight: 1.3 }}>{t.title}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><AppIcon name="file" size={12} />{t.questions} Questions</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><AppIcon name="clock" size={12} />{t.durationMin > 0 ? `${t.durationMin} min` : "Untimed"}</span>
                </span>
              </span>
            </div>
            {t.subjects.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, margin: "10px 0 0 56px" }}>
                {t.subjects.map((sub) => (
                  <span key={sub} style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: "var(--surface-dim)", color: "var(--text-secondary)" }}>{SECTION_SHORT[sub] ?? sub}</span>
                ))}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, margin: "11px 0 0 56px" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: done ? "var(--success-text)" : "var(--text-disabled)" }}>
                {locked ? `Attempt Test ${i} to unlock` : done && t.bestScore != null ? `Best ${t.bestScore}${t.bestTotal != null ? ` / ${t.bestTotal}` : ""} · ${t.attempts} ${t.attempts === 1 ? "attempt" : "attempts"}` : "Not attempted yet"}
              </span>
              {locked ? (
                <span style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, borderRadius: 10, padding: "8px 14px", fontSize: 12.5, fontWeight: 800, background: "var(--surface-dim)", color: "var(--text-disabled)" }}>
                  <AppIcon name="lock" size={13} color="var(--text-disabled)" />Locked
                </span>
              ) : <button onClick={() => start(t.testId)} disabled={!!starting} style={{
                flexShrink: 0, cursor: starting ? "default" : "pointer", borderRadius: 10, padding: "8px 16px", fontSize: 12.5, fontWeight: 800,
                border: done ? "1.5px solid var(--blue)" : "none", background: done ? "white" : gradient, color: done ? "var(--blue)" : "white",
                opacity: starting && starting !== t.testId ? 0.5 : 1,
              }}>{starting === t.testId ? "Starting…" : done ? "Retake" : "Start test"}</button>}
            </div>
          </div>
        );
      })}
    </>
  );
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
  /** Opens Free Resources on one format — videos, notes, practice, CA or live. */
  onOpenFree?: (category: FreeCategory) => void;
  /** Change the current screen in place (no Back step) — used for the list's tabs. */
  onReplaceNav?: (next: LearningNav) => void;
  onOpenNotifications?: () => void;
  unreadCount?: number;
  /** Saved batches, as "courseId:batchId" keys (the heart on a batch). */
  savedBatchKeys?: string[];
  onToggleSaveBatch?: (key: string, title: string, subtitle: string) => void;
  /** Starts a topic test; resolves with an error message when it can't start. */
  onStartTest?: (testId: string) => Promise<{ ok: boolean; error?: string }>;
  /** Mentorship: book a 1-on-1 slot, ask a doubt, open the planner, review mocks. */
  onBookSession?: () => void;
  onAskDoubt?: () => void;
  onOpenPlanner?: () => void;
  onOpenMocks?: () => void;
  /** The student's booked 1-on-1 sessions, soonest first. */
  mentorBookings?: SlotBooking[];
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
  // Mock tests and mentorship aren't syllabus courses — each gets its own home.
  if (course.category === "mock") return <MockSeriesHome key={batch?.id ?? course.id} {...props} course={course} batch={batch} />;
  if (course.category === "mentorship") return <MentorshipHome key={batch?.id ?? course.id} {...props} course={course} batch={batch} />;
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

// ── 2 · My Learning — the batches they bought ──

type ListTab = "enrolled" | "resources";
/** My Learning opens on Free Resources unless the student was last on Enrolled. */
const DEFAULT_LIST_TAB: ListTab = "resources";

function MyLearningList({ catalog, progress, nav, onNav, onReplaceNav, onBrowseCourses, onOpenLibrary, onOpenFree, onOpenNotifications, unreadCount = 0 }: LearningFlowProps) {
  const [localTab, setLocalTab] = useState<ListTab>(DEFAULT_LIST_TAB);
  const tab: ListTab = onReplaceNav ? (nav.view === "list" ? nav.tab ?? DEFAULT_LIST_TAB : DEFAULT_LIST_TAB) : localTab;
  const setTab = (t: ListTab) => (onReplaceNav ? onReplaceNav({ view: "list", tab: t }) : setLocalTab(t));
  const prog = (id: string) => progress.find((p) => p.courseId === id) ?? { courseId: id, lessons: 0, done: 0, minutes: 0 };
  const owned = ownedItems(catalog);

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%", paddingBottom: 28 }}>
      <kit.PageTitle
        kicker="Your study space"
        title="My Learning"
        right={onOpenNotifications ? <kit.RoundBtn icon="bell" label="Notifications" onClick={onOpenNotifications} dot={unreadCount > 0} /> : undefined}
      />
      <div style={{ padding: "12px 0 0" }}>
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
                action={<button onClick={onBrowseCourses} className="press" style={primaryBtn}>Browse courses</button>} />
            )}

            {owned.map(({ key, course: c, batch: b }) => {
              const p = prog(c.id);
              const pct = pctOf(p.done, p.lessons);
              const label = p.lessons > 0 && pct >= 100 ? "Review" : p.done > 0 ? "Continue" : "Start";
              const open = () => onNav({ view: "batch", courseId: c.id, batchId: b?.id ?? null });
              const meta = [p.lessons > 0 && `${p.lessons} Lessons`, (b?.duration || c.duration || fmtDuration(p.minutes)).replace(/\s*\(.*\)$/, "")].filter(Boolean).join(" · ");
              return (
                <div key={key} onClick={open} className="press" style={{ ...card, padding: 12, cursor: "pointer" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ position: "relative", width: 60, height: 60, borderRadius: 18, flexShrink: 0, overflow: "hidden", background: kit.heroBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ position: "absolute", right: -20, top: -20, width: 56, height: 56, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,166,35,0.45), transparent 70%)" }} />
                      <AppIcon name={courseIconName(c)} size={26} color="white" strokeWidth={1.7} style={{ position: "relative" }} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 14.5, fontWeight: 800, color: "var(--ink)", lineHeight: 1.3 }}>{b?.name ?? c.name}</span>
                      <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-soft)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{[b && c.name, meta].filter(Boolean).join(" · ")}</span>
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--ink-soft)", marginBottom: 5 }}>
                        <span>{p.done}/{p.lessons || 0} done</span><span style={{ fontWeight: 800, color: "var(--blue)" }}>{pct}%</span>
                      </span>
                      <Bar pct={pct} />
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); open(); }} className="press" style={label === "Review"
                      ? { ...kit.smallBtn, borderRadius: 12, padding: "9px 14px" }
                      : { ...primaryBtn, padding: "9px 14px", fontSize: 12.5, flexShrink: 0 }}>
                      {label}<AppIcon name={label === "Review" ? "refresh" : "play"} size={13} fill={label === "Review" ? "none" : "currentColor"} />
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <>
            {/* Free for everyone — Home's blue card, then one tile per resource */}
            <kit.HeroCard>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#CFFB6B", color: "var(--blue-dark)", fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 8 }}>
                <AppIcon name="gift" size={12} />Free for every student
              </span>
              <p style={{ margin: "12px 0 4px", fontSize: 22, fontWeight: 700, lineHeight: 1.25 }}>Start learning <span style={{ color: "var(--gold)" }}>for free</span></p>
              <p style={{ margin: "0 0 16px", fontSize: 13.5, color: "rgba(255,255,255,0.72)", lineHeight: 1.5 }}>Videos, notes, practice and daily current affairs. No batch needed.</p>
              <button onClick={onOpenLibrary} className="press" style={{ ...kit.goldBtn, width: "100%", color: "var(--blue-dark)" }}>
                Open library <AppIcon name="arrowRight" size={16} />
              </button>
            </kit.HeroCard>

            {/* The five formats. Each opens on its own subject list, so a student
                goes format → subject → free material in that section. */}
            <kit.SectionTitle kicker="Pick a format" title="Explore resources" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
              {FREE_CATEGORIES.map((r, i) => (
                <button
                  key={r.key}
                  onClick={() => (onOpenFree ? onOpenFree(r.key) : onOpenLibrary())}
                  className="press"
                  style={{
                    ...card, cursor: "pointer", textAlign: "left", padding: 14,
                    display: "flex", flexDirection: "column", gap: 10, minWidth: 0,
                    // Five tiles in a two-wide grid: the last one runs full width.
                    gridColumn: i === FREE_CATEGORIES.length - 1 && FREE_CATEGORIES.length % 2 === 1 ? "1 / -1" : undefined,
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <kit.IconTile icon={r.icon} tone={r.tone} size={40} />
                    <AppIcon name="arrowRight" size={15} color="var(--text-disabled)" />
                  </span>
                  <span>
                    <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--ink)", lineHeight: 1.25 }}>{r.label}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-soft)", marginTop: 3, lineHeight: 1.35 }}>{r.sub}</span>
                    <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--blue)", marginTop: 5 }}>5 subjects</span>
                  </span>
                </button>
              ))}
            </div>

            {/* Next step for a free user */}
            <button onClick={onBrowseCourses} className="press" style={{ ...card, cursor: "pointer", textAlign: "left", padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
              <kit.IconTile icon="graduation" tone="gold" size={42} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>Want live classes & mentorship?</span>
                <span style={{ display: "block", fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>Explore CLATians batches</span>
              </span>
              <Chevron color="var(--blue)" />
            </button>
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
    <button onClick={onOpen} className="press" style={{ ...card, width: "100%", cursor: "pointer", textAlign: "left", padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
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

type HomeTab = "overview" | "subjects" | "instructors" | "tests";

// ── Mock Test Series — a test dashboard, not a course ──

/** The CLAT UG paper every full mock follows. */
const CLAT_PATTERN: { label: string; value: string }[] = [
  { label: "Questions", value: "120" },
  { label: "Duration", value: "120 min" },
  { label: "Marking", value: "+1 / −0.25" },
];
const CLAT_SECTIONS = ["English", "GK", "Legal", "Logical", "Quant"];

function MockSeriesHome({ course: c, batch: b, onBack, onStartTest }: LearningFlowProps & { course: CatalogItem; batch: CatalogBatch | null }) {
  const mocks = useBatchMocks(c.id);
  const list = mocks ?? [];
  const attempted = list.filter((t) => t.attempts > 0);
  const pcts = attempted
    .filter((t) => t.bestScore != null && t.bestTotal)
    .map((t) => Math.round(((t.bestScore as number) / (t.bestTotal as number)) * 100));
  const best = pcts.length ? Math.max(...pcts) : null;
  const avg = pcts.length ? Math.round(pcts.reduce((a, n) => a + n, 0) / pcts.length) : null;
  // "CLAT Mock Test Series — 20 Mocks" → 20; falls back to what is published.
  const packSize = Number(/(\d+)\s*(full\s*)?mocks?/i.exec(b?.name ?? "")?.[1] ?? 0) || list.length;
  const next = list.find((t, i) => t.attempts === 0 && (i === 0 || list[i - 1].attempts > 0));

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%", paddingBottom: 28 }}>
      <Header title={b?.name ?? c.name} subtitle="Mock Test Series" onBack={onBack} />

      <div style={{ padding: "8px 16px 0", display: "flex", flexDirection: "column", gap: 14 }}>
        <kit.HeroCard>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.26)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 20, fontWeight: 900, lineHeight: 1, color: "var(--gold)" }}>{packSize || "—"}</span>
              <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: "0.08em", marginTop: 2 }}>MOCKS</span>
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 18, fontWeight: 700, lineHeight: 1.25 }}>{b?.batchType || "Mock Test Series"}</span>
              <span style={{ display: "block", fontSize: 12.5, color: "rgba(255,255,255,0.72)", marginTop: 2 }}>Full-length CLAT papers · exam-day conditions</span>
            </span>
          </div>
          <div style={{ ...kit.heroStrip, display: "flex", padding: "10px 4px", marginTop: 14 }}>
            {[
              { v: `${attempted.length}/${packSize || list.length}`, l: "Attempted" },
              { v: best != null ? `${best}%` : "—", l: "Best score" },
              { v: avg != null ? `${avg}%` : "—", l: "Average" },
            ].map((s, i) => (
              <div key={s.l} style={{ flex: "1 1 0", textAlign: "center", borderLeft: i ? "1px solid rgba(255,255,255,0.16)" : "none" }}>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "var(--gold)" }}>{s.v}</p>
                <p style={{ margin: "2px 0 0", fontSize: 10.5, color: "rgba(255,255,255,0.7)" }}>{s.l}</p>
              </div>
            ))}
          </div>
          {next && onStartTest && (
            <button onClick={() => onStartTest(next.testId)} className="press" style={{ ...kit.goldBtn, width: "100%", marginTop: 14, color: "var(--blue-dark)" }}>
              <AppIcon name="play" size={13} color="var(--blue-dark)" fill="var(--blue-dark)" />
              {attempted.length ? "Take your next mock" : "Take your first mock"}
            </button>
          )}
        </kit.HeroCard>

        {/* Exam pattern — what every mock simulates */}
        <div style={{ ...card, padding: 14 }}>
          <p style={{ margin: "0 0 10px", fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>Every mock follows the CLAT pattern</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
            {CLAT_PATTERN.map((x) => (
              <div key={x.label} style={{ background: "var(--app-bg)", border: "1px solid var(--line)", borderRadius: 12, padding: "9px 8px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>{x.value}</p>
                <p style={{ margin: "2px 0 0", fontSize: 10.5, color: "var(--ink-soft)" }}>{x.label}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {CLAT_SECTIONS.map((s) => (
              <span key={s} style={{ fontSize: 11, fontWeight: 700, padding: "4px 9px", borderRadius: 20, background: "var(--blue-tint)", color: "var(--blue)" }}>{s}</span>
            ))}
          </div>
        </div>

        <kit.SectionTitle kicker="Attempt in order" title="Your mock tests" />
        {mocks === null ? <Loading /> : list.length === 0 ? (
          <Empty icon="clipboard" title="Mocks are on their way" text="Your series' tests appear here as they are released — you'll get a notification for each one." />
        ) : (
          <MockTestList tests={list} onStartTest={onStartTest} />
        )}

        {/* How to get the most out of a mock */}
        <div style={{ ...card, padding: 14 }}>
          <p style={{ margin: "0 0 8px", fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>How to use your mocks</p>
          {[
            "Sit each mock in one 2-hour block, phone away — like exam day.",
            "Review every wrong and skipped question before the next mock.",
            "Track your weakest section and give it extra practice that week.",
          ].map((t) => <Check key={t}>{t}</Check>)}
        </div>

        {b && b.chips.length > 0 && (
          <div style={{ ...card, padding: 14 }}>
            <p style={{ margin: "0 0 8px", fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>Included in your pack</p>
            {b.chips.map((t) => <Check key={t}>{t}</Check>)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Mentorship — a mentor and your sessions, not a syllabus ──

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "M";

function MentorshipHome({ course: c, batch: b, onBack, onBookSession, onAskDoubt, onOpenPlanner, onOpenMocks, mentorBookings = [] }: LearningFlowProps & { course: CatalogItem; batch: CatalogBatch | null }) {
  const mentor = b?.faculty[0] || c.batches.flatMap((x) => x.faculty)[0] || "Your CLATians mentor";
  const next = mentorBookings[0];
  const sessionsInc = c.includes.find((x) => /session/i.test(x.label))?.value;
  const duration = (b?.duration || c.duration || "").replace(/\s*\(.*\)$/, "");
  // Website data sometimes carries blank rows — drop them.
  const journey = c.curriculum.filter((m) => m.module?.trim());
  const features = (b?.highlights.length ? b.highlights : c.features).filter((f) => f?.trim());

  const actions: { icon: IconName; label: string; sub: string; onClick?: () => void }[] = [
    { icon: "calendar", label: "Book a session", sub: "Pick a 1-on-1 slot", onClick: onBookSession },
    { icon: "chat", label: "Ask your mentor", sub: "Send a doubt anytime", onClick: onAskDoubt },
    { icon: "list", label: "Study plan", sub: "Your weekly targets", onClick: onOpenPlanner },
    { icon: "chart", label: "Mock review", sub: "Go over your tests", onClick: onOpenMocks },
  ];

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%", paddingBottom: 28 }}>
      <Header title={b?.name ?? c.name} subtitle="1-on-1 Mentorship" onBack={onBack} />

      <div style={{ padding: "8px 16px 0", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Mentor card */}
        <kit.HeroCard>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#CFFB6B", color: "var(--blue-dark)", fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 8 }}>
            <AppIcon name="target" size={12} />Your personal mentor
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
            <span style={{ width: 58, height: 58, borderRadius: "50%", background: "var(--gold)", color: "var(--blue-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, flexShrink: 0, border: "3px solid rgba(255,255,255,0.35)" }}>
              {initials(mentor)}
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 18, fontWeight: 700, lineHeight: 1.25 }}>{mentor}</span>
              <span style={{ display: "block", fontSize: 12.5, color: "rgba(255,255,255,0.72)", marginTop: 2 }}>NLU topper · {c.name}</span>
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
            {[
              { icon: "users" as IconName, text: "1-on-1" },
              { icon: "phone" as IconName, text: "WhatsApp + Video call" },
              duration && { icon: "clock" as IconName, text: duration },
              sessionsInc && { icon: "calendar" as IconName, text: `${sessionsInc} sessions` },
            ].filter(Boolean).map((m) => {
              const x = m as { icon: IconName; text: string };
              return (
                <span key={x.text} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: "white", background: "rgba(255,255,255,0.12)", padding: "4px 10px", borderRadius: 20 }}>
                  <AppIcon name={x.icon} size={12} color="var(--gold)" />{x.text}
                </span>
              );
            })}
          </div>
        </kit.HeroCard>

        {/* Next session */}
        <div style={{ ...card, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
          <kit.IconTile icon="calendar" tone={next ? "green" : "gold"} size={46} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Next session</span>
            {next ? <>
              <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: "var(--ink)", marginTop: 2 }}>
                {fmtIST(next.startAt, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true })}
              </span>
              <span style={{ display: "block", fontSize: 12, color: "var(--ink-soft)", marginTop: 1 }}>with {next.teacher}{next.topic ? ` · ${next.topic}` : ""}</span>
            </> : (
              <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--ink)", marginTop: 2 }}>No session booked yet</span>
            )}
          </span>
          {onBookSession && (
            <button onClick={onBookSession} className="press" style={{ ...primaryBtn, flexShrink: 0 }}>{next ? "Reschedule" : "Book"}</button>
          )}
        </div>

        {/* What you do with your mentor */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          {actions.map((a) => (
            <button key={a.label} onClick={a.onClick} disabled={!a.onClick} className="press" style={{ ...card, padding: 13, textAlign: "left", cursor: a.onClick ? "pointer" : "default", display: "flex", flexDirection: "column", gap: 8 }}>
              <kit.IconTile icon={a.icon} size={38} />
              <span>
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>{a.label}</span>
                <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-soft)", marginTop: 2 }}>{a.sub}</span>
              </span>
            </button>
          ))}
        </div>

        {/* The mentorship journey */}
        {journey.length > 0 && (
          <>
            <kit.SectionTitle kicker="Step by step" title="Your mentorship journey" />
            <div style={{ ...card, padding: "14px 14px 4px" }}>
              {journey.map((m, i) => (
                <div key={m.module} style={{ display: "flex", gap: 12 }}>
                  <span style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--blue-tint)", color: "var(--blue)", fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                    {i < journey.length - 1 && <span style={{ flex: 1, width: 2, background: "var(--line)", margin: "4px 0" }} />}
                  </span>
                  <span style={{ flex: 1, minWidth: 0, paddingBottom: 14 }}>
                    <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--ink)", lineHeight: 1.35, marginTop: 3 }}>{m.module}</span>
                    {m.topics.length > 0 && <span style={{ display: "block", fontSize: 12, color: "var(--ink-soft)", marginTop: 3, lineHeight: 1.5 }}>{m.topics.join(" · ")}</span>}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {features.length > 0 && (
          <div style={{ ...card, padding: 14 }}>
            <p style={{ margin: "0 0 8px", fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>What your mentorship includes</p>
            {features.map((t) => <Check key={t}>{t}</Check>)}
          </div>
        )}
      </div>
    </div>
  );
}

function BatchHome({ course: c, batch: b, nav, onBack, onNav, onReplaceNav, onOpenTopic, onStartTest, savedBatchKeys = [], onToggleSaveBatch }: LearningFlowProps & { course: CatalogItem; batch: CatalogBatch | null }) {
  const [tab, setTabState] = useState<HomeTab>(nav.view === "batch" && nav.tab ? nav.tab : "subjects");
  const setTab = (t: HomeTab) => {
    setTabState(t);
    if (nav.view === "batch") onReplaceNav?.({ ...nav, tab: t });
  };
  const { data, error } = useSyllabus(c.id);
  const mocks = useBatchMocks(c.id, tab === "tests");
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
  const openSubject = (subject: string) => onNav({ view: "subject", courseId: c.id, batchId: b?.id ?? null, subject });

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%", paddingBottom: 28 }}>
      <Header
        title={b?.name ?? c.name}
        subtitle="My Learning"
        onBack={onBack}
        right={
          <span style={{ display: "flex", gap: 8, position: "relative" }}>
            {onToggleSaveBatch && b && (
              <button onClick={() => onToggleSaveBatch(saveKey, b.name, c.name)} aria-label={saved ? "Remove from saved" : "Save batch"} className="press" style={{ width: 38, height: 38, borderRadius: "50%", border: "1px solid var(--line)", background: "white", boxShadow: "var(--shadow-md)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AppIcon name="heart" size={18} color={saved ? "#E03131" : "var(--ink)"} fill={saved ? "#E03131" : "none"} />
              </button>
            )}
            <kit.RoundBtn icon="share" label="Share batch" onClick={share} />
            {shareNote && <span style={{ position: "absolute", right: 0, top: 44, fontSize: 11, fontWeight: 700, color: "white", background: "var(--ink)", padding: "3px 8px", borderRadius: 8, whiteSpace: "nowrap", zIndex: 2 }}>{shareNote}</span>}
          </span>
        }
      />

      {/* Hero — Home's blue card: batch, progress and the continue button */}
      <div style={{ padding: "8px 16px 0" }}>
        <kit.HeroCard>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.26)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <AppIcon name={courseIconName(c)} size={26} color="white" strokeWidth={1.7} />
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 19, fontWeight: 700, lineHeight: 1.25 }}>{b?.name ?? c.name}</span>
              <span style={{ display: "block", fontSize: 12.5, color: "rgba(255,255,255,0.72)", marginTop: 2 }}>{b ? c.name : c.tagline || c.description}</span>
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
            {[
              topics.length > 0 && { icon: "file" as IconName, text: `${topics.length} Lessons` },
              duration && { icon: "clock" as IconName, text: duration },
              { icon: "award" as IconName, text: "Certificate" },
            ].filter(Boolean).map((m) => {
              const x = m as { icon: IconName; text: string };
              return (
                <span key={x.text} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: "white", background: "rgba(255,255,255,0.12)", padding: "4px 10px", borderRadius: 20 }}>
                  <AppIcon name={x.icon} size={12} color="var(--gold)" />{x.text}
                </span>
              );
            })}
          </div>
          {topics.length > 0 && (
            <div style={{ ...kit.heroStrip, padding: "10px 12px", marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 6 }}>
                <span>{done} / {topics.length} completed</span><span style={{ fontWeight: 800, color: "var(--gold)" }}>{pctOf(done, topics.length)}%</span>
              </div>
              <Bar pct={pctOf(done, topics.length)} onDark />
            </div>
          )}
          {next && (
            <button onClick={() => onOpenTopic(next.id)} className="press" style={{ ...kit.goldBtn, width: "100%", marginTop: 14, color: "var(--blue-dark)", justifyContent: "flex-start", textAlign: "left" }}>
              <span style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--blue-dark)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <AppIcon name="play" size={12} color="white" fill="white" style={{ marginLeft: 2 }} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 10.5, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", opacity: 0.75 }}>{done > 0 ? "Continue learning" : "Start here"}</span>
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{next.title}</span>
              </span>
              <AppIcon name="arrowRight" size={16} />
            </button>
          )}
        </kit.HeroCard>
      </div>

      <div style={{ padding: "14px 0 0" }}>
        <Tabs<HomeTab>
          tabs={[{ key: "subjects", label: "Subjects" }, { key: "overview", label: "Overview" }, { key: "tests", label: "Mock Test" }, { key: "instructors", label: "Faculty" }]}
          active={tab}
          onChange={setTab}
        />
      </div>

      <div style={{ padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {error && <p style={{ margin: 0, fontSize: 13, color: "var(--error-text)" }}>{error}</p>}

        {tab === "overview" && (
          <>
            {b ? (
              // The batch page from clatians.com, without the buying bits.
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <WebsiteBatchHero b={b} courseName={c.name} enrolled embedded hideTitle />
                <WebsiteBatchBody b={b} enrolled hidePlans hideCta />
              </div>
            ) : (
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
            <kit.SectionTitle kicker="Pick up where you left off" title="Subjects" />
            {!data ? <Loading /> : subjects.length === 0 ? (
              <Empty icon="library" title="Subjects coming soon" text="Faculty will add this batch's chapters shortly." />
            ) : (
              <div style={{ ...card, overflow: "hidden" }}>
                {subjects.map((s, i) => {
                  const st = s.chapters.flatMap((ch) => ch.topics);
                  const sd = st.filter((t) => t.completed).length;
                  return (
                    <button key={s.name} onClick={() => openSubject(s.name)} className="press" style={{ width: "100%", background: "none", border: "none", borderTop: i ? "1px solid var(--line)" : "none", cursor: "pointer", textAlign: "left", padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                      <kit.IconTile icon={subjectIconName(s.name)} size={42} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>{s.name}</span>
                          <Pill {...subjectState(sd, st.length)} />
                        </span>
                        <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-soft)", margin: "3px 0 6px" }}>{s.chapters.length} {s.chapters.length === 1 ? "Chapter" : "Chapters"} · {st.length} {st.length === 1 ? "Topic" : "Topics"} · {sd}/{st.length} done</span>
                        <Bar pct={pctOf(sd, st.length)} height={5} />
                      </span>
                      <Chevron />
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "tests" && (!mocks ? <Loading /> : mocks.length === 0 ? (
          <Empty icon="clipboard" title="Mock tests coming soon" text="Full mock tests for this batch will appear here." />
        ) : <MockTestList tests={mocks} onStartTest={onStartTest} />)}

        {tab === "instructors" && (
          faculty.length === 0 ? (
            <Empty icon="user" title="Faculty to be announced" text="Instructors are listed here once a batch is assigned." />
          ) : faculty.map((f) => (
            <div key={f} style={{ ...card, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 44, height: 44, borderRadius: 14, background: gradient, color: "white", fontSize: 14, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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

/** Each chapter's tests (Test 1, Test 2…), every one covering all of the chapter's topics. */
function ChapterTests({ chapters, tests, onStartTest, enrolled, firstNumber = 1 }: {
  chapters: LearningChapter[];
  tests: Map<string, ChapterTest[]>;
  onStartTest?: LearningFlowProps["onStartTest"];
  /** Chapter tests are for students in the batch. */
  enrolled: boolean;
  /** Number shown on the first chapter (a chapter screen shows only its own). */
  firstNumber?: number;
}) {
  const [starting, setStarting] = useState<string | null>(null);
  const [startError, setStartError] = useState("");

  const start = async (testId: string) => {
    if (!onStartTest || starting) return;
    setStarting(testId);
    setStartError("");
    const res = await onStartTest(testId);
    setStarting(null);
    if (!res.ok) setStartError(res.error || "Couldn't start this test. Try again.");
  };

  return (
    <>
      {startError && <p style={{ margin: 0, fontSize: 13, color: "var(--error-text)" }}>{startError}</p>}
      {chapters.map((ch, idx) => {
        const n = firstNumber + idx;
        const list = tests.get(ch.id) ?? [];
        const tried = list.filter((t) => t.attempts > 0).length;
        return (
          <div key={ch.id} style={{ ...card, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderBottom: list.length ? "1px solid var(--line)" : "none" }}>
              <Num n={n} active={tried > 0} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Chapter {n}</span>
                <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: "var(--ink-primary)", marginTop: 1, lineHeight: 1.3 }}>{ch.title}</span>
              </span>
              {list.length > 0 && <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)", flexShrink: 0 }}>{tried}/{list.length} done</span>}
            </div>
            {list.length === 0 ? (
              <p style={{ margin: 0, padding: "0 14px 12px 58px", fontSize: 12, color: "var(--text-disabled)" }}>Chapter test coming soon</p>
            ) : list.map((test, j) => {
              const done = test.attempts > 0;
              // Within a chapter, Test 2 opens after Test 1 is attempted, and so on.
              const inOrder = j > 0 && list[j - 1].attempts === 0;
              return (
                <div key={test.testId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderTop: j ? "1px solid var(--line)" : "none" }}>
                  <span style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: done ? "var(--success)" : inOrder ? "var(--surface-dim)" : "var(--blue-tint)", color: done ? "var(--success-text)" : inOrder ? "var(--text-disabled)" : "var(--blue)" }}>
                    <AppIcon name={inOrder ? "lock" : done ? "check" : "clipboard"} size={16} strokeWidth={done ? 3 : 2} color={done ? "var(--success-text)" : inOrder ? "var(--text-disabled)" : "var(--blue)"} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: inOrder ? "var(--text-muted)" : "var(--ink-primary)" }}>Test {j + 1}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
                      {test.questions} Questions · All {ch.topics.length} topics · {test.durationMin > 0 ? `${test.durationMin} min` : "Untimed"}
                    </span>
                    {inOrder && <span style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-disabled)", marginTop: 2 }}>Attempt Test {j} to unlock</span>}
                    {done && test.bestScore != null && (
                      <span style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--success-text)", marginTop: 2 }}>
                        Best {test.bestScore}{test.bestTotal != null ? ` / ${test.bestTotal}` : ""} · {test.attempts} {test.attempts === 1 ? "attempt" : "attempts"}
                      </span>
                    )}
                  </span>
                  {!enrolled || inOrder ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700, color: "var(--text-disabled)" }}><AppIcon name="lock" size={14} color="var(--text-disabled)" />Locked</span>
                  ) : (
                    <button onClick={() => start(test.testId)} disabled={!!starting} style={{
                      flexShrink: 0, cursor: starting ? "default" : "pointer", borderRadius: 10, padding: "8px 14px", fontSize: 12.5, fontWeight: 800,
                      border: done ? "1.5px solid var(--blue)" : "none", background: done ? "white" : gradient, color: done ? "var(--blue)" : "white",
                      opacity: starting && starting !== test.testId ? 0.5 : 1,
                    }}>{starting === test.testId ? "Starting…" : done ? "Retake" : "Start"}</button>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
}

// ── 4 · Subject — mockup screen 4: Chapters / Tests / Announcements ──

type SubjectTab = "chapters" | "tests" | "announcements";

function SubjectView({ course: c, batch: b, subject, onBack, onNav, onStartTest }: LearningFlowProps & { course: CatalogItem; batch: CatalogBatch | null; subject: string }) {
  const [tab, setTab] = useState<SubjectTab>("chapters");
  const { data, error } = useSyllabus(c.id);
  const [extras, setExtras] = useState<BatchExtras | null>(null);
  const tests = useCourseTests(c.id, tab === "tests");
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
    { key: "tests", label: "Tests" },
    ...(b ? [{ key: "announcements" as const, label: "Announcements" }] : []),
  ];

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%", paddingBottom: 24 }}>
      <Header title={subject} subtitle={b?.name ?? c.name} onBack={onBack} />
      <div style={{ padding: "8px 16px 0" }}>
        <kit.HeroCard padding={16}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 46, height: 46, borderRadius: 14, background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.26)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <AppIcon name={subjectIconName(subject)} size={22} color="white" />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 18, fontWeight: 700, lineHeight: 1.25 }}>{subject}</span>
              <span style={{ display: "flex", flexWrap: "wrap", gap: "2px 10px", fontSize: 11.5, color: "rgba(255,255,255,0.72)", marginTop: 3 }}>
                {meta.slice(1).map((m) => <span key={m.text} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><AppIcon name={m.icon} size={12} color="var(--gold)" />{m.text}</span>)}
              </span>
            </span>
          </div>
          {topics.length > 0 && (
            <div style={{ ...kit.heroStrip, padding: "10px 12px", marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 6 }}>
                <span>{done} / {topics.length} completed</span><span style={{ fontWeight: 800, color: "var(--gold)" }}>{pctOf(done, topics.length)}%</span>
              </div>
              <Bar pct={pctOf(done, topics.length)} onDark />
            </div>
          )}
        </kit.HeroCard>
      </div>
      {tabs.length > 1 && <div style={{ padding: "14px 0 0" }}><Tabs<SubjectTab> tabs={tabs} active={tab} onChange={setTab} /></div>}

      <div style={{ padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {error && <p style={{ margin: 0, fontSize: 13, color: "var(--error-text)" }}>{error}</p>}

        {tab === "chapters" && (
          !data ? <Loading /> : !group || group.chapters.length === 0 ? (
            <Empty icon="library" title="Chapters coming soon" text="Faculty will add this subject's chapters shortly." />
          ) : group.chapters.map((ch, i) => (
            <ChapterRow key={ch.id} ch={ch} n={i + 1} onOpen={() => onNav({ view: "chapter", courseId: c.id, chapterId: ch.id, from: subject })} />
          ))
        )}

        {tab === "tests" && (
          !data || !tests ? <Loading /> : !group || group.chapters.length === 0 ? (
            <Empty icon="clipboard" title="Tests coming soon" text="Faculty will add this subject's tests shortly." />
          ) : <ChapterTests chapters={group.chapters} tests={tests} onStartTest={onStartTest} enrolled={data.enrolled} />
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

// ── 5 · Chapter details — its topics ──

function ChapterView({ course: c, chapterId, onBack, onOpenTopic, onStartTest }: LearningFlowProps & { course: CatalogItem; chapterId: string }) {
  const { data, error } = useSyllabus(c.id);
  const [hint, setHint] = useState("");
  const tests = useCourseTests(c.id);
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
      <Header title={`Chapter ${localChapterNumber(data!, ch)}`} subtitle={ch.subject || c.name} onBack={onBack} />
      <div style={{ padding: "8px 16px 0" }}>
        <kit.HeroCard padding={16}>
          <span style={{ display: "inline-block", background: "#CFFB6B", color: "var(--blue-dark)", fontSize: 11, fontWeight: 700, padding: "4px 9px", borderRadius: 8 }}>Chapter {localChapterNumber(data!, ch)}{ch.subject ? ` · ${ch.subject}` : ""}</span>
          <h1 style={{ margin: "10px 0 0", fontSize: 20, fontWeight: 700, lineHeight: 1.25 }}>{ch.title}</h1>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "rgba(255,255,255,0.72)", display: "flex", alignItems: "center", gap: 5 }}>
            <AppIcon name="file" size={13} color="var(--gold)" />{ch.topics.length} Topics
            {fmtDuration(minutes) && <><span style={{ margin: "0 3px" }}>·</span><AppIcon name="clock" size={13} color="var(--gold)" />{fmtDuration(minutes)}</>}
          </p>
          <div style={{ ...kit.heroStrip, padding: "10px 12px", marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 6 }}>
              <span>{done} / {ch.topics.length} completed</span><span style={{ fontWeight: 800, color: "var(--gold)" }}>{pctOf(done, ch.topics.length)}%</span>
            </div>
            <Bar pct={pctOf(done, ch.topics.length)} onDark />
          </div>
        </kit.HeroCard>
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
                border: isCurrent ? "1.5px solid var(--blue)" : "1px solid var(--line)",
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

        {/* This chapter's tests */}
        <div style={{ marginTop: 8 }}><kit.SectionTitle kicker="Check what you learnt" title="Chapter tests" /></div>
        {tests ? <ChapterTests chapters={[ch]} tests={tests} onStartTest={onStartTest} enrolled={!!data?.enrolled} firstNumber={localChapterNumber(data!, ch)} /> : <Loading />}
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
