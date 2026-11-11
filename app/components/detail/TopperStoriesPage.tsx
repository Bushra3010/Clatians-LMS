"use client";
import type { Story } from "../../lib/resource-types";
import { AppIcon } from "../AppIcon";
import { card, gradient, page, body, ScreenHeader, EmptyState } from "../ui/kit";

export default function TopperStoriesPage({ onBack, stories }: { onBack: () => void; stories: Story[] }) {
  return (
    <div style={{ ...page, paddingBottom: 90, minHeight: "100vh" }}>
      <ScreenHeader title="CLATians Toppers" onBack={onBack} />

      <div style={body}>
        <div style={{ background: gradient, borderRadius: 20, padding: "18px 16px", boxShadow: "0 8px 22px rgba(11,92,255,0.22)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--gold)", color: "var(--ink)", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20 }}>
            <AppIcon name="trophy" size={12} color="var(--ink)" strokeWidth={2.4} />
            HALL OF FAME
          </span>
          <p style={{ margin: "8px 0 2px", fontSize: 18, fontWeight: 800, color: "white" }}>CLATians Toppers</p>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.75)" }}>Real stories from NLU qualifiers who trained with us</p>
        </div>

        {stories.length === 0 && (
          <EmptyState icon="trophy" title="No success stories published yet." />
        )}

        {stories.map((t, i) => (
          <div key={i} style={{ ...card, overflow: "hidden" }}>
            <div style={{ height: 5, background: `linear-gradient(90deg,${t.color},${t.color}88)` }} />
            <div style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: t.quote ? 12 : 0 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: `linear-gradient(135deg,${t.color},${t.color}BB)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "white", flexShrink: 0 }}>{t.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>{t.name}</p>
                  <p style={{ margin: "3px 0", fontSize: 12, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 5 }}>
                    <AppIcon name="graduation" size={14} color="var(--blue)" />
                    {t.college}
                  </p>
                  {t.rank && <span style={{ background: `${t.color}15`, color: t.color, fontSize: 10.5, fontWeight: 800, padding: "2px 9px", borderRadius: 20 }}>{t.rank}</span>}
                </div>
              </div>
              {t.quote && (
                <div style={{ background: "var(--app-bg)", borderRadius: 12, padding: "10px 12px" }}>
                  <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-soft)", fontStyle: "italic", lineHeight: 1.5 }}>&ldquo;{t.quote}&rdquo;</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
