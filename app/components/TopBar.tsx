"use client";

import ClatLogo from "./ClatLogo";

interface TopBarProps {
  courseName?: string;
  onProfileClick?: () => void;
  onLogoClick?: () => void;
  onBellClick?: () => void;
  unreadCount?: number;
  onChangeCourse?: () => void;
}

const BellSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const PhoneSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.44 2 2 0 0 1 3.59 1.25h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.29 6.29l1.27-.85a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const UserSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

export default function TopBar({ courseName = "CLAT 2026", onProfileClick, onLogoClick, onBellClick, unreadCount = 0, onChangeCourse }: TopBarProps) {
  return (
    <div style={{
      background: "white",
      padding: "10px 16px 10px",
      borderBottom: "1px solid #F0F0F5",
      position: "sticky",
      top: 0,
      zIndex: 40,
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    }}>
      {/* Row 1 — Logo + Icons */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div onClick={onLogoClick} style={{ cursor: onLogoClick ? "pointer" : "default" }}>
          <ClatLogo size="sm" showTagline={false} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a href="/tutor" aria-label="AI Tutor" title="AI Tutor" style={{
            display: "flex", alignItems: "center", gap: 6, textDecoration: "none",
            height: 38, padding: "0 12px", borderRadius: 19,
            background: "linear-gradient(135deg, #3D2411, #6B4A28)", color: "#F7EAD2",
            fontSize: 12.5, fontWeight: 700, border: "1.5px solid #C8860A",
            boxShadow: "0 1px 6px rgba(61,36,17,0.18)",
          }}>
            <span style={{ fontSize: 14 }}>✨</span>AI Tutor
          </a>
          {[
            { icon: <PhoneSvg />, count: 0, onClick: undefined as (() => void) | undefined },
            { icon: <BellSvg />, count: unreadCount, onClick: onBellClick },
            { icon: <UserSvg />, count: 0, onClick: onProfileClick },
          ].map((item, i) => (
            <button key={i} onClick={item.onClick} style={{
              width: 38, height: 38, borderRadius: "50%",
              background: "#F9FAFB", border: "1.5px solid #EEEFF5",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", position: "relative",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
              {item.icon}
              {item.count > 0 && (
                <span style={{
                  position: "absolute", top: -3, right: -3, minWidth: 16, height: 16, padding: "0 4px",
                  borderRadius: 10, background: "#E63946", border: "1.5px solid white",
                  color: "white", fontSize: 9.5, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{item.count > 9 ? "9+" : item.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2 — Course Chips */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ background: "#F3F4F6", borderRadius: 20, padding: "4px 11px", fontSize: 11.5, fontWeight: 600, color: "#374151" }}>12th</span>
          <span style={{ background: "#FEF3E2", borderRadius: 20, padding: "4px 11px", fontSize: 11.5, fontWeight: 700, color: "#92400E", border: "1px solid #FDE68A" }}>{courseName}</span>
          <span style={{ background: "#DCFCE7", borderRadius: 20, padding: "4px 11px", fontSize: 11.5, fontWeight: 800, color: "#15803D", border: "1px solid #BBF7D0" }}>FREE</span>
        </div>
        <button onClick={() => onChangeCourse?.()} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", color: "#C8860A", fontSize: 12.5, fontWeight: 700, padding: "4px 2px" }}>
          Change course
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#C8860A"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </button>
      </div>
    </div>
  );
}
