"use client";

import { useMemo, useState } from "react";
import type { ContentItem } from "./ContentListPage";
import ContentListPage from "./ContentListPage";
import type { TestListItem } from "./TestPages";
import type { LiveClassItem } from "./LiveClassesPage";
import LiveClassesPage from "./LiveClassesPage";
import PracticePage from "./PracticePage";
import CurrentAffairsPage from "./CurrentAffairsPage";
import type { StartResult } from "../../lib/test-actions";
import { AppIcon, subjectIconName, type IconName } from "../AppIcon";
import { resolveSubject, subjectOrder } from "../../lib/subjects";
import * as kit from "../ui/kit";

/**
 * Free Resources — three screens deep for study material:
 *
 *   formats  →  subjects  →  that subject's free material, topic-wise
 *
 * Live Classes skips the subject step: tapping it lists the ongoing and
 * upcoming free classes straight away.
 *
 * The formats are the five things a student can do for free (watch, read,
 * practise, follow the news, sit in a live class). Inside each one the five
 * CLAT sections repeat, so "free videos in Legal Reasoning" and "free notes in
 * Legal Reasoning" are reached the same way. Nothing here is behind a batch:
 * every list is built from material with no course attached to it.
 */

export type FreeCategory = "video" | "notes" | "practice" | "current-affairs" | "live" | "tests";

type CategoryDef = {
  key: FreeCategory;
  label: string;
  sub: string;
  icon: IconName;
  tone: kit.Tone;
  /** What one row of this format is called. */
  unit: [string, string];
};

export const FREE_CATEGORIES: CategoryDef[] = [
  { key: "video", label: "Video Lectures", sub: "Recorded classes by faculty", icon: "video", tone: "blue", unit: ["video", "videos"] },
  { key: "notes", label: "Study Notes", sub: "Chapter-wise notes & PDFs", icon: "file", tone: "teal", unit: ["note", "notes"] },
  { key: "practice", label: "Practice", sub: "Subject-wise question sets", icon: "clipboard", tone: "purple", unit: ["set", "sets"] },
  { key: "current-affairs", label: "Current Affairs", sub: "Daily blogs & question practice", icon: "newspaper", tone: "gold", unit: ["digest", "digests"] },
  { key: "tests", label: "Tests", sub: "Mock, subject-wise & topic-wise tests", icon: "award", tone: "green", unit: ["test", "tests"] },
  { key: "live", label: "Live Classes", sub: "Free masterclasses, open to all", icon: "mic", tone: "red", unit: ["class", "classes"] },
];

const plural = (n: number, [one, many]: [string, string]) => `${n} ${n === 1 ? one : many}`;

export default function FreeResourcesPage({
  onBack,
  initialCategory = null,
  content,
  papers,
  tests = [],
  classes,
  onToggleDone,
  onStartTest,
  onJoinClass,
  onWatchRecording,
  onBrowseCourses,
}: {
  onBack: () => void;
  /** Opened straight into one format when the student tapped its tile. */
  initialCategory?: FreeCategory | null;
  content: { video: ContentItem[]; notes: ContentItem[]; practice: ContentItem[]; "current-affairs": ContentItem[] };
  papers: TestListItem[];
  /** Mocks and sectionals; with `papers` they make up Free Resources ▸ Tests. */
  tests?: TestListItem[];
  classes: { upcoming: LiveClassItem[]; past: LiveClassItem[] };
  onToggleDone: (id: string) => void;
  onStartTest: (id: string) => Promise<StartResult>;
  onJoinClass: (id: string) => void;
  onWatchRecording: (c: LiveClassItem) => void;
  onBrowseCourses: () => void;
}) {
  const [category, setCategory] = useState<FreeCategory | null>(initialCategory);
  const [subject, setSubject] = useState<string | null>(null);
  // Set when the format was chosen on the hub below, so Back goes to the hub.
  // Opened straight into a format instead, Back leaves the screen altogether.
  const [fromHub, setFromHub] = useState(false);
  /** Practice has two halves; this opens the uploaded worksheets for the subject. */
  const [practiceMaterial, setPracticeMaterial] = useState(false);
  /** Free Resources ▸ Tests: which of its three kinds is open. */
  const [testMode, setTestMode] = useState<TestMode | null>(null);

  // ── What is free, grouped by section ──
  // Only material with no batch behind it: that is what "free" means here.
  const free = useMemo(() => {
    const items = (list: ContentItem[]) => list.filter((i) => i.free !== false);
    const subjectOf = (i: ContentItem) => resolveSubject(i.subject, i.title, i.body);
    const group = <T,>(list: T[], of: (x: T) => string) => {
      const map = new Map<string, T[]>();
      for (const x of list) {
        const s = of(x);
        map.set(s, [...(map.get(s) ?? []), x]);
      }
      return map;
    };
    return {
      video: group(items(content.video), subjectOf),
      notes: group(items(content.notes), subjectOf),
      "current-affairs": group(items(content["current-affairs"]), subjectOf),
      practiceMaterial: group(items(content.practice), subjectOf),
      practice: group(papers.filter((p) => p.free !== false), (p) => resolveSubject(p.subject, p.title, p.description)),
      live: group([...classes.upcoming, ...classes.past], (c) => resolveSubject(c.subject, c.title)),
    };
  }, [content, papers, classes]);

  // ── Free tests, in three kinds: full mocks, subject-wise, topic-wise ──
  const freeTests = useMemo(() => {
    const all = [...tests, ...papers].filter((t) => t.free !== false);
    const subjectOf = (t: TestListItem) => resolveSubject(t.subject, t.title, t.description);
    const mock = all.filter((t) => t.type === "mock");
    const rest = all.filter((t) => t.type !== "mock");
    const topic = rest.filter((t) => t.topic);
    const subject = rest.filter((t) => !t.topic);
    const bySubject = (list: TestListItem[]) => {
      const map = new Map<string, TestListItem[]>();
      for (const t of list) map.set(subjectOf(t), [...(map.get(subjectOf(t)) ?? []), t]);
      return map;
    };
    return { mock, subject: bySubject(subject), topic: bySubject(topic), total: all.length };
  }, [tests, papers]);

  /** Free classes that are live or still to come — live ones first, then by start time. */
  const liveNow = useMemo(
    () => classes.upcoming
      .filter((c) => c.status !== "ended")
      .sort((a, b) => (a.status === "live" ? 0 : 1) - (b.status === "live" ? 0 : 1) || a.startAt.localeCompare(b.startAt)),
    [classes],
  );

  /** How many free items a format holds for a section. */
  const countFor = (cat: FreeCategory, s: string): number => {
    if (cat === "practice") return (free.practice.get(s)?.length ?? 0) + (free.practiceMaterial.get(s)?.length ?? 0);
    if (cat === "live") return free.live.get(s)?.length ?? 0;
    if (cat === "tests") return (freeTests.subject.get(s)?.length ?? 0) + (freeTests.topic.get(s)?.length ?? 0);
    return free[cat].get(s)?.length ?? 0;
  };

  const totalFor = (cat: FreeCategory): number =>
    cat === "tests" ? freeTests.total :
    cat === "live" ? liveNow.length + classes.past.length : subjectsFor(cat).reduce((n, s) => n + countFor(cat, s), 0);

  /** The five sections, plus General when something landed there. */
  function subjectsFor(cat: FreeCategory): string[] {
    const keys =
      cat === "practice" ? [...free.practice.keys(), ...free.practiceMaterial.keys()]
      : cat === "live" ? [...free.live.keys()]
      : cat === "tests" ? [...freeTests.subject.keys(), ...freeTests.topic.keys()]
      : [...free[cat].keys()];
    return subjectOrder(keys);
  }

  const back = () => {
    if (practiceMaterial) return setPracticeMaterial(false);
    if (subject) return setSubject(null);
    if (testMode) return setTestMode(null);
    if (category && fromHub) { setFromHub(false); return setCategory(null); }
    onBack();
  };

  const openCategory = (c: FreeCategory) => { setFromHub(true); setCategory(c); };

  // ── Current Affairs: not by subject — the daily blogs, and their questions ──
  if (category === "current-affairs") return <CurrentAffairsPage onBack={back} />;

  // ── Tests: Mock → all mocks; Subject-wise → subject → tests; Topic-wise → subject → topics ──
  if (category === "tests") {
    const modes: { key: TestMode; label: string; sub: string; icon: IconName; count: number }[] = [
      { key: "mock", label: "Mock Tests", sub: "Full-length papers, every section mixed", icon: "clipboard", count: freeTests.mock.length },
      { key: "subject", label: "Subject-wise Tests", sub: "Chapter tests & sets for one CLAT section", icon: "layers", count: [...freeTests.subject.values()].flat().length },
      { key: "topic", label: "Topic-wise Tests", sub: "Short tests on a single topic", icon: "target", count: [...freeTests.topic.values()].flat().length },
    ];

    if (testMode === "mock") {
      return (
        <div style={kit.page}>
          <kit.ScreenHeader title="Mock Tests" subtitle="Free for every student" onBack={back} />
          <div style={kit.body}><FreeTestList tests={freeTests.mock} onStart={onStartTest} empty="No free mock tests yet." /></div>
        </div>
      );
    }

    if (testMode && subject) {
      const list = freeTests[testMode].get(subject) ?? [];
      const groups = testMode === "topic"
        ? [...list.reduce((m, t) => m.set(t.topic || "Other topics", [...(m.get(t.topic || "Other topics") ?? []), t]), new Map<string, TestListItem[]>()).entries()]
            .sort(([a], [b]) => a.localeCompare(b))
        : null;
      return (
        <div style={kit.page}>
          <kit.ScreenHeader title={testMode === "topic" ? "Topic-wise Tests" : "Subject-wise Tests"} subtitle={subject} onBack={back} />
          <div style={kit.body}>
            {groups ? groups.map(([topic, ts]) => (
              <section key={topic} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 2px 0" }}>
                  <span style={{ width: 4, height: 16, borderRadius: 2, background: "var(--blue)" }} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>{topic}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)" }}>{plural(ts.length, ["test", "tests"])}</span>
                </div>
                <FreeTestList tests={ts} onStart={onStartTest} empty="" />
              </section>
            )) : <FreeTestList tests={list} onStart={onStartTest} empty="No free tests in this subject yet." />}
          </div>
        </div>
      );
    }

    if (testMode) {
      const map = freeTests[testMode];
      const subjects = subjectOrder(map.keys());
      const mode = modes.find((m) => m.key === testMode)!;
      return (
        <div style={kit.page}>
          <kit.ScreenHeader title={mode.label} subtitle="Pick a subject" onBack={back} />
          <div style={kit.body}>
            {subjects.map((s) => {
              const ts = map.get(s) ?? [];
              const n = ts.length;
              const topics = new Set(ts.map((t) => t.topic)).size;
              return (
                <button key={s} onClick={() => n > 0 && setSubject(s)} disabled={n === 0} className={n > 0 ? "press" : undefined} style={{ ...kit.card, width: "100%", textAlign: "left", padding: "13px 14px", display: "flex", alignItems: "center", gap: 12, cursor: n > 0 ? "pointer" : "default", opacity: n > 0 ? 1 : 0.55 }}>
                  <kit.IconTile icon={subjectIconName(s)} tone="green" size={42} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>{s}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: n > 0 ? "var(--ink-soft)" : "var(--text-disabled)", marginTop: 2 }}>
                      {n === 0 ? "Coming soon" : testMode === "topic" ? `${plural(topics, ["topic", "topics"])} · ${plural(n, ["test", "tests"])}` : plural(n, ["test", "tests"])}
                    </span>
                  </span>
                  {n > 0 && <AppIcon name="chevronRight" size={18} color="var(--text-muted)" />}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div style={kit.page}>
        <kit.ScreenHeader title="Tests" subtitle="Free for every student" onBack={back} />
        <div style={kit.body}>
          <kit.SectionTitle kicker="Pick a kind" title="Free tests" />
          {modes.map((m) => (
            <button key={m.key} onClick={() => setTestMode(m.key)} className="press" style={{ ...kit.card, width: "100%", textAlign: "left", padding: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
              <kit.IconTile icon={m.icon} tone="green" size={46} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 14.5, fontWeight: 800, color: "var(--ink)" }}>{m.label}</span>
                <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-soft)", marginTop: 3 }}>{m.sub}</span>
                <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--blue)", marginTop: 5 }}>{plural(m.count, ["test", "tests"])} free</span>
              </span>
              <AppIcon name="chevronRight" size={18} color="var(--text-muted)" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Live Classes: no subject step, just what is on now and next ──
  if (category === "live") {
    return (
      <LiveClassesPage
        onBack={back}
        title="Live Classes"
        subtitle="Free for every student"
        upcoming={liveNow}
        past={classes.past}
        attendancePct={null}
        onJoin={onJoinClass}
        onWatchRecording={onWatchRecording}
      />
    );
  }

  // ── 3 · One section's free material, topic-wise ──
  if (category && subject) {

    if (category === "practice") {
      const material = free.practiceMaterial.get(subject) ?? [];
      if (practiceMaterial) {
        return <ContentListPage onBack={back} type="practice" subtitle={subject} items={material} onToggleDone={onToggleDone} groupByTopic />;
      }
      return (
        <PracticePage
          onBack={back}
          subtitle={subject}
          papers={free.practice.get(subject) ?? []}
          material={material}
          groupByTopic
          onStart={onStartTest}
          onOpenMaterial={() => setPracticeMaterial(true)}
        />
      );
    }

    return (
      <ContentListPage
        onBack={back}
        type={category}
        subtitle={subject}
        items={free[category].get(subject) ?? []}
        onToggleDone={onToggleDone}
        groupByTopic
      />
    );
  }

  // ── 2 · Sections inside one format ──
  if (category) {
    const def = FREE_CATEGORIES.find((c) => c.key === category)!;
    const subjects = subjectsFor(category);
    const total = totalFor(category);

    return (
      <div style={kit.page}>
        <kit.ScreenHeader title={def.label} subtitle="Free for every student" onBack={back} />

        <div style={{ padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ ...kit.card, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <kit.IconTile icon={def.icon} tone={def.tone} size={44} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>{def.sub}</span>
              <span style={{ display: "block", fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>
                {plural(total, def.unit)} free · pick a subject, then a topic
              </span>
            </span>
          </div>

          <kit.SectionTitle kicker="Choose a subject" title="CLAT sections" />

          {subjects.map((s) => {
            const n = countFor(category, s);
            return (
              <button
                key={s}
                onClick={() => n > 0 && setSubject(s)}
                className={n > 0 ? "press" : undefined}
                disabled={n === 0}
                style={{
                  ...kit.card, width: "100%", textAlign: "left", padding: "13px 14px",
                  display: "flex", alignItems: "center", gap: 12,
                  cursor: n > 0 ? "pointer" : "default", opacity: n > 0 ? 1 : 0.55,
                }}
              >
                <kit.IconTile icon={subjectIconName(s)} tone={def.tone} size={42} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>{s}</span>
                  <span style={{ display: "block", fontSize: 11.5, color: n > 0 ? "var(--ink-soft)" : "var(--text-disabled)", marginTop: 2 }}>
                    {n > 0 ? `${plural(n, def.unit)} free` : "Coming soon"}
                  </span>
                </span>
                {n > 0 && <AppIcon name="chevronRight" size={18} color="var(--text-muted)" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── 1 · The five formats ──
  return (
    <div style={kit.page}>
      <kit.ScreenHeader title="Free Resources" subtitle="No batch needed" onBack={back} />

      <div style={{ padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        <kit.HeroCard>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#CFFB6B", color: "var(--blue-dark)", fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 8 }}>
            <AppIcon name="gift" size={12} />Free for every student
          </span>
          <p style={{ margin: "12px 0 4px", fontSize: 22, fontWeight: 700, lineHeight: 1.25 }}>
            Start learning <span style={{ color: "var(--gold)" }}>for free</span>
          </p>
          <p style={{ margin: 0, fontSize: 13.5, color: "rgba(255,255,255,0.72)", lineHeight: 1.5 }}>
            Pick a format, then a subject — every CLAT section has free material in it.
          </p>
        </kit.HeroCard>

        <kit.SectionTitle kicker="Pick a format" title="Explore resources" />

        {FREE_CATEGORIES.map((c) => {
          const n = totalFor(c.key);
          return (
            <button
              key={c.key}
              onClick={() => openCategory(c.key)}
              className="press"
              style={{ ...kit.card, width: "100%", textAlign: "left", padding: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
            >
              <kit.IconTile icon={c.icon} tone={c.tone} size={46} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 14.5, fontWeight: 800, color: "var(--ink)", lineHeight: 1.25 }}>{c.label}</span>
                <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-soft)", marginTop: 3, lineHeight: 1.35 }}>{c.sub}</span>
                <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--blue)", marginTop: 5 }}>
                  {c.key === "current-affairs" ? "Blogs · Question practice" : c.key === "tests" ? `${plural(n, c.unit)} · mock, subject & topic` : c.key === "live" ? `${plural(n, c.unit)} · live, upcoming & completed` : `${plural(n, c.unit)} · 5 subjects`}
                </span>
              </span>
              <AppIcon name="chevronRight" size={18} color="var(--text-muted)" />
            </button>
          );
        })}

        <button onClick={onBrowseCourses} className="press" style={{ ...kit.card, cursor: "pointer", textAlign: "left", padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
          <kit.IconTile icon="graduation" tone="gold" size={42} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>Want mentorship & full batches?</span>
            <span style={{ display: "block", fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>Explore CLATians batches</span>
          </span>
          <AppIcon name="chevronRight" size={18} color="var(--blue)" />
        </button>
      </div>
    </div>
  );
}

type TestMode = "mock" | "subject" | "topic";

/** A run of free tests, each with its size and a Start / Retake button. */
function FreeTestList({ tests, onStart, empty }: { tests: TestListItem[]; onStart: (id: string) => Promise<StartResult>; empty: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  if (tests.length === 0) return empty ? <kit.EmptyState icon="clipboard" title={empty} /> : null;

  const start = async (id: string) => {
    if (busy) return;
    setErr("");
    setBusy(id);
    const r = await onStart(id);
    if (!r.ok) setErr(r.error);
    setBusy(null);
  };

  return (
    <>
      {err && <p style={{ margin: 0, fontSize: 13, color: "var(--error-text)", background: "var(--error)", borderRadius: 12, padding: "10px 12px" }}>{err}</p>}
      {[...tests].sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true })).map((t) => {
        const pct = t.bestScore !== null && t.bestTotal ? Math.round((t.bestScore / t.bestTotal) * 100) : null;
        const done = t.myAttempts > 0;
        return (
          <div key={t.id} style={{ ...kit.card, padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
            <kit.IconTile icon={done ? "checkCircle" : "clipboard"} tone={done ? "green" : "blue"} size={42} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--ink)", lineHeight: 1.3 }}>{t.title}</span>
              <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-soft)", marginTop: 3 }}>
                {t.questionCount} Qs · {t.durationMin > 0 ? `${t.durationMin} min` : "untimed"}{pct !== null ? ` · Best ${pct}%` : ""}
              </span>
            </span>
            <button onClick={() => start(t.id)} disabled={!!busy} className="press" style={{
              flexShrink: 0, cursor: busy ? "default" : "pointer", borderRadius: 10, padding: "8px 14px", fontSize: 12.5, fontWeight: 800,
              border: done ? "1.5px solid var(--blue)" : "none", background: done ? "white" : kit.gradient, color: done ? "var(--blue)" : "white",
              opacity: busy && busy !== t.id ? 0.5 : 1,
            }}>{busy === t.id ? "Starting…" : done ? "Retake" : "Start"}</button>
          </div>
        );
      })}
    </>
  );
}
