"use client";

import { AppIcon, type IconName } from "./AppIcon";
import * as kit from "./ui/kit";

/**
 * AI Prep — the bottom-bar tab that gathers the AI tools in one place.
 * Kept deliberately quiet: one headline card, then plain tiles.
 * (Faculty doubts live inside each purchased batch, topic-wise.)
 */

type Tool = { key: string; title: string; sub: string; icon: IconName; tone: kit.Tone; onClick: () => void };

export default function AiPrepScreen({
  onOpenTutor,
  onOpenPractice,
  onOpenCoach,
}: {
  onOpenTutor: () => void;
  onOpenPractice: () => void;
  onOpenCoach: () => void;
}) {
  const tools: Tool[] = [
    { key: "practice", title: "AI Practice", sub: "Instant quiz", icon: "bolt", tone: "gold", onClick: onOpenPractice },
    { key: "coach", title: "Study Coach", sub: "Your weekly plan", icon: "chart", tone: "green", onClick: onOpenCoach },
  ];

  return (
    <div style={{ background: "var(--app-bg)", paddingBottom: 96 }}>
      <kit.PageTitle title="AI Prep" />

      <div style={{ padding: "12px 16px 0", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* AI Tutor */}
        <button onClick={onOpenTutor} className="press" style={{ ...kit.heroSurface, width: "100%", border: "none", cursor: "pointer", textAlign: "left", padding: 18, color: "white", display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AppIcon name="chat" size={24} color="var(--blue-dark)" />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 18, fontWeight: 800, lineHeight: 1.25 }}>AI Tutor</span>
            <span style={{ display: "block", fontSize: 12.5, color: "rgba(255,255,255,0.72)", marginTop: 3 }}>Ask any CLAT doubt, 24×7</span>
          </span>
          <span style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AppIcon name="arrowRight" size={17} color="white" strokeWidth={2.4} />
          </span>
        </button>

        {/* Other tools */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          {tools.map((t) => (
            <button key={t.key} onClick={t.onClick} className="press" style={{ ...kit.card, textAlign: "left", padding: 16, cursor: "pointer", display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
              <kit.IconTile icon={t.icon} tone={t.tone} size={44} />
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
