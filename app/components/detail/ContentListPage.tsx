"use client";

import { useState } from "react";
import { youtubeId } from "./ClassWatchPage";

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
function isPdf(s: string) {
  return /\.pdf($|\?)/i.test((s || "").trim());
}

/**
 * Full-screen, in-app viewer for one content item. Handles the three shapes a
 * content body can take: a YouTube link (embedded player), any other document
 * URL (embedded frame + open-in-tab fallback), or plain text (readable article).
 */
function ContentViewer({
  item,
  type,
  onBack,
  onToggleDone,
}: {
  item: ContentItem;
  type: string;
  onBack: () => void;
  onToggleDone: (id: string) => void;
}) {
  const m = meta[type] ?? { label: "Content", emoji: "📚", action: "Open" };
  const body = (item.body || "").trim();
  const ytId = type === "video" ? youtubeId(body) : null;
  const url = isUrl(body) ? body : null;

  return (
    <div style={{ background: "#F7F3EA", minHeight: "100%", paddingBottom: 28 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#2B1700", fontSize: 14, fontWeight: 700, padding: "14px 16px 0" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B1700" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        {m.label}
      </button>

      <div style={{ padding: "12px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 20 }}>{m.emoji}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#8A6A45", textTransform: "uppercase", letterSpacing: "0.04em" }}>{m.label}</span>
        </div>
        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: "#1A1A2E", lineHeight: 1.3 }}>{item.title}</h2>
        <p style={{ margin: "5px 0 0", fontSize: 12, color: "#9CA3AF" }}>{item.author ?? "Faculty"}{item.course ? ` · ${item.course}` : ""}</p>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "14px 14px 0" }}>
        {ytId ? (
          // In-app YouTube player
          <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", borderRadius: 16, overflow: "hidden", background: "#000", boxShadow: "0 6px 20px rgba(0,0,0,0.18)" }}>
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
              title={item.title}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : url ? (
          // Embedded document (PDF / uploaded file / external page) + open fallback
          <div>
            <div style={{ position: "relative", width: "100%", height: 460, borderRadius: 16, overflow: "hidden", background: "white", boxShadow: "0 6px 20px rgba(0,0,0,0.12)", border: "1px solid #ECE0CE" }}>
              <iframe
                src={isPdf(url) ? `${url}#toolbar=1&view=FitH` : url}
                title={item.title}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
              />
            </div>
            <a href={url} target="_blank" rel="noreferrer" style={{ display: "block", marginTop: 10, textAlign: "center", textDecoration: "none", background: "linear-gradient(135deg,#3D2411,#5C3A00)", color: "white", borderRadius: 12, padding: "11px", fontSize: 13, fontWeight: 700 }}>
              Open in new tab ↗
            </a>
            <p style={{ margin: "8px 4px 0", fontSize: 11, color: "#9CA3AF", textAlign: "center" }}>
              If the {isPdf(url) ? "document" : "page"} doesn&apos;t load above, use &quot;Open in new tab&quot;.
            </p>
          </div>
        ) : (
          // Plain-text reader
          <div style={{ background: "white", borderRadius: 16, padding: "18px 18px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            {body ? (
              <p style={{ margin: 0, fontSize: 14.5, color: "#374151", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{body}</p>
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: "#9CA3AF" }}>No content was added for this item yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Mark done */}
      <div style={{ padding: "16px 16px 0" }}>
        <button
          onClick={() => onToggleDone(item.id)}
          style={{
            width: "100%", cursor: "pointer",
            border: `1.5px solid ${item.done ? "#059669" : "#3D2411"}`,
            background: item.done ? "#DCFCE7" : "white",
            color: item.done ? "#15803D" : "#3D2411",
            borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 800,
          }}
        >
          {item.done ? "✓ Completed — tap to undo" : "Mark as completed"}
        </button>
      </div>
    </div>
  );
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
  const [openId, setOpenId] = useState<string | null>(null);
  const doneCount = items.filter((i) => i.done).length;
  const m = meta[type] ?? { label: "Content", emoji: "📚", action: "Open" };

  // In-app viewer takes over when an item is open.
  const openItem = items.find((i) => i.id === openId);
  if (openItem) {
    return <ContentViewer item={openItem} type={type} onBack={() => setOpenId(null)} onToggleDone={onToggleDone} />;
  }

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
            <div
              key={it.id}
              onClick={() => setOpenId(it.id)}
              style={{ background: "white", borderRadius: 16, padding: "14px 15px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", cursor: "pointer" }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#3D2411,#5C3A00)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{m.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#1A1A2E" }}>{it.title}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6B7280", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
                    {isUrl(it.body) ? "Tap to open in the app." : it.body || "No description."}
                  </p>
                  <p style={{ margin: "8px 0 0", fontSize: 10.5, color: "#9CA3AF" }}>
                    {it.author ?? "Faculty"}{it.course ? ` · ${it.course}` : ""}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleDone(it.id); }}
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
              <div
                style={{
                  display: "block", marginTop: 12, textAlign: "center",
                  background: "linear-gradient(135deg,#3D2411,#5C3A00)", color: "white",
                  borderRadius: 12, padding: "10px", fontSize: 13, fontWeight: 700,
                }}
              >
                {m.action} →
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
