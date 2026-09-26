"use client";

interface TopBarProps {
  courseName?: string;
  onProfileClick?: () => void;
  /** Kept for the shell's "go home" affordance — the logo now lives in the hero. */
  onLogoClick?: () => void;
  onBellClick?: () => void;
  unreadCount?: number;
  onChangeCourse?: () => void;
}

const ICON = "var(--text-secondary)";

const TutorSvg = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={ICON} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z" />
    <path d="M18 15.5l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8.8-1.9z" />
  </svg>
);

const BellSvg = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={ICON} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const UserSvg = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={ICON} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9.5" />
    <circle cx="12" cy="10" r="3.2" />
    <path d="M5.6 19a7 7 0 0 1 12.8 0" />
  </svg>
);

/** Flat chip — the course context reads as a row of tags, not a title bar. */
function Chip({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "free" }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      background: tone === "free" ? "var(--success)" : "var(--surface)",
      color: tone === "free" ? "var(--success-text)" : "var(--text-secondary)",
      borderRadius: 10,
      padding: "7px 12px",
      fontSize: 14, fontWeight: 600,
      lineHeight: 1.2,
      whiteSpace: "nowrap",
      overflow: "hidden", textOverflow: "ellipsis",
      flexShrink: 0,
    }}>
      {children}
    </span>
  );
}

export default function TopBar({ courseName = "CLAT 2026", onProfileClick, onBellClick, unreadCount = 0, onChangeCourse }: TopBarProps) {
  const actions = [
    { icon: <TutorSvg />, count: 0, href: "/tutor", onClick: undefined, label: "AI Tutor" },
    { icon: <BellSvg />, count: unreadCount, href: undefined, onClick: onBellClick, label: "Notifications" },
    { icon: <UserSvg />, count: 0, href: undefined, onClick: onProfileClick, label: "Profile" },
  ];

  return (
    <div style={{
      background: "var(--app-bg)",
      padding: "12px 16px 10px",
      zIndex: 40,
      flexShrink: 0,
    }}>
      {/* Row 1 — course chips + actions */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <Chip>{courseName}</Chip>
          <Chip tone="free">FREE</Chip>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 22, flexShrink: 0 }}>
          {actions.map((item, i) => {
            const badge = item.count > 0 && (
              <span style={{
                position: "absolute", top: -6, right: -8, minWidth: 17, height: 17, padding: "0 4px",
                borderRadius: 10, background: "var(--red)", border: "1.5px solid var(--app-bg)",
                color: "white", fontSize: 10, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{item.count > 9 ? "9+" : item.count}</span>
            );
            const style: React.CSSProperties = {
              background: "none", border: "none", padding: 0, cursor: "pointer",
              display: "flex", alignItems: "center", position: "relative", color: ICON,
            };
            return item.href ? (
              <a key={i} href={item.href} aria-label={item.label} title={item.label} className="press" style={style}>
                {item.icon}{badge}
              </a>
            ) : (
              <button key={i} onClick={item.onClick} aria-label={item.label} className="press" style={style}>
                {item.icon}{badge}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 2 — course switcher */}
      <button onClick={() => onChangeCourse?.()} className="press" style={{
        display: "flex", alignItems: "center", gap: 7,
        background: "none", border: "none", cursor: "pointer",
        color: "var(--blue)", fontSize: 15, fontWeight: 600,
        padding: "6px 0 0",
      }}>
        Change course
        <svg width="13" height="13" viewBox="0 0 12 12" fill="var(--blue)" aria-hidden="true">
          <polygon points="2,1 11,6 2,11" />
        </svg>
      </button>
    </div>
  );
}
