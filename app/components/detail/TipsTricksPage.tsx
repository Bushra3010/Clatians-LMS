"use client";
import { useState } from "react";
import type { Tip } from "../../lib/resource-types";
import { AppIcon, subjectIconName, type IconName } from "../AppIcon";
import { card, page, body, ScreenHeader, EmptyState } from "../ui/kit";

// A tip's icon comes from its subject — the tip's own emoji `icon` is never shown.
const tipIcon = (tip: Tip): IconName => {
  const n = subjectIconName(`${tip.tag} ${tip.title}`);
  return n === "library" ? "bulb" : n;
};

export default function TipsTricksPage({ onBack, tips, savedKeys, onToggleSave }: { onBack: () => void; tips: Tip[]; savedKeys: string[]; onToggleSave: (key: string, title: string, subtitle: string) => void }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const isSaved = (title: string) => savedKeys.includes(title);

  return (
    <div style={{ ...page, paddingBottom: 90, minHeight: "100vh" }}>
      <ScreenHeader title="Tips & Tricks" onBack={onBack} />

      <div style={body}>
        <div style={{ background: "linear-gradient(135deg,var(--gold-dark),var(--warning-text))", borderRadius: 20, padding: "18px 16px", boxShadow: "0 8px 22px rgba(221,143,13,0.22)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.22)", color: "white", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20 }}>
            <AppIcon name="bulb" size={12} color="white" strokeWidth={2.4} />
            EXPERT ADVICE
          </span>
          <p style={{ margin: "8px 0 2px", fontSize: 18, fontWeight: 800, color: "white" }}>Tips & Tricks</p>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.8)" }}>Topper-tested strategies for CLAT 2026</p>
        </div>

        {tips.length === 0 && (
          <EmptyState icon="bulb" title="No tips published yet." />
        )}

        {tips.map((tip, i) => (
          <div key={i} style={{ ...card, overflow: "hidden" }}>
            <div onClick={() => setExpanded(expanded === i ? null : i)} style={{ padding: "14px 16px", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, background: `${tip.color}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <AppIcon name={tipIcon(tip)} size={21} color={tip.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 5, alignItems: "center" }}>
                    {tip.tag && <span style={{ background: `${tip.color}15`, color: tip.color, fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>{tip.tag}</span>}
                    {tip.points.length > 0 && <span style={{ fontSize: 10.5, color: "var(--ink-soft)" }}>{tip.points.length} strategies</span>}
                  </div>
                  <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 800, color: "var(--ink)", lineHeight: 1.35 }}>{tip.title}</p>
                  <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.45 }}>{tip.body}</p>
                </div>
                <AppIcon name="chevronRight" size={18} color="var(--text-muted)" style={{ transform: expanded === i ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s", marginTop: 2 }} />
              </div>
            </div>

            {expanded === i && (
              <div style={{ borderTop: "1px solid var(--line)", padding: "14px 16px", background: "var(--app-bg)" }}>
                {tip.points.length > 0 && <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>Key Strategies:</p>}
                {tip.points.map((point, j) => (
                  <div key={j} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: `${tip.color}15`, border: `1.5px solid ${tip.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 800, color: tip.color }}>{j + 1}</div>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5 }}>{point}</p>
                  </div>
                ))}
                <button onClick={() => onToggleSave(tip.title, tip.title, tip.tag)} style={{
                  marginTop: 4, border: "none", borderRadius: 12, padding: "10px 16px", fontSize: 12.5, fontWeight: 800, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: isSaved(tip.title) ? "var(--success)" : "var(--blue-tint)", color: isSaved(tip.title) ? "var(--success-text)" : "var(--blue)",
                }}>
                  <AppIcon name={isSaved(tip.title) ? "check" : "bookmark"} size={15} color={isSaved(tip.title) ? "var(--success-text)" : "var(--blue)"} strokeWidth={2.4} />
                  {isSaved(tip.title) ? "Saved to My Notes" : "Save to My Notes"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
