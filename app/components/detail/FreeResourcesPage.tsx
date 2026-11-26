"use client";

import { useMemo, useState } from "react";
import type { ContentItem } from "./ContentListPage";
import ContentListPage from "./ContentListPage";
import type { TestListItem } from "./TestPages";
import type { LiveClassItem } from "./LiveClassesPage";
import LiveClassesPage from "./LiveClassesPage";
import PracticePage from "./PracticePage";
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

export type FreeCategory = "video" | "notes" | "practice" | "current-affairs" | "live";

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
  { key: "current-affairs", label: "Current Affairs", sub: "Daily digests for CLAT GK", icon: "newspaper", tone: "gold", unit: ["digest", "digests"] },
  { key: "live", label: "Live Classes", sub: "Free masterclasses, open to all", icon: "mic", tone: "red", unit: ["class", "classes"] },
];

const plural = (n: number, [one, many]: [string, string]) => `${n} ${n === 1 ? one : many}`;

export default function FreeResourcesPage({
  onBack,
  initialCategory = null,
  content,
  papers,
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
    return free[cat].get(s)?.length ?? 0;
  };

  const totalFor = (cat: FreeCategory): number =>
    cat === "live" ? liveNow.length : subjectsFor(cat).reduce((n, s) => n + countFor(cat, s), 0);

  /** The five sections, plus General when something landed there. */
  function subjectsFor(cat: FreeCategory): string[] {
    const keys =
      cat === "practice" ? [...free.practice.keys(), ...free.practiceMaterial.keys()]
      : cat === "live" ? [...free.live.keys()]
      : [...free[cat].keys()];
    return subjectOrder(keys);
  }

  const back = () => {
    if (practiceMaterial) return setPracticeMaterial(false);
    if (subject) return setSubject(null);
    if (category && fromHub) { setFromHub(false); return setCategory(null); }
    onBack();
  };

  const openCategory = (c: FreeCategory) => { setFromHub(true); setCategory(c); };

  // ── Live Classes: no subject step, just what is on now and next ──
  if (category === "live") {
    return (
      <LiveClassesPage
        onBack={back}
        title="Live Classes"
        subtitle="Ongoing & upcoming · free for all"
        upcoming={liveNow}
        past={[]}
        hidePast
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
                  {c.key === "live" ? `${plural(n, c.unit)} · ongoing & upcoming` : `${plural(n, c.unit)} · 5 subjects`}
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
