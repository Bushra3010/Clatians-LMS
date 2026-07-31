"use client";

import type { StudentProfile } from "../StudentApp";

export type ProfileMenuKey = "progress" | "planner" | "notes" | "ai-tutor" | "refer" | "courses" | "browse-courses" | "tests" | "saved" | "payments" | "certificates" | "achievements" | "notifications" | "help" | "settings";

interface ProfileScreenProps {
  profile: StudentProfile;
  onLogout: () => void;
  onClose: () => void;
  onMenu: (key: ProfileMenuKey) => void;
}

export default function ProfileScreen({ profile, onLogout, onClose, onMenu }: ProfileScreenProps) {
  const stats = [
    { val: String(profile.contentCount), label: "Study items" },
    { val: profile.attendancePct === null ? "—" : `${profile.attendancePct}%`, label: "Attendance" },
    { val: String(profile.doubtsAsked), label: "Doubts asked" },
  ];

  const menuItems: { key: ProfileMenuKey; icon: string; label: string; desc: string; color: string }[] = [
    { key: "progress", icon: "📊", label: "My Progress", desc: "Completion, weak areas & scores", color: "#3D2411" },
    { key: "planner", icon: "📋", label: "Study Planner", desc: "Your study to-do list & deadlines", color: "#0891B2" },
    { key: "notes", icon: "📝", label: "My Notes", desc: "Your personal study notebook", color: "#7C3AED" },
    { key: "ai-tutor", icon: "✨", label: "AI Tutor", desc: "Ask any CLAT doubt, any time", color: "#F5A623" },
    { key: "refer", icon: "🎁", label: "Refer a Friend", desc: "Share your code & invite friends", color: "#DB2777" },
    { key: "courses", icon: "📚", label: "My Courses", desc: `${profile.batches.length} enrolled batch${profile.batches.length === 1 ? "" : "es"}`, color: "#059669" },
    { key: "payments", icon: "🧾", label: "Payments & Invoices", desc: "Your fee receipts & history", color: "#3D2411" },
    { key: "tests", icon: "📝", label: "My Tests", desc: "Mock tests & results", color: "#E63946" },
    { key: "saved", icon: "🔖", label: "Saved Content", desc: "Your saved notes & words", color: "#8B5CF6" },
    { key: "certificates", icon: "🎓", label: "Certificates", desc: "Course completion certificates", color: "#15803D" },
    { key: "achievements", icon: "🏆", label: "Achievements", desc: "Badges & leaderboard", color: "#F5A623" },
    { key: "notifications", icon: "🔔", label: "Notifications", desc: "Your alerts", color: "#06B6D4" },
    { key: "help", icon: "❓", label: "Help & Support", desc: "FAQs & contact us", color: "#6B7280" },
    { key: "settings", icon: "⚙️", label: "Settings", desc: "Account & preferences", color: "#374151" },
  ];
  return (
    <div style={{
      position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430, height: "100dvh", background: "#F7F3EA",
      zIndex: 100, overflowY: "auto",
    }}
    className="no-scroll"
    >
      {/* Header */}
      <div style={{
        background: "linear-gradient(160deg, #3D2411 0%, #5C3A00 100%)",
        padding: "50px 20px 30px",
        position: "relative",
      }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16,
            background: "rgba(255,255,255,0.15)", border: "none",
            borderRadius: "50%", width: 36, height: 36,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "white", fontSize: 18,
          }}
        >✕</button>

        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "linear-gradient(135deg, #F5A623, #E8930A)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, border: "3px solid rgba(255,255,255,0.3)",
          }}>👨‍🎓</div>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "white" }}>{profile.name}</h2>
            <p style={{ margin: "2px 0", fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{profile.email}</p>
            <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              {profile.batches.length === 0 && (
                <span style={{ background: "#F5A623", color: "white", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
                  No batch
                </span>
              )}
              {profile.batches.map((b) => (
                <span key={b} style={{ background: "#F5A623", color: "white", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
                  {b}
                </span>
              ))}
              <span style={{ background: "rgba(255,255,255,0.2)", color: "white", fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>
                {profile.batches.length > 0 ? "⭐ ENROLLED" : "FREE PLAN"}
              </span>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{
          display: "flex", gap: 12, marginTop: 20,
          background: "rgba(255,255,255,0.1)",
          borderRadius: 14, padding: "14px 16px",
        }}>
          {stats.map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.15)" : "none" }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#F5A623" }}>{s.val}</p>
              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.7)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade banner — only while the student has no batch yet */}
      {profile.batches.length === 0 && (
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{
            background: "linear-gradient(135deg, #F5A623, #E8930A)",
            borderRadius: 16, padding: "16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "white" }}>Join a batch 🚀</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.9)" }}>
                Unlock live classes, notes &amp; the full course
              </p>
            </div>
            <button onClick={() => onMenu("browse-courses")} className="press" style={{
              background: "white", color: "#E8930A",
              border: "none", borderRadius: 10, padding: "8px 16px",
              fontSize: 12, fontWeight: 800, cursor: "pointer",
            }}>Browse</button>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ background: "white", borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
          {menuItems.map((item, i) => (
            <button key={i} onClick={() => onMenu(item.key)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 14,
              padding: "14px 16px",
              background: "none", border: "none", borderBottom: i < menuItems.length - 1 ? "1px solid #F3F4F6" : "none",
              cursor: "pointer", textAlign: "left",
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: `${item.color}15`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, flexShrink: 0,
              }}>{item.icon}</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1A1A2E" }}>{item.label}</p>
                <p style={{ margin: 0, fontSize: 11, color: "#9CA3AF" }}>{item.desc}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div style={{ padding: "16px 16px 30px" }}>
        <button
          onClick={onLogout}
          style={{
            width: "100%", background: "#FEF2F2", color: "#E63946",
            border: "1.5px solid #FECACA", borderRadius: 14,
            padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer",
          }}
        >
          Logout
        </button>
        <p style={{ textAlign: "center", fontSize: 11, color: "#9CA3AF", marginTop: 12 }}>
          CLATians LMS v1.0.0 · Made with ❤️ for CLAT aspirants
        </p>
      </div>
    </div>
  );
}
