"use client";

import { AppIcon, type IconName } from "../AppIcon";

export type SavedItem = { kind: string; key: string; title: string; subtitle: string };

const kindMeta: Record<string, { icon: IconName; label: string }> = {
  tip: { icon: "sparkle", label: "Tip" },
  vocab: { icon: "book", label: "Word" },
  content: { icon: "library", label: "Material" },
  batch: { icon: "graduation", label: "Batch" },
  topic: { icon: "play", label: "Topic" },
};

export default function SavedItemsPage({
  onBack,
  items,
  onRemove,
  onOpen,
}: {
  onBack: () => void;
  items: SavedItem[];
  onRemove: (kind: string, key: string) => void;
  onOpen: (kind: string, key: string) => void;
}) {
  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%", paddingBottom: 24 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "var(--ink-primary)", fontSize: 14, fontWeight: 700, padding: "14px 16px 0" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-primary)" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        My Notes
      </button>

      <div style={{ padding: "16px 14px 0" }}>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-muted)" }}>{items.length} saved item{items.length === 1 ? "" : "s"}</p>

        {items.length === 0 && (
          <div style={{ background: "white", borderRadius: 16, padding: "26px 18px", textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
            <span style={{ width: 56, height: 56, borderRadius: 18, background: "var(--blue-tint)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}><AppIcon name="heart" size={26} color="var(--blue)" /></span>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--ink-primary)" }}>Nothing saved yet</p>
            <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--text-disabled)" }}>Tap the heart on a batch or topic, or “Save to My Notes” on a tip, to keep it here.</p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((it) => {
            const m = kindMeta[it.kind] ?? { icon: "heart" as IconName, label: "Saved" };
            return (
              <div key={`${it.kind}:${it.key}`} style={{ background: "white", borderRadius: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: 8, padding: "0 8px 0 0" }}>
                <button onClick={() => onOpen(it.kind, it.key)} style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "13px 6px 13px 14px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--info-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AppIcon name={m.icon} size={19} color="var(--blue)" /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "var(--ink-primary)" }}>{it.title}</p>
                    {it.subtitle && <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-disabled)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.label} · {it.subtitle}</p>}
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6" /></svg>
                </button>
                <button onClick={() => onRemove(it.kind, it.key)} aria-label="Remove" style={{ flexShrink: 0, border: "1.5px solid var(--border)", background: "white", color: "var(--text-disabled)", borderRadius: 10, padding: "6px 10px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
