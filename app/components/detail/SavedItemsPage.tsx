"use client";

export type SavedItem = { kind: string; key: string; title: string; subtitle: string };

const kindMeta: Record<string, { emoji: string; label: string }> = {
  tip: { emoji: "💡", label: "Tip" },
  vocab: { emoji: "📖", label: "Word" },
  content: { emoji: "📚", label: "Material" },
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
    <div style={{ background: "#F7F3EA", minHeight: "100%", paddingBottom: 24 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#2B1700", fontSize: 14, fontWeight: 700, padding: "14px 16px 0" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B1700" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        My Notes
      </button>

      <div style={{ padding: "16px 14px 0" }}>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6B7280" }}>{items.length} saved item{items.length === 1 ? "" : "s"}</p>

        {items.length === 0 && (
          <div style={{ background: "white", borderRadius: 18, padding: "28px 18px", textAlign: "center", boxShadow: "0 2px 14px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 34, marginBottom: 8 }}>🔖</div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1A1A2E" }}>Nothing saved yet</p>
            <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#9CA3AF" }}>Tap “Save to My Notes” on any tip to keep it here.</p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((it) => {
            const m = kindMeta[it.kind] ?? { emoji: "🔖", label: "Saved" };
            return (
              <div key={`${it.kind}:${it.key}`} style={{ background: "white", borderRadius: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: 8, padding: "0 8px 0 0" }}>
                <button onClick={() => onOpen(it.kind, it.key)} style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "13px 6px 13px 14px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "#F6ECD9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{m.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#1A1A2E" }}>{it.title}</p>
                    {it.subtitle && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.label} · {it.subtitle}</p>}
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6" /></svg>
                </button>
                <button onClick={() => onRemove(it.kind, it.key)} aria-label="Remove" style={{ flexShrink: 0, border: "1.5px solid #E5E7EB", background: "white", color: "#9CA3AF", borderRadius: 10, padding: "6px 10px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
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
