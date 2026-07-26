"use client";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

const icon: Record<string, string> = {
  doubt: "💬", class: "🎥", payment: "🧾", content: "📚", announcement: "📢", info: "🔔",
};

function ago(iso: string): string {
  const diff = Date.now() - new Date(iso + "Z").getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsPage({ onBack, items }: { onBack: () => void; items: NotificationItem[] }) {
  return (
    <div style={{ background: "#F7F3EA", minHeight: "100%", paddingBottom: 24 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#2B1700", fontSize: 14, fontWeight: 700, padding: "14px 16px 0" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B1700" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        Notifications
      </button>

      <div style={{ padding: "16px 14px 0" }}>
        {items.length === 0 && (
          <div style={{ background: "white", borderRadius: 18, padding: "28px 18px", textAlign: "center", boxShadow: "0 2px 14px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 34, marginBottom: 8 }}>🔔</div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1A1A2E" }}>You&apos;re all caught up</p>
            <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#9CA3AF" }}>Doubt replies, class reminders and receipts show up here.</p>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((n) => (
            <div key={n.id} style={{ background: n.read ? "white" : "#FFFDF7", borderRadius: 14, padding: "13px 14px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: n.read ? "1px solid transparent" : "1px solid #F5E4C3", display: "flex", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "#F6ECD9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{icon[n.type] ?? "🔔"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {!n.read && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#E63946", flexShrink: 0 }} />}
                  <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: "#1A1A2E" }}>{n.title}</p>
                </div>
                {n.body && <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "#6B7280", lineHeight: 1.5 }}>{n.body}</p>}
                <p style={{ margin: "5px 0 0", fontSize: 10.5, color: "#9CA3AF" }}>{ago(n.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
