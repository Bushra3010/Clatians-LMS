"use client";

import { AppIcon, type IconName } from "../AppIcon";
import { ScreenHeader, IconTile, EmptyState, card, page, body } from "../ui/kit";

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
    <div style={page}>
      <ScreenHeader title="My Notes" onBack={onBack} />

      <div style={body}>
        <p style={{ margin: "0 2px", fontSize: 12.5, color: "var(--ink-soft)", fontWeight: 500 }}>{items.length} saved item{items.length === 1 ? "" : "s"}</p>

        {items.length === 0 && (
          <EmptyState icon="heart" title="Nothing saved yet" text="Tap the heart on a batch or topic, or “Save to My Notes” on a tip, to keep it here." />
        )}

        {items.map((it) => {
          const m = kindMeta[it.kind] ?? { icon: "heart" as IconName, label: "Saved" };
          return (
            <div key={`${it.kind}:${it.key}`} style={{ ...card, display: "flex", alignItems: "center", gap: 8, padding: "0 10px 0 0" }}>
              <button onClick={() => onOpen(it.kind, it.key)} style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "13px 6px 13px 14px" }}>
                <IconTile icon={m.icon} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{it.title}</p>
                  {it.subtitle && <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "var(--ink-soft)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.label} · {it.subtitle}</p>}
                </div>
                <AppIcon name="chevronRight" size={16} color="var(--ink-mute)" strokeWidth={2.5} />
              </button>
              <button onClick={() => onRemove(it.kind, it.key)} aria-label="Remove" style={{ flexShrink: 0, border: "1.5px solid var(--line-strong)", background: "white", color: "var(--ink-soft)", borderRadius: 10, padding: "6px 10px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                Remove
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
