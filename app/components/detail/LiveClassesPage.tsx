"use client";

import { fmtIST } from "../../lib/dates";

export type LiveClassItem = {
  id: string;
  title: string;
  subject: string;
  teacher: string | null;
  startAt: string;
  durationMin: number;
  status: string;
  joinUrl: string;
  attended: boolean;
  recordingUrl?: string;
  notes?: string;
};

export function subjectStyle(subject: string): { emoji: string; bg: string; color: string } {
  const s = (subject || "").toLowerCase();
  if (s.includes("legal")) return { emoji: "⚖️", bg: "linear-gradient(135deg,var(--blue),var(--blue-dark))", color: "var(--blue)" };
  if (s.includes("english") || s.includes("gk")) return { emoji: "📖", bg: "linear-gradient(135deg,var(--cyan),#0E7490)", color: "var(--cyan)" };
  if (s.includes("quant") || s.includes("math")) return { emoji: "🔢", bg: "linear-gradient(135deg,var(--purple),#6D28D9)", color: "var(--purple)" };
  if (s.includes("logic")) return { emoji: "🧩", bg: "linear-gradient(135deg,var(--green),#047857)", color: "var(--green)" };
  return { emoji: "🎓", bg: "linear-gradient(135deg,var(--blue),var(--blue-dark))", color: "var(--gold)" };
}

export function fmtTime(iso: string): string {
  return fmtIST(iso, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(d) - startOf(today)) / 86400000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });
}

function groupByDay(items: LiveClassItem[]): [string, LiveClassItem[]][] {
  const order: string[] = [];
  const map = new Map<string, LiveClassItem[]>();
  for (const it of items) {
    const label = dayLabel(it.startAt);
    if (!map.has(label)) { map.set(label, []); order.push(label); }
    map.get(label)!.push(it);
  }
  return order.map((l) => [l, map.get(l)!]);
}

const BackArrow = ({ onBack }: { onBack: () => void }) => (
  <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)", fontSize: 14, fontWeight: 700, padding: "14px 16px 0" }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
    Live Classes
  </button>
);

export default function LiveClassesPage({
  onBack,
  upcoming,
  past,
  attendancePct,
  onJoin,
  onWatchRecording,
}: {
  onBack: () => void;
  upcoming: LiveClassItem[];
  past: LiveClassItem[];
  attendancePct: number | null;
  onJoin: (id: string) => void;
  onWatchRecording: (cls: LiveClassItem) => void;
}) {
  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%", paddingBottom: 24 }}>
      <BackArrow onBack={onBack} />

      {/* Attendance summary */}
      <div style={{ padding: "14px 14px 0" }}>
        <div style={{
          background: "linear-gradient(135deg,var(--blue-dark) 0%,var(--blue-dark) 100%)",
          borderRadius: 18, padding: "16px 18px", color: "white",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 6px 20px rgba(11,92,255,0.28)",
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.72)" }}>My attendance</p>
            <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700 }}>Live classes</p>
          </div>
          <div style={{ fontSize: 30, fontWeight: 900, color: "var(--gold)" }}>
            {attendancePct === null ? "—" : `${attendancePct}%`}
          </div>
        </div>
      </div>

      {/* Timetable — upcoming & live, grouped by day */}
      <div style={{ padding: "20px 14px 0" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 800, color: "var(--text-primary)" }}>Timetable</h3>
        {upcoming.length === 0 && (
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-disabled)" }}>No classes scheduled for your batch right now.</p>
        )}
        {groupByDay(upcoming).map(([day, dayItems]) => (
        <div key={day} style={{ marginBottom: 6 }}>
          <p style={{ margin: "6px 0 8px", fontSize: 12, fontWeight: 800, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{day}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {dayItems.map((c) => {
            const st = subjectStyle(c.subject);
            const isLive = c.status === "live";
            return (
              <div key={c.id} style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", display: "flex" }}>
                <div style={{ width: 5, background: st.bg, flexShrink: 0 }} />
                <div style={{ flex: 1, padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 50, height: 50, borderRadius: 16, background: st.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{st.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>{c.subject || "Class"}</span>
                      {isLive && (
                        <span style={{ background: "var(--error)", color: "var(--error-text)", fontSize: 9.5, fontWeight: 800, padding: "2px 7px", borderRadius: 20, display: "flex", alignItems: "center", gap: 3 }}>
                          <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: "var(--error-text)" }} />LIVE
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>{c.title}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10.5, color: "var(--text-disabled)" }}>{c.teacher ?? "Faculty"}</span>
                      <span style={{ fontSize: 10, color: "var(--text-disabled)" }}>•</span>
                      <span style={{ fontSize: 10.5, color: "var(--text-disabled)" }}>⏰ {fmtTime(c.startAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onJoin(c.id)}
                    style={{
                      background: isLive ? "linear-gradient(135deg,var(--error-text),#B91C1C)" : "linear-gradient(135deg,var(--blue-dark),var(--blue))",
                      color: "white", border: "none", borderRadius: 12, padding: "8px 14px",
                      fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                    }}
                  >
                    {isLive ? "Join →" : "Remind"}
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        </div>
        ))}
      </div>

      {/* Past & recordings */}
      <div style={{ padding: "22px 14px 0" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 800, color: "var(--text-primary)" }}>Past classes &amp; recordings</h3>
        {past.length === 0 && (
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-disabled)" }}>No past classes yet.</p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {past.map((c) => {
            const st = subjectStyle(c.subject);
            return (
              <div key={c.id} style={{ background: "white", borderRadius: 16, padding: "13px 14px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: st.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, opacity: 0.9 }}>{st.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)" }}>{c.title}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 10.5, color: "var(--text-disabled)" }}>{c.subject} · {fmtTime(c.startAt)}</p>
                </div>
                {c.recordingUrl ? (
                  <button onClick={() => onWatchRecording(c)} style={{ border: "none", cursor: "pointer", background: "var(--info-border)", color: "var(--blue)", borderRadius: 12, padding: "8px 12px", fontSize: 11.5, fontWeight: 800, whiteSpace: "nowrap" }}>
                    ▶ Recording
                  </button>
                ) : (
                  <span style={{ fontSize: 10.5, color: "var(--text-disabled)" }}>No recording</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
