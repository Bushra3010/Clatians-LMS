"use client";

import { AppIcon, type IconName } from "./AppIcon";
import * as kit from "./ui/kit";

/**
 * AI Prep — the bottom-bar tab that gathers every AI tool in one place.
 *
 * Doubts used to live here; they now sit inside each purchased batch
 * (My Learning ▸ batch ▸ Doubts, and topic-wise on every topic page), where
 * faculty see which topic a question is about. This tab is for the tools a
 * student can use any time, with or without a batch.
 */

type Tool = {
  key: string;
  title: string;
  sub: string;
  icon: IconName;
  tone: kit.Tone;
  badge?: string;
  cta: string;
  onClick?: () => void;
};

export default function AiPrepScreen({
  onOpenTutor,
  onOpenPractice,
  onOpenCoach,
  onOpenVocab,
}: {
  onOpenTutor: () => void;
  onOpenPractice: () => void;
  onOpenCoach: () => void;
  onOpenVocab: () => void;
}) {
  const tools: Tool[] = [
    { key: "practice", title: "AI Practice", sub: "Instant quiz on any topic, with explanations for every answer", icon: "bolt", tone: "gold", badge: "NEW", cta: "Start", onClick: onOpenPractice },
    { key: "coach", title: "AI Study Coach", sub: "A plan for this week, built from your scores and weak sections", icon: "chart", tone: "green", cta: "Get plan", onClick: onOpenCoach },
    { key: "vocab", title: "AI Vocab Builder", sub: "New CLAT-level words on any theme, with meaning and usage", icon: "language", tone: "purple", cta: "Build", onClick: onOpenVocab },
  ];

  return (
    <div style={{ background: "var(--app-bg)", paddingBottom: 96 }}>
      <kit.PageTitle kicker="Your personal AI toolkit" title="AI Prep" />

      <div style={{ padding: "12px 16px 0", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* AI Tutor — the headline tool */}
        <kit.HeroCard padding={16}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#CFFB6B", color: "var(--blue-dark)", fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 8 }}>
            <AppIcon name="sparkle" size={12} />Available 24×7
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
            <span style={{ width: 50, height: 50, borderRadius: 15, background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.26)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <AppIcon name="chat" size={24} color="white" />
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 19, fontWeight: 700, lineHeight: 1.25 }}>AI <span style={{ color: "var(--gold)" }}>Tutor</span></span>
              <span style={{ display: "block", fontSize: 12.5, color: "rgba(255,255,255,0.72)", marginTop: 2 }}>Ask any CLAT question, get a step-by-step answer instantly.</span>
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
            {["Explain this legal principle", "Solve a quant question", "Summarise a passage"].map((t) => (
              <span key={t} style={{ fontSize: 11.5, fontWeight: 600, color: "white", background: "rgba(255,255,255,0.12)", padding: "4px 10px", borderRadius: 20 }}>{t}</span>
            ))}
          </div>
          <button onClick={onOpenTutor} className="press" style={{ ...kit.goldBtn, width: "100%", marginTop: 14, color: "var(--blue-dark)" }}>
            Chat with AI Tutor <AppIcon name="arrowRight" size={16} strokeWidth={2.4} />
          </button>
        </kit.HeroCard>

        <kit.SectionTitle kicker="Practise smarter" title="More AI tools" />

        {tools.map((t) => (
          <button key={t.key} onClick={t.onClick} className="press" style={{ ...kit.card, width: "100%", textAlign: "left", padding: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
            <kit.IconTile icon={t.icon} tone={t.tone} size={46} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14.5, fontWeight: 800, color: "var(--ink)" }}>{t.title}</span>
                {t.badge && <kit.Pill tone="gold">{t.badge}</kit.Pill>}
              </span>
              <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-soft)", marginTop: 3, lineHeight: 1.4 }}>{t.sub}</span>
            </span>
            <span style={{ flexShrink: 0, fontSize: 12.5, fontWeight: 800, color: "var(--blue)", display: "inline-flex", alignItems: "center", gap: 3 }}>
              {t.cta}<AppIcon name="chevronRight" size={15} />
            </span>
          </button>
        ))}

        {/* Where doubts went */}
        <div style={{ ...kit.card, padding: 14, display: "flex", alignItems: "center", gap: 12, background: "var(--blue-tint)", border: "1px solid var(--line)" }}>
          <kit.IconTile icon="info" size={38} />
          <span style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.5 }}>
            Need a faculty answer? Ask on the topic itself — open your batch in <b style={{ color: "var(--ink)" }}>My Learning</b>, pick a topic and use its <b style={{ color: "var(--ink)" }}>Doubt</b> tab.
          </span>
        </div>
      </div>
    </div>
  );
}
