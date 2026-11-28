"use client";

import { AppIcon, type IconName } from "./AppIcon";
import * as kit from "./ui/kit";

/**
 * AI Prep — the bottom-bar tab that gathers the AI tools in one place.
 * Full but light on words: the AI Tutor up top, the student's AI activity,
 * then a grid of tools with two-word labels.
 */

type Tool = { key: string; title: string; sub: string; icon: IconName; tone: kit.Tone; onClick: () => void };

const QUICK_ASKS = ["Legal doubt", "Quant problem", "RC strategy"];

export default function AiPrepScreen({
  onOpenTutor,
  onOpenPractice,
  onOpenCoach,
  onOpenVocab,
  onOpenTest,
  onOpenDoubts,
  activity,
}: {
  onOpenTutor: () => void;
  onOpenPractice: () => void;
  onOpenCoach: () => void;
  onOpenVocab: () => void;
  onOpenTest: () => void;
  onOpenDoubts: () => void;
  activity: { sessions: number; accuracy: number | null; words: number };
}) {
  const tools: Tool[] = [
    { key: "test", title: "AI Test", sub: "Timed mock", icon: "clipboard", tone: "red", onClick: onOpenTest },
    { key: "practice", title: "AI Practice", sub: "Instant quiz", icon: "bolt", tone: "gold", onClick: onOpenPractice },
    { key: "coach", title: "Study Coach", sub: "Weekly plan", icon: "chart", tone: "green", onClick: onOpenCoach },
    { key: "vocab", title: "Vocab Builder", sub: "Word flashcards", icon: "language", tone: "purple", onClick: onOpenVocab },
    { key: "doubts", title: "Ask Faculty", sub: "Your doubts", icon: "users", tone: "blue", onClick: onOpenDoubts },
  ];
  const stats = [
    { v: String(activity.sessions), l: "Quizzes" },
    { v: activity.accuracy === null ? "—" : `${activity.accuracy}%`, l: "Accuracy" },
    { v: String(activity.words), l: "Words learned" },
  ];

  return (
    <div style={{ background: "var(--app-bg)", paddingBottom: 96 }}>
      <kit.PageTitle kicker="Your personal AI toolkit" title="AI Prep" />

      <div style={{ padding: "12px 16px 0", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* AI Tutor */}
        <kit.HeroCard padding={18}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ position: "relative", flexShrink: 0 }}>
              <span style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AppIcon name="chat" size={24} color="var(--blue-dark)" />
              </span>
              <span style={{ position: "absolute", right: 1, bottom: 2, width: 12, height: 12, borderRadius: "50%", background: "#22C55E", border: "2px solid var(--blue-dark)" }} />
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 19, fontWeight: 800, lineHeight: 1.25 }}>AI <span style={{ color: "var(--gold)" }}>Tutor</span></span>
              <span style={{ display: "block", fontSize: 12.5, color: "rgba(255,255,255,0.72)", marginTop: 2 }}>Ask any CLAT doubt, 24×7</span>
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
            {QUICK_ASKS.map((t) => (
              <button key={t} onClick={onOpenTutor} style={{ border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.10)", color: "white", borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{t}</button>
            ))}
          </div>
          <button onClick={onOpenTutor} className="press" style={{ ...kit.goldBtn, width: "100%", marginTop: 14, color: "var(--blue-dark)" }}>
            Start a chat <AppIcon name="arrowRight" size={16} strokeWidth={2.4} />
          </button>
        </kit.HeroCard>

        {/* Your AI activity */}
        <div style={{ ...kit.card, padding: "14px 6px", display: "flex" }}>
          {stats.map((x, i) => (
            <div key={x.l} style={{ flex: 1, textAlign: "center", borderLeft: i ? "1px solid var(--line)" : "none" }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "var(--blue)", lineHeight: 1.1 }}>{x.v}</p>
              <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--ink-soft)" }}>{x.l}</p>
            </div>
          ))}
        </div>

        {/* Tools */}
        <kit.SectionTitle title="AI tools" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginTop: -4 }}>
          {tools.map((t, i) => i === 0 ? (
            // The AI Test leads, full width.
            <button key={t.key} onClick={t.onClick} className="press" style={{ ...kit.card, gridColumn: "1 / -1", textAlign: "left", padding: 16, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
              <kit.IconTile icon={t.icon} tone={t.tone} size={48} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>{t.title}</span>
                  <kit.Pill tone="gold">NEW</kit.Pill>
                </span>
                <span style={{ display: "block", fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>{t.sub} · CLAT pattern</span>
              </span>
              <span style={{ width: 34, height: 34, borderRadius: "50%", background: kit.gradient, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <AppIcon name="arrowRight" size={16} color="white" />
              </span>
            </button>
          ) : (
            <button key={t.key} onClick={t.onClick} className="press" style={{ ...kit.card, textAlign: "left", padding: 16, cursor: "pointer", display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
              <span style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <kit.IconTile icon={t.icon} tone={t.tone} size={44} />
                <AppIcon name="arrowRight" size={15} color="var(--ink-mute)" />
              </span>
              <span>
                <span style={{ display: "block", fontSize: 14.5, fontWeight: 800, color: "var(--ink)" }}>{t.title}</span>
                <span style={{ display: "block", fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>{t.sub}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
