"use client";
import { useState } from "react";
import type { Update } from "../../lib/resource-types";
import { AppIcon, featureIconName, type IconName } from "../AppIcon";
import { ScreenHeader, EmptyState, Pill, card, gradient, page, body } from "../ui/kit";

// The update's own `icon` is an emoji from the CMS, so the line icon is picked from its tag and title instead.
function updateIconName(u: Update): IconName {
  const t = `${u.tag} ${u.title}`.toLowerCase();
  if (t.includes("event") || t.includes("webinar") || t.includes("workshop")) return "calendar";
  if (t.includes("feature") || t.includes("app")) return "rocket";
  if (t.includes("result") || t.includes("topper") || t.includes("rank")) return "trophy";
  if (t.includes("announce") || t.includes("notice")) return "megaphone";
  return featureIconName(t);
}

export default function WhatsNewPage({ onBack, updates }: { onBack: () => void; updates: Update[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div style={{ ...page, paddingBottom: 90, minHeight: "100vh" }}>
      <ScreenHeader title="What's New" onBack={onBack} />

      <div style={body}>
        <div style={{ background: gradient, borderRadius: 20, padding: "18px 16px", boxShadow: "0 8px 24px rgba(11,92,255,0.22)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.2)", color: "white", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20 }}>
            <AppIcon name="sparkle" size={11} color="white" strokeWidth={2.5} />LATEST UPDATES
          </span>
          <p style={{ margin: "8px 0 2px", fontSize: 18, fontWeight: 800, color: "white" }}>What&apos;s New at CLATians</p>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.8)" }}>New features, courses &amp; events</p>
        </div>

        {updates.length === 0 && <EmptyState icon="sparkle" title="No updates yet." />}

        {updates.map((u, i) => (
          <div key={i} style={{ ...card, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <span style={{ width: 38, height: 38, borderRadius: 12, background: `${u.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <AppIcon name={updateIconName(u)} size={18} color={u.color} />
                </span>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  {u.tag && <span style={{ background: `${u.color}15`, color: u.color, fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 20 }}>{u.tag}</span>}
                  {u.hot && <Pill tone="red"><AppIcon name="flame" size={11} strokeWidth={2.5} />HOT</Pill>}
                </div>
              </div>
              <span style={{ fontSize: 11, color: "var(--ink-mute)", flexShrink: 0 }}>{u.dateLabel}</span>
            </div>
            <p style={{ margin: "0 0 6px", fontSize: 14.5, fontWeight: 800, color: "var(--ink)", lineHeight: 1.35 }}>{u.title}</p>
            <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>{u.desc}</p>
            {open === i && u.more && (
              <div style={{ background: "var(--app-bg)", border: "1px solid var(--line)", borderRadius: 12, padding: "10px 12px", marginTop: 10 }}>
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>{u.more}</p>
              </div>
            )}
            {u.more && (
              <button onClick={() => setOpen(open === i ? null : i)} style={{ background: "none", border: "none", padding: 0, marginTop: 10, color: "var(--blue)", fontSize: 12.5, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
                {open === i ? "Show less" : "Learn More"}
                <AppIcon name={open === i ? "chevronDown" : "arrowRight"} size={14} strokeWidth={2.5} style={open === i ? { transform: "rotate(180deg)" } : undefined} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
