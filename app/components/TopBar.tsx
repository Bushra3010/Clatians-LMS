"use client";

interface TopBarProps {
  /** Tapping the CLATians logo goes home. */
  onLogoClick?: () => void;
  onBellClick?: () => void;
  unreadCount?: number;
  /** Opens the NLU College Predictor. */
  onPredictorClick?: () => void;
}

const ICON = "var(--text-secondary)";

/** Height of the floating bar; the page scrolls under it. */
export const TOP_BAR_H = 64;

/** College Predictor — a graduation cap. */
const PredictorSvg = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={ICON} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 9 12 4.5 21.5 9 12 13.5z" />
    <path d="M6.5 11v4.6c0 1.4 2.5 2.9 5.5 2.9s5.5-1.5 5.5-2.9V11" />
    <path d="M21.5 9v5" />
  </svg>
);

const BellSvg = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={ICON} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

export default function TopBar({ onLogoClick, onBellClick, unreadCount = 0, onPredictorClick }: TopBarProps) {
  const actions = [
    { icon: <PredictorSvg />, count: 0, href: undefined, onClick: onPredictorClick, label: "College Predictor" },
    { icon: <BellSvg />, count: unreadCount, href: undefined, onClick: onBellClick, label: "Notifications" },
  ];

  return (
    // Floats over the page: frosted, so content shows through as it scrolls under.
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, height: TOP_BAR_H, boxSizing: "border-box",
      background: "color-mix(in srgb, var(--app-bg) 70%, transparent)",
      backdropFilter: "blur(14px) saturate(1.4)", WebkitBackdropFilter: "blur(14px) saturate(1.4)",
      padding: "11px 16px", zIndex: 40,
    }}>
      {/* Logo + actions */}
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

    </div>
  );
}
