"use client";

/** Extract an 11-char YouTube video/live id from common URL shapes (or a bare id). */
export function youtubeId(url?: string): string | null {
  if (!url) return null;
  const u = url.trim();
  const m = u.match(
    /(?:youtube\.com\/(?:watch\?v=|live\/|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  if (m) return m[1];
  if (/^[\w-]{11}$/.test(u)) return u;
  return null;
}

export type WatchTarget = {
  title: string;
  subtitle: string;
  ytId: string;
  notes?: string;
  isLive?: boolean;
};

export default function ClassWatchPage({
  onBack,
  target,
}: {
  onBack: () => void;
  target: WatchTarget;
}) {
  return (
    <div style={{ background: "#F7F3EA", minHeight: "100%", paddingBottom: 24 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#2B1700", fontSize: 14, fontWeight: 700, padding: "14px 16px 0" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B1700" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        {target.isLive ? "Live Class" : "Recording"}
      </button>

      {/* 16:9 responsive YouTube embed */}
      <div style={{ padding: "14px 14px 0" }}>
        <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", borderRadius: 16, overflow: "hidden", background: "#000", boxShadow: "0 6px 20px rgba(0,0,0,0.18)" }}>
          <iframe
            src={`https://www.youtube.com/embed/${target.ytId}?autoplay=1&rel=0`}
            title={target.title}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>

      <div style={{ padding: "14px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          {target.isLive && (
            <span style={{ background: "#FEF2F2", color: "#DC2626", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#DC2626", display: "inline-block" }} /> LIVE
            </span>
          )}
        </div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1A1A2E", lineHeight: 1.3 }}>{target.title}</h2>
        <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#6B7280" }}>{target.subtitle}</p>

        {target.notes && (
          <div style={{ marginTop: 14, background: "white", borderRadius: 14, padding: "14px 16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#3D2411" }}>📝 Class notes</p>
            <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{target.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
