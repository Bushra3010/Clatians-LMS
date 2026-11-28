"use client";

interface TopBarProps {
  /**
   * The student's chosen or purchased course. Null hides the course chips —
   * the bar then only invites them to pick one. FREE marks a course that is
   * chosen but not bought.
   */
  course?: { name: string; purchased: boolean } | null;
  /** Tapping the CLATians logo (shown until a course is picked) goes home. */
  onLogoClick?: () => void;
  onBellClick?: () => void;
  unreadCount?: number;
  onChangeCourse?: () => void;
}

const ICON = "var(--text-secondary)";

const TutorSvg = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={ICON} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {/* A bolt, not the four-point sparkle every AI product uses. */}
    <path d="M13 2.5L4.5 13.5h6.5l-1 8 8.5-11h-6.5l1-8z" />
  </svg>
);

const BellSvg = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={ICON} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

export default function TopBar({ course = null, onLogoClick, onBellClick, unreadCount = 0, onChangeCourse }: TopBarProps) {
  const actions = [
    { icon: <TutorSvg />, count: 0, href: "/tutor", onClick: undefined, label: "AI Tutor" },
    { icon: <BellSvg />, count: unreadCount, href: undefined, onClick: onBellClick, label: "Notifications" },
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
        {/* Brand — always the CLATians logo; the course lives on the Courses tab. */}
        <button onClick={() => onLogoClick?.()} aria-label="CLATians home" className="press" style={{
          display: "flex", alignItems: "center", minWidth: 0,
          background: "none", border: "none", cursor: "pointer", padding: 0,
        }}>
          {/* Tightly cropped copy — the full logo file is mostly empty margin. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/clatians-logo-tight.png" alt="CLATians — Learn | Practice | Achieve" style={{ height: 42, width: "auto", display: "block" }} />
        </button>

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

      {/* Row 2 — a quiet course switcher, once a course is picked */}
      {course && <button onClick={() => onChangeCourse?.()} className="press" style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: "none", border: "none", cursor: "pointer",
        color: "var(--blue)", fontSize: 13, fontWeight: 700,
        padding: "8px 0 0",
      }}>
        Change course
        <svg width="11" height="11" viewBox="0 0 12 12" fill="var(--blue)" aria-hidden="true">
          <polygon points="2,1 11,6 2,11" />
        </svg>
      </button>}
    </div>
  );
}
