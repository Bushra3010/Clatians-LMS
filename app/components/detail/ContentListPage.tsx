"use client";

export type ContentItem = {
  id: string;
  title: string;
  body: string;
  author: string | null;
  course: string | null;
  createdAt: string;
  done: boolean;
};

const meta: Record<string, { label: string; emoji: string; action: string }> = {
  video: { label: "Video Lectures", emoji: "🎥", action: "Watch" },
  notes: { label: "Study Notes", emoji: "📄", action: "Read" },
  practice: { label: "Practice Questions", emoji: "📝", action: "Practice" },
  "current-affairs": { label: "Current Affairs", emoji: "🗞", action: "Read" },
};

function isUrl(s: string) {
  return /^(https?:\/\/|\/uploads\/)/i.test((s || "").trim());
}

export default function ContentListPage({
  onBack,
  type,
  items,
  onToggleDone,
}: {
  onBack: () => void;
  type: string;
  items: ContentItem[];
  onToggleDone: (id: string) => void;
}) {
  const doneCount = items.filter((i) => i.done).length;
  const m = meta[type] ?? { label: "Content", emoji: "📚", action: "Open" };

  return (
    <div style={{ background: "#F7F3EA", minHeight: "100%", paddingBottom: 24 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#2B1700", fontSize: 14, fontWeight: 700, padding: "14px 16px 0" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B1700" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        {m.label}
      </button>

      <div style={{ padding: "16px 14px 0" }}>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6B7280" }}>
          {items.length} {items.length === 1 ? "item" : "items"} available · <span style={{ color: "#059669", fontWeight: 700 }}>{doneCount} done</span>
        </p>

        {items.length === 0 && (
          <div style={{ background: "white", borderRadius: 18, padding: "28px 18px", textAlign: "center", boxShadow: "0 2px 14px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 34, marginBottom: 8 }}>{m.emoji}</div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1A1A2E" }}>Nothing here yet</p>
            <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#9CA3AF" }}>
              Your teachers haven&apos;t published {m.label.toLowerCase()} for your batch yet.
            </p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((it) => (
            <div key={it.id} style={{ background: "white", borderRadius: 16, padding: "14px 15px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#3D2411,#5C3A00)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{m.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#1A1A2E" }}>{it.title}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>
                    {isUrl(it.body) ? "Tap below to open." : it.body || "No description."}
                  </p>
                  <p style={{ margin: "8px 0 0", fontSize: 10.5, color: "#9CA3AF" }}>
                    {it.author ?? "Faculty"}{it.course ? ` · ${it.course}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => onToggleDone(it.id)}
                  aria-label={it.done ? "Mark not done" : "Mark done"}
                  style={{
                    flexShrink: 0, display: "flex", alignItems: "center", gap: 5, cursor: "pointer",
                    border: `1.5px solid ${it.done ? "#059669" : "#E5E7EB"}`,
                    background: it.done ? "#DCFCE7" : "white",
                    color: it.done ? "#15803D" : "#9CA3AF",
                    borderRadius: 20, padding: "5px 10px", fontSize: 11, fontWeight: 800,
                  }}
                >
                  {it.done ? "✓ Done" : "Mark done"}
                </button>
              </div>
              {isUrl(it.body) && (
                <a
                  href={it.body.trim()}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "block", marginTop: 12, textAlign: "center", textDecoration: "none",
                    background: "linear-gradient(135deg,#3D2411,#5C3A00)", color: "white",
                    borderRadius: 12, padding: "10px", fontSize: 13, fontWeight: 700,
                  }}
                >
                  {m.action} →
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
