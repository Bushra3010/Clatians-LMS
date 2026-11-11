"use client";

import { useState } from "react";
import { AppIcon } from "../AppIcon";
import { card, gradient, primaryBtn, page, body, ScreenHeader, SectionTitle, IconTile, EmptyState, Pill } from "../ui/kit";

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

  const stat = (v: React.ReactNode, l: string) => (
    <div style={{ background: "rgba(255,255,255,0.14)", borderRadius: 12, padding: "12px 6px", textAlign: "center" }}>
      <p style={{ margin: 0, fontSize: 18, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>{v}</p>
      <p style={{ margin: "2px 0 0", fontSize: 11, opacity: 0.8 }}>{l}</p>
    </div>
  );
  const sessionMeta = (s: MentorSession) => <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "var(--ink-soft)" }}>{s.date} · {s.duration} · {s.subject}</p>;

  return (
    <div style={{ ...page, paddingBottom: 90 }}>
      <ScreenHeader title="Mentorship" />

      <div style={body}>
        {/* Hero */}
        <div style={{ background: gradient, borderRadius: 20, padding: "18px 16px", color: "white", boxShadow: "0 8px 22px rgba(11,92,255,0.22)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
              {mentorPhoto ? <img src={mentorPhoto} alt="" style={{ width: 60, height: 60, borderRadius: 18, objectFit: "cover" }} /> : <AppIcon name="user" size={28} color="white" />}
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Your Mentor</h2>
              <p style={{ margin: "3px 0 0", fontSize: 14, opacity: 0.92 }}>{mentorName || "Personal CLAT Mentor"}</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, opacity: 0.72 }}>Mentoring {studentName || "you"} since enrollment</p>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 16 }}>
            {stat(progress.sessionsCompleted, "Sessions")}
            {stat(`${progress.hoursMentored}h`, "Mentored")}
            {stat(progress.subjectsImproved.length, "Subjects")}
            {stat(<>{progress.rankProgress.from}<AppIcon name="arrowRight" size={13} color="white" strokeWidth={2.6} />{progress.rankProgress.to}</>, "Rank")}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, background: "white", border: "1px solid var(--line)", borderRadius: 14, padding: 4 }}>
          {(["sessions", "progress", "goals"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: "9px 10px", borderRadius: 10, fontSize: 13, fontWeight: 800, border: "none", cursor: "pointer", whiteSpace: "nowrap", background: activeTab === tab ? gradient : "transparent", color: activeTab === tab ? "white" : "var(--ink-soft)", textTransform: "capitalize" }}>{tab}</button>
          ))}
        </div>

        {/* SESSIONS TAB */}
        {activeTab === "sessions" && (
          <>
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <>
                <SectionTitle title="Upcoming Sessions" />
                <div style={{ ...card, padding: "4px 16px" }}>
                  {upcoming.map((s, i) => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < upcoming.length - 1 ? "1px solid var(--line)" : "none" }}>
                      <IconTile icon="calendar" size={40} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{s.title}</p>
                        {sessionMeta(s)}
                      </div>
                      <button onClick={() => onJoinCall?.(s.id)} style={{ ...primaryBtn, padding: "7px 14px", fontSize: 12.5, borderRadius: 10, flexShrink: 0 }}>Join</button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Completed */}
            <SectionTitle title={`Completed Sessions (${completed.length})`} />
            {completed.length === 0 ? <EmptyState icon="video" title="No completed sessions yet." /> : (
              <div style={{ ...card, padding: "4px 16px" }}>
                {completed.map((s, i) => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < completed.length - 1 ? "1px solid var(--line)" : "none" }}>
                    <IconTile icon="check" tone="green" size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{s.title}</p>
                      {sessionMeta(s)}
                      {s.notes && <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--ink-soft)" }}>{s.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setShowBooking(!showBooking)} style={{ ...primaryBtn, width: "100%", marginTop: 4 }}>
              {!showBooking && <AppIcon name="calendar" size={16} color="white" strokeWidth={2.4} />}
              {showBooking ? "Cancel" : "Book Next Session"}
            </button>
            {showBooking && (
              <div style={{ ...card, padding: "16px" }}>
                <p style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>Available Slots</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {["Mon 4 PM", "Wed 6 PM", "Fri 5 PM", "Sat 11 AM"].map((slot, i) => (
                    <button key={i} onClick={onBookSession} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 12, border: "1px solid var(--line-strong)", background: "white", cursor: "pointer", width: "100%" }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", display: "flex", alignItems: "center", gap: 8 }}>
                        <AppIcon name="clock" size={15} color="var(--ink-soft)" />
                        {slot}
                      </span>
                      <span style={{ fontSize: 12.5, color: "var(--blue)", fontWeight: 800, display: "flex", alignItems: "center", gap: 4 }}>
                        Book <AppIcon name="arrowRight" size={14} color="var(--blue)" strokeWidth={2.4} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* PROGRESS TAB */}
        {activeTab === "progress" && (
          <>
            <SectionTitle title="Improvement Tracker" />
            <div style={{ ...card, padding: "4px 16px" }}>
              {progress.subjectsImproved.map((subj, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderBottom: i < progress.subjectsImproved.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <IconTile icon="chart" tone="green" size={32} />
                  <span style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: 600, flex: 1 }}>{subj}</span>
                  <Pill tone="green">Improving</Pill>
                </div>
              ))}
            </div>
            <SectionTitle title="Rank Progress" />
            <div style={{ ...card, padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "8px 0" }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--ink-soft)" }}>{progress.rankProgress.from}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--ink-soft)" }}>Start</p>
                </div>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: "var(--line)", position: "relative" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: "100%", borderRadius: 2, background: gradient }} />
                  <div style={{ position: "absolute", left: "20%", top: -8 }}><AppIcon name="flag" size={16} color="var(--blue)" fill="white" /></div>
                  <div style={{ position: "absolute", left: "80%", top: -8 }}><AppIcon name="trophy" size={16} color="var(--gold-dark)" fill="white" /></div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--blue)" }}>{progress.rankProgress.to}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--ink-soft)" }}>Target</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* GOALS TAB */}
        {activeTab === "goals" && (
          <>
            <SectionTitle title="Your Goals" />
            <div style={{ ...card, padding: "4px 16px" }}>
              {goals.map((g, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderBottom: i < goals.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <IconTile icon="target" tone="purple" size={32} />
                  <span style={{ fontSize: 13.5, color: "var(--ink)", flex: 1 }}>{g}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
