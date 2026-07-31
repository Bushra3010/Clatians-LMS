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

const UserSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

export default function TopBar({ courseName = "CLAT 2026", onProfileClick, onLogoClick, onBellClick, unreadCount = 0, onChangeCourse }: TopBarProps) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.94)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      padding: "10px 16px 9px",
      borderBottom: "1px solid #EFE9DD",
      zIndex: 40,
      flexShrink: 0,
    }}>
      {/* Row 1 — Logo + actions */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div onClick={onLogoClick} style={{ cursor: onLogoClick ? "pointer" : "default" }} className="press">
          <ClatLogo size="sm" showTagline={false} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a href="/tutor" aria-label="AI Tutor" title="AI Tutor" className="press" style={{
            display: "flex", alignItems: "center", gap: 5, textDecoration: "none",
            height: 34, padding: "0 12px", borderRadius: 17,
            background: "linear-gradient(135deg, #3D2411, #5C3A00)", color: "#F7EAD2",
            fontSize: 12, fontWeight: 700,
            boxShadow: "0 2px 8px rgba(61,36,17,0.25)",
          }}>
            <span style={{ fontSize: 13 }}>✨</span>AI Tutor
          </a>
          {[
            { icon: <BellSvg />, count: unreadCount, onClick: onBellClick, label: "Notifications" },
            { icon: <UserSvg />, count: 0, onClick: onProfileClick, label: "Profile" },
          ].map((item, i) => (
            <button key={i} onClick={item.onClick} aria-label={item.label} className="press" style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "#F6F2EA", border: "1px solid #ECE5D6",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", position: "relative",
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

      {/* Row 2 — batch context */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <span style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#FBF6EC", border: "1px solid #F0E3C8", borderRadius: 16,
            padding: "4px 12px", fontSize: 12, fontWeight: 700, color: "#6B4A28",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            🎯 {courseName}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#A8A29E" }}>Class 12th</span>
        </div>
        <button onClick={() => onChangeCourse?.()} className="press" style={{ display: "flex", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: "#A06F08", fontSize: 12, fontWeight: 700, padding: "4px 0 4px 8px", flexShrink: 0 }}>
          Change
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A06F08" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>
    </div>
  );
}
