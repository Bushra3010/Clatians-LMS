"use client";

import { fmtIST } from "../../lib/dates";
import { AppIcon, type IconName } from "../AppIcon";
import { ScreenHeader, SectionTitle, EmptyState, card, page, smallBtn, gradient } from "../ui/kit";

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

/**
 * A subject's colours and icon. `emoji` is kept for older callers but is never
 * rendered here — screens show `icon` (an AppIcon) instead.
 */
export function subjectStyle(subject: string): { emoji: string; bg: string; color: string; icon: IconName } {
  const s = (subject || "").toLowerCase();
  if (s.includes("legal")) return { emoji: "⚖️", icon: "scale", bg: "linear-gradient(135deg,var(--blue),var(--blue-dark))", color: "var(--blue)" };
  if (s.includes("english") || s.includes("gk")) return { emoji: "📖", icon: "book", bg: "linear-gradient(135deg,var(--cyan),#0E7490)", color: "var(--cyan)" };
  if (s.includes("quant") || s.includes("math")) return { emoji: "🔢", icon: "calculator", bg: "linear-gradient(135deg,var(--purple),#6D28D9)", color: "var(--purple)" };
  if (s.includes("logic")) return { emoji: "🧩", icon: "puzzle", bg: "linear-gradient(135deg,var(--green),#047857)", color: "var(--green)" };
  return { emoji: "🎓", icon: "graduation", bg: "linear-gradient(135deg,var(--blue),var(--blue-dark))", color: "var(--gold)" };
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
    <div style={page}>
      <ScreenHeader title="Live Classes" onBack={onBack} />

      <div style={{ padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Attendance summary */}
        <div style={{
          background: gradient, borderRadius: 18, padding: "16px 18px", color: "white",
          display: "flex", alignItems: "center", gap: 12,
          boxShadow: "0 8px 22px rgba(11,92,255,0.25)",
        }}>
          <span style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AppIcon name="checkCircle" size={21} color="white" />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255,255,255,0.78)" }}>My attendance</p>
            <p style={{ margin: "2px 0 0", fontSize: 15, fontWeight: 800 }}>Live classes</p>
          </div>
          <div style={{ fontSize: 30, fontWeight: 900, color: "var(--gold)" }}>
            {attendancePct === null ? "—" : `${attendancePct}%`}
          </div>
        </div>

        {/* Timetable — upcoming & live, grouped by day */}
        <SectionTitle title="Timetable" />
        {upcoming.length === 0 && (
          <EmptyState icon="calendar" title="No classes scheduled for your batch right now." />
        )}
        {groupByDay(upcoming).map(([day, dayItems]) => (
          <div key={day}>
            <p style={{ margin: "2px 2px 8px", fontSize: 12, fontWeight: 800, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{day}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {dayItems.map((c) => {
                const st = subjectStyle(c.subject);
                const isLive = c.status === "live";
                return (
                  <div key={c.id} style={{ ...card, padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ width: 46, height: 46, borderRadius: 14, background: st.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <AppIcon name={st.icon} size={21} color="white" />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>{c.subject || "Class"}</span>
                        {isLive && (
                          <span style={{ background: "var(--error)", color: "var(--error-text)", fontSize: 9.5, fontWeight: 800, padding: "2px 7px", borderRadius: 20, display: "flex", alignItems: "center", gap: 3 }}>
                            <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: "var(--error-text)" }} />LIVE
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-soft)", fontWeight: 500 }}>{c.title}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap", fontSize: 11, color: "var(--ink-mute)" }}>
                        <span>{c.teacher ?? "Faculty"}</span>
                        <span>•</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <AppIcon name="clock" size={12} color="var(--ink-mute)" />
                          {fmtTime(c.startAt)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onJoin(c.id)}
                      style={isLive
                        ? { ...smallBtn, background: "linear-gradient(135deg,var(--error-text),#B91C1C)", color: "white", whiteSpace: "nowrap" }
                        : { ...smallBtn, whiteSpace: "nowrap" }}
                    >
                      {isLive ? <>Join <AppIcon name="arrowRight" size={14} /></> : <><AppIcon name="bell" size={14} /> Remind</>}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Past & recordings */}
        <SectionTitle title="Past classes & recordings" />
        {past.length === 0 && (
          <EmptyState icon="video" title="No past classes yet." />
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {past.map((c) => {
            const st = subjectStyle(c.subject);
            return (
              <div key={c.id} style={{ ...card, padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 42, height: 42, borderRadius: 13, background: st.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: 0.9 }}>
                  <AppIcon name={st.icon} size={19} color="white" />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>{c.title}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--ink-mute)" }}>{c.subject} · {fmtTime(c.startAt)}</p>
                </div>
                {c.recordingUrl ? (
                  <button onClick={() => onWatchRecording(c)} style={{ ...smallBtn, whiteSpace: "nowrap" }}>
                    <AppIcon name="play" size={13} /> Recording
                  </button>
                ) : (
                  <span style={{ fontSize: 11, color: "var(--ink-mute)" }}>No recording</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
