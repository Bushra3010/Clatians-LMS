"use client";

import type { StudentProfile } from "../StudentApp";
import { AppIcon, type IconName } from "./AppIcon";
import { card, ScreenHeader, IconTile, HeroCard, heroStrip, SectionTitle, type Tone } from "./ui/kit";

export type ProfileMenuKey = "progress" | "planner" | "notes" | "ai-tutor" | "refer" | "courses" | "browse-courses" | "tests" | "saved" | "payments" | "certificates" | "achievements" | "notifications" | "help" | "settings";

interface ProfileScreenProps {
  profile: StudentProfile;
  onLogout: () => void;
  onClose: () => void;
  onMenu: (key: ProfileMenuKey) => void;
}

/* One line icon per menu row, in a tinted tile like Home's. */
const ICONS: Record<ProfileMenuKey, { icon: IconName; tone: Tone }> = {
  progress: { icon: "chart", tone: "blue" },
  planner: { icon: "calendar", tone: "purple" },
  notes: { icon: "file", tone: "teal" },
  "ai-tutor": { icon: "bolt", tone: "gold" },
  refer: { icon: "gift", tone: "red" },
  courses: { icon: "book", tone: "blue" },
  "browse-courses": { icon: "book", tone: "blue" },
  tests: { icon: "clipboard", tone: "purple" },
  saved: { icon: "bookmark", tone: "gold" },
  payments: { icon: "receipt", tone: "green" },
  certificates: { icon: "graduation", tone: "blue" },
  achievements: { icon: "trophy", tone: "gold" },
  notifications: { icon: "bell", tone: "teal" },
  help: { icon: "help", tone: "grey" },
  settings: { icon: "settings", tone: "grey" },
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
      <ScreenHeader title="Your Profile" onBack={onClose} />

      {/* Identity — Home's blue card with the stats strip */}
      <div style={{ padding: "8px 16px 0" }}>
        <HeroCard>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ width: 58, height: 58, borderRadius: 18, background: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 14px rgba(4,36,107,0.25)", fontSize: 20, fontWeight: 800, color: "var(--blue)" }}>
              {profile.name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || <AppIcon name="user" size={26} color="var(--blue)" />}
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em" }}>{profile.name}</p>
              <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.72)", wordBreak: "break-word" }}>{profile.email}</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
            <span style={{ flexShrink: 0, background: enrolled ? "#CFFB6B" : "rgba(255,255,255,0.16)", color: enrolled ? "var(--blue-dark)" : "white", fontSize: 10.5, fontWeight: 800, padding: "4px 9px", borderRadius: 8, letterSpacing: "0.02em" }}>
              {enrolled ? "ENROLLED" : "FREE PLAN"}
            </span>
            <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.88)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {enrolled ? profile.batches.join(" · ") : "No batch yet"}
            </span>
            <button onClick={() => onMenu("browse-courses")} className="press" style={{
              flexShrink: 0, background: "linear-gradient(135deg,var(--gold),var(--gold-dark))", border: "none", borderRadius: 10, padding: "7px 12px", cursor: "pointer",
              color: "var(--blue-dark)", fontSize: 12, fontWeight: 800,
            }}>Change</button>
          </div>

          <div style={{ ...heroStrip, display: "flex", padding: "10px 4px", marginTop: 14 }}>
            {stats.map((x, i) => (
              <div key={x.label} style={{ flex: 1, textAlign: "center", borderLeft: i ? "1px solid rgba(255,255,255,0.16)" : "none" }}>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--gold)", lineHeight: 1.2 }}>{x.val}</p>
                <p style={{ margin: "1px 0 0", fontSize: 10.5, color: "rgba(255,255,255,0.68)" }}>{x.label}</p>
              </div>
            ))}
          </div>
        </HeroCard>
      </div>

      <div style={{ padding: "18px 16px 10px" }}><SectionTitle kicker="Everything in one place" title="Your account" /></div>

      {/* Menu — one card, rows split by hairlines */}
      <div style={{ padding: "0 16px" }}>
        <div style={{ ...card, padding: "4px 14px" }}>
          {MENU.map((item, i) => (
            <button key={item.key} onClick={() => onMenu(item.key)} className="press" style={{
              width: "100%", display: "flex", alignItems: "center", gap: 14,
              padding: "11px 0",
              background: "none", border: "none",
              borderTop: i === 0 ? "none" : "1px solid var(--line)",
              cursor: "pointer", textAlign: "left",
            }}>
              <IconTile icon={ICONS[item.key].icon} tone={ICONS[item.key].tone} size={36} />
              <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600, color: "var(--ink)" }}>{item.label}</span>
              <AppIcon name="chevronRight" size={17} color="var(--text-muted)" />
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div style={{ padding: "18px 16px 34px" }}>
        <button onClick={onLogout} className="press" style={{
          width: "100%", background: "var(--error)", color: "var(--error-text)",
          border: "none", borderRadius: 14,
          padding: "14px", fontSize: 14.5, fontWeight: 800, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <AppIcon name="logout" size={18} />
          Logout
        </button>
        <p style={{ textAlign: "center", fontSize: 11.5, color: "var(--text-muted)", marginTop: 14 }}>
          CLATians LMS v1.0.0
        </p>
      </div>
    </div>
  );
}
