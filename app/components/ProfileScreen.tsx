"use client";

import type { StudentProfile } from "../StudentApp";

export type ProfileMenuKey = "progress" | "planner" | "notes" | "ai-tutor" | "refer" | "courses" | "browse-courses" | "tests" | "saved" | "payments" | "certificates" | "achievements" | "notifications" | "help" | "settings";

interface ProfileScreenProps {
  profile: StudentProfile;
  onLogout: () => void;
  onClose: () => void;
  onMenu: (key: ProfileMenuKey) => void;
}

/* Monochrome line icons — one visual weight down the whole list. */
const S = { fill: "none", stroke: "var(--text-muted)", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const Icon = ({ d, extra }: { d: string; extra?: React.ReactNode }) => (
  <svg width="23" height="23" viewBox="0 0 24 24" {...S}>
    <path d={d} />
    {extra}
  </svg>
);

const ICONS: Record<ProfileMenuKey, React.ReactElement> = {
  progress: <Icon d="M3 20h18M7 20V11M12 20V5M17 20v-6" />,
  planner: <Icon d="M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />,
  notes: <Icon d="M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h4" />,
  "ai-tutor": <Icon d="M13 2.5L4.5 13.5h6.5l-1 8 8.5-11h-6.5l1-8z" />,
  refer: <Icon d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7C10.5 4 6 4 6 6.5S10 8 12 7zM12 7c1.5-3 6-3 6-.5S14 8 12 7z" />,
  courses: <Icon d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 1 6.5 18H19v3H6.5" />,
  "browse-courses": <Icon d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z" />,
  tests: <Icon d="M9 3h6v3H9zM7 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1M8.5 13l2.2 2.2L16 10" />,
  saved: <Icon d="M6 3h12v18l-6-4.5L6 21z" />,
  payments: <Icon d="M5 3h14v18l-2.3-1.6L14.4 21l-2.4-1.6L9.6 21l-2.3-1.6L5 21zM9 8h6M9 12h6" />,
  certificates: <Icon d="M12 3l9 4.5-9 4.5-9-4.5L12 3zM7 10v4c0 1.7 2.2 3 5 3s5-1.3 5-3v-4M20 8v6" />,
  achievements: <Icon d="M7 4h10v5a5 5 0 0 1-10 0zM7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3M9 20h6M12 14v6" />,
  notifications: <Icon d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />,
  help: <Icon d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.6 9.2a2.5 2.5 0 0 1 4.9.6c0 1.7-2.5 2-2.5 3.7" extra={<circle cx="12" cy="17" r="1" fill="var(--text-muted)" stroke="none" />} />,
  settings: <Icon d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.5 15h-.3a2 2 0 1 1 0-4h.2A1.6 1.6 0 0 0 4.5 8.2l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V4a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.8 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.3a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1z" />,
};

const MENU: { key: ProfileMenuKey; label: string }[] = [
  { key: "progress", label: "My Progress" },
  { key: "planner", label: "Study Planner" },
  { key: "notes", label: "My Notes" },
  { key: "ai-tutor", label: "AI Tutor" },
  { key: "courses", label: "My Courses" },
  { key: "tests", label: "My Tests" },
  { key: "saved", label: "Saved Content" },
  { key: "payments", label: "Payments & Invoices" },
  { key: "certificates", label: "Certificates" },
  { key: "achievements", label: "Achievements" },
  { key: "refer", label: "Refer a Friend" },
  { key: "notifications", label: "Notifications" },
  { key: "help", label: "Help & Support" },
  { key: "settings", label: "Settings" },
];

export default function ProfileScreen({ profile, onLogout, onClose, onMenu }: ProfileScreenProps) {
  const enrolled = profile.batches.length > 0;
  const stats = [
    { val: String(profile.contentCount), label: "Study items" },
    { val: profile.attendancePct === null ? "—" : `${profile.attendancePct}%`, label: "Attendance" },
    { val: String(profile.doubtsAsked), label: "Doubts asked" },
  ];

  return (
    <div style={{
      position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430, height: "100dvh", background: "var(--app-bg)",
      zIndex: 100, overflowY: "auto",
    }}
    className="no-scroll"
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 16px 14px" }}>
        <button onClick={onClose} aria-label="Back" className="press" style={{
          background: "none", border: "none", padding: 0, cursor: "pointer",
          display: "flex", alignItems: "center",
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" {...S} strokeWidth={1.9}>
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
        </button>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>Your Profile</h2>
      </div>

      {/* Identity card */}
      <div style={{ padding: "0 16px" }}>
        <div style={{
          background: "var(--surface)", borderRadius: 18,
          padding: "18px 16px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 19, fontWeight: 700, color: "var(--text-primary)" }}>{profile.name}</p>
              <p style={{ margin: "3px 0 0", fontSize: 13.5, color: "var(--text-muted)", wordBreak: "break-word" }}>{profile.email}</p>
            </div>
            <svg width="62" height="62" viewBox="0 0 24 24" {...S} strokeWidth={1.2} style={{ flexShrink: 0, stroke: "var(--text-muted)" }}>
              <circle cx="12" cy="12" r="10.5" />
              <circle cx="12" cy="9.5" r="3.4" />
              <path d="M5.5 19.6a7 7 0 0 1 13 0" />
            </svg>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13.5, color: "var(--text-secondary)" }}>
              {enrolled ? profile.batches.join(" | ") : "No batch yet"}
            </span>
            <button onClick={() => onMenu("browse-courses")} style={{
              background: "none", border: "none", padding: 0, cursor: "pointer",
              color: "var(--blue)", fontSize: 13, fontWeight: 600, letterSpacing: "0.03em",
            }}>CHANGE</button>
          </div>

          <span style={{
            display: "inline-block", marginTop: 12,
            background: enrolled ? "var(--green)" : "var(--green-dark)",
            color: "white", fontSize: 11, fontWeight: 600,
            padding: "5px 11px", borderRadius: 6, letterSpacing: "0.02em",
          }}>{enrolled ? "ENROLLED" : "FREE PLAN"}</span>
        </div>
      </div>

      {/* Snapshot strip */}
      <div style={{ padding: "14px 16px 0" }}>
        <div style={{
          background: "var(--surface)", borderRadius: 18,
          padding: "14px 16px", display: "flex", boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        }}>
          {stats.map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? "1px solid var(--border)" : "none" }}>
              <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>{s.val}</p>
              <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "var(--text-muted)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Menu — flat rows on the canvas, split by hairlines */}
      <div style={{ padding: "22px 16px 0" }}>
        {MENU.map((item, i) => (
          <button key={item.key} onClick={() => onMenu(item.key)} className="press" style={{
            width: "100%", display: "flex", alignItems: "center", gap: 16,
            padding: "17px 2px",
            background: "none", border: "none",
            borderTop: i === 0 ? "none" : "1px solid var(--line)",
            cursor: "pointer", textAlign: "left",
          }}>
            <span style={{ display: "flex", flexShrink: 0 }}>{ICONS[item.key]}</span>
            <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text-secondary)" }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Logout */}
      <div style={{ padding: "26px 16px 34px" }}>
        <button onClick={onLogout} className="press" style={{
          width: "100%", background: "var(--surface)", color: "var(--red)",
          border: "none", borderRadius: 16,
          padding: "15px", fontSize: 15, fontWeight: 600, cursor: "pointer",
        }}>
          Logout
        </button>
        <p style={{ textAlign: "center", fontSize: 11.5, color: "var(--text-disabled)", marginTop: 14 }}>
          CLATians LMS v1.0.0
        </p>
      </div>
    </div>
  );
}
