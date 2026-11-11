"use client";

import { parseServerDate } from "../../lib/dates";
import type { IconName } from "../AppIcon";
import { ScreenHeader, IconTile, EmptyState, card, page, body, type Tone } from "../ui/kit";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

const icon: Record<string, IconName> = {
  doubt: "chat", class: "video", payment: "receipt", content: "book", announcement: "megaphone", info: "bell",
};
const tone: Record<string, Tone> = {
  doubt: "purple", class: "red", payment: "green", content: "blue", announcement: "gold", info: "blue",
};

function ago(iso: string): string {
  const t = parseServerDate(iso).getTime();
  if (isNaN(t)) return "";
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsPage({ onBack, items }: { onBack: () => void; items: NotificationItem[] }) {
  return (
    <div style={page}>
      <ScreenHeader title="Notifications" onBack={onBack} />

      <div style={body}>
        {items.length === 0 && (
          <EmptyState icon="bell" title="You're all caught up" text="Doubt replies, class reminders and receipts show up here." />
        )}
        {items.map((n) => (
          <div key={n.id} style={{ ...card, background: n.read ? "white" : "var(--blue-tint)", border: n.read ? "1px solid var(--line)" : "1px solid var(--blue-ghost)", padding: "13px 14px", display: "flex", gap: 12 }}>
            <IconTile icon={icon[n.type] ?? "bell"} tone={tone[n.type] ?? "blue"} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {!n.read && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--red)", flexShrink: 0 }} />}
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>{n.title}</p>
              </div>
              {n.body && <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>{n.body}</p>}
              <p style={{ margin: "5px 0 0", fontSize: 10.5, color: "var(--ink-mute)" }}>{ago(n.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
