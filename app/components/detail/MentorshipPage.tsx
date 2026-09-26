"use client";

import { useState, useEffect } from "react";
import { BookOpen, Award, TrendingUp, Calendar, Target } from "../icons";

interface MentorSession {
  id: string;
  title: string;
  date: string;
  duration: string;
  subject: string;
  status: "completed" | "upcoming" | "rescheduled";
  notes?: string;
}

interface MentorshipProgress {
  sessionsCompleted: number;
  hoursMentored: number;
  subjectsImproved: string[];
  rankProgress: { from: number; to: number };
}

interface MentorshipPageProps {
  mentorName?: string;
  mentorPhoto?: string;
  studentName?: string;
  sessions: MentorSession[];
  progress: MentorshipProgress;
  goals: string[];
  onBookSession?: () => void;
  onJoinCall?: (sessionId: string) => void;
}

export default function MentorshipPage({ mentorName, mentorPhoto, studentName, sessions, progress, goals, onBookSession, onJoinCall }: MentorshipPageProps) {
  const [activeTab, setActiveTab] = useState<"sessions" | "progress" | "goals">("sessions");
  const [showBooking, setShowBooking] = useState(false);

  const upcoming = sessions.filter(s => s.status === "upcoming");
  const completed = sessions.filter(s => s.status === "completed");

  return (
    <div style={{ background: "var(--app-bg)", paddingBottom: 90 }}>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg,var(--purple),var(--purple-400))", padding: "24px 16px", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
            {mentorPhoto ? <img src={mentorPhoto} style={{ width: 64, height: 64, borderRadius: 20, objectFit: "cover" }} /> : "👨‍🏫"}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Your Mentor</h2>
            <p style={{ margin: "3px 0 0", fontSize: 14, opacity: 0.9 }}>{mentorName || "Personal CLAT Mentor"}</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, opacity: 0.7 }}>Mentoring {studentName || "you"} since enrollment</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 18 }}>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "12px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{progress.sessionsCompleted}</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, opacity: 0.8 }}>Sessions</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "12px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{progress.hoursMentored}h</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, opacity: 0.8 }}>Mentored</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "12px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{progress.subjectsImproved.length}</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, opacity: 0.8 }}>Subjects</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "12px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{progress.rankProgress.from} → {progress.rankProgress.to}</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, opacity: 0.8 }}>Rank</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, padding: "12px 16px", background: "white", borderBottom: "1px solid var(--surface-dim)" }}>
        {(["sessions", "progress", "goals"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "8px 16px", borderRadius: 22, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", whiteSpace: "nowrap", background: activeTab === tab ? "var(--purple)" : "var(--surface-dim)", color: activeTab === tab ? "white" : "var(--text-secondary)", textTransform: "capitalize" }}>{tab}</button>
        ))}
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        {/* SESSIONS TAB */}
        {activeTab === "sessions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div style={{ background: "white", borderRadius: 16, padding: "16px 18px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginBottom: 10 }}>
                <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "var(--text-secondary)" }}>Upcoming Sessions</h3>
                {upcoming.map((s) => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--surface-dim)" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--purple-tint)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📅</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--ink-primary)" }}>{s.title}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-disabled)" }}>{s.date} · {s.duration} · {s.subject}</p>
                    </div>
                    <button onClick={() => onJoinCall?.(s.id)} style={{ background: "var(--purple)", color: "white", border: "none", borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Join</button>
                  </div>
                ))}
              </div>
            )}

            {/* Completed */}
            <div style={{ background: "white", borderRadius: 16, padding: "16px 18px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
              <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "var(--text-secondary)" }}>Completed Sessions ({completed.length})</h3>
              {completed.length === 0 ? <p style={{ margin: 0, fontSize: 13, color: "var(--text-disabled)" }}>No completed sessions yet.</p> : completed.map((s) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--surface-dim)" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>✓</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--success-text)" }}>{s.title}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-disabled)" }}>{s.date} · {s.duration} · {s.subject}</p>
                    {s.notes && <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-muted)" }}>{s.notes}</p>}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setShowBooking(!showBooking)} style={{ background: "var(--purple)", color: "white", border: "none", borderRadius: 16, padding: "14px", fontSize: 14, fontWeight: 700, cursor: "pointer", width: "100%", marginTop: 4 }}>
              {showBooking ? "Cancel" : "📅 Book Next Session"}
            </button>
            {showBooking && (
              <div style={{ background: "white", borderRadius: 16, padding: "16px 18px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700 }}>Available Slots</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {["Mon 4 PM", "Wed 6 PM", "Fri 5 PM", "Sat 11 AM"].map((slot, i) => (
                    <button key={i} onClick={onBookSession} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 12, border: "1px solid var(--border)", background: "white", cursor: "pointer", width: "100%" }}>
                      <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{slot}</span>
                      <span style={{ fontSize: 12, color: "var(--purple)", fontWeight: 600 }}>Book →</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PROGRESS TAB */}
        {activeTab === "progress" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: "white", borderRadius: 16, padding: "16px 18px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
              <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "var(--text-secondary)" }}>Improvement Tracker</h3>
              {progress.subjectsImproved.map((subj, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < progress.subjectsImproved.length - 1 ? "1px solid var(--surface-dim)" : "none" }}>
                  <TrendingUp size={16} style={{ color: "var(--success-text)" }} />
                  <span style={{ fontSize: 13, color: "var(--text-secondary)", flex: 1 }}>{subj}</span>
                  <span style={{ fontSize: 11, color: "var(--success-text)", fontWeight: 600 }}>↑ Improving</span>
                </div>
              ))}
            </div>
            <div style={{ background: "white", borderRadius: 16, padding: "16px 18px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
              <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "var(--text-secondary)" }}>Rank Progress</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "12px 0" }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--text-muted)" }}>{progress.rankProgress.from}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-disabled)" }}>Start</p>
                </div>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: "var(--border)", position: "relative" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: "100%", borderRadius: 2, background: "linear-gradient(90deg,var(--purple),#A78BFA)" }} />
                  <div style={{ position: "absolute", left: "20%", top: -6, fontSize: 14 }}>🏁</div>
                  <div style={{ position: "absolute", left: "80%", top: -6, fontSize: 14 }}>🏆</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--purple)" }}>{progress.rankProgress.to}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-disabled)" }}>Target</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GOALS TAB */}
        {activeTab === "goals" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: "white", borderRadius: 16, padding: "16px 18px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
              <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "var(--text-secondary)" }}>Your Goals</h3>
              {goals.map((g, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < goals.length - 1 ? "1px solid var(--surface-dim)" : "none" }}>
                  <Target size={16} style={{ color: "var(--purple)" }} />
                  <span style={{ fontSize: 13, color: "var(--text-secondary)", flex: 1 }}>{g}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
