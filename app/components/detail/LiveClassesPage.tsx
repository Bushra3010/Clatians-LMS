"use client";

import { useState } from "react";
import { fmtIST } from "../../lib/dates";
import { AppIcon, type IconName } from "../AppIcon";
import { heroSurface, ScreenHeader, Segmented, EmptyState, card, page, smallBtn } from "../ui/kit";

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
  if (diffDays === 0) return "Today";
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
  title = "Live Classes",
  subtitle,
}: {
  onBack: () => void;
  upcoming: LiveClassItem[];
  past: LiveClassItem[];
  /** null hides the attendance card — Free Resources has no batch to measure. */
  attendancePct: number | null;
  onJoin: (id: string) => void;
  onWatchRecording: (cls: LiveClassItem) => void;
  title?: string;
  /** Shown under the title — Free Resources passes the subject being listed. */
  subtitle?: string;
}) {
  // A scheduled class whose time has fully passed was never started — it is
  // finished, not upcoming, so it moves to Completed.
  const [now] = useState(() => Date.now());
  const over = (c: LiveClassItem) => c.status !== "live" && new Date(c.startAt).getTime() + c.durationMin * 60000 < now;
  const live = upcoming.filter((c) => c.status === "live");
  const later = upcoming.filter((c) => c.status !== "live" && !over(c));
  const completed = [...upcoming.filter(over), ...past].sort((a, b) => b.startAt.localeCompare(a.startAt));
  // Open on what matters now: a running class, else the next ones.
  const [tab, setTab] = useState<"live" | "upcoming" | "completed">(live.length ? "live" : "upcoming");

  return (
    <div style={page}>
      <ScreenHeader title={title} subtitle={subtitle} onBack={onBack} />

      <div style={{ padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Attendance summary */}
        {attendancePct !== null && <div style={{
          ...heroSurface, padding: "16px 18px", color: "white",
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
            {`${attendancePct}%`}
          </div>
        </div>}

        <Segmented<"live" | "upcoming" | "completed">
          tabs={[
            { key: "live", label: `Live now${live.length ? ` (${live.length})` : ""}` },
            { key: "upcoming", label: `Upcoming${later.length ? ` (${later.length})` : ""}` },
            { key: "completed", label: `Completed${completed.length ? ` (${completed.length})` : ""}` },
          ]}
          active={tab}
          onChange={setTab}
        />

        {/* Live now */}
        {tab === "live" && (live.length === 0 ? (
          <EmptyState icon="mic" title="No class is live right now" text="Check Upcoming for the next one." />
        ) : live.map((c) => {
          const st = subjectStyle(c.subject);
          return (
            <div key={c.id} style={{ ...card, padding: 14, border: "1.5px solid var(--error-text)", boxShadow: "0 6px 18px rgba(220,38,38,0.12)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 48, height: 48, borderRadius: 14, background: st.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <AppIcon name={st.icon} size={22} color="white" />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "var(--error)", color: "var(--error-text)", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>
                    <span className="live-dot" />LIVE NOW
                  </span>
                  <p style={{ margin: "5px 0 0", fontSize: 14.5, fontWeight: 800, color: "var(--ink)", lineHeight: 1.3 }}>{c.title}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 11.5, color: "var(--ink-mute)" }}>{c.subject || "Class"} · {c.teacher ?? "Faculty"}</p>
                </div>
              </div>
              <button onClick={() => onJoin(c.id)} className="press" style={{ width: "100%", marginTop: 12, border: "none", borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 800, cursor: "pointer", color: "white", background: "linear-gradient(135deg,var(--error-text),#B91C1C)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                Join now <AppIcon name="arrowRight" size={15} color="white" />
              </button>
            </div>
          );
        }))}

        {/* Upcoming — grouped by day */}
        {tab === "upcoming" && (later.length === 0 ? (
          <EmptyState icon="calendar" title="No upcoming classes" text="New classes appear here once they're scheduled." />
        ) : groupByDay(later).map(([day, dayItems]) => (
          <div key={day}>
            <p style={{ margin: "2px 2px 8px", fontSize: 12, fontWeight: 800, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{day}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {dayItems.map((c) => {
                const st = subjectStyle(c.subject);
                return (
                  <div key={c.id} style={{ ...card, padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ width: 46, height: 46, borderRadius: 14, background: st.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <AppIcon name={st.icon} size={21} color="white" />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: "var(--ink)", lineHeight: 1.3 }}>{c.title}</p>
                      <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--ink-mute)", display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                        <AppIcon name="clock" size={12} color="var(--ink-mute)" />{fmtTime(c.startAt)} · {c.teacher ?? "Faculty"}
                      </p>
                    </div>
                    <button onClick={() => onJoin(c.id)} style={{ ...smallBtn, whiteSpace: "nowrap" }}>
                      <AppIcon name="bell" size={14} /> Remind
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )))}

        {/* Completed — previous classes and their recordings */}
        {tab === "completed" && (completed.length === 0 ? (
          <EmptyState icon="video" title="No completed classes yet" text="Finished classes and their recordings show up here." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {completed.map((c) => {
              const st = subjectStyle(c.subject);
              return (
                <div key={c.id} style={{ ...card, padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 42, height: 42, borderRadius: 13, background: st.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: 0.85 }}>
                    <AppIcon name={st.icon} size={19} color="white" />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: "var(--ink)", lineHeight: 1.3 }}>{c.title}</p>
                    <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--ink-mute)" }}>{c.subject} · {fmtTime(c.startAt)}</p>
                    {c.attended && <p style={{ margin: "3px 0 0", fontSize: 11, fontWeight: 700, color: "var(--success-text)" }}>Attended</p>}
                  </div>
                  {c.recordingUrl ? (
                    <button onClick={() => onWatchRecording(c)} style={{ ...smallBtn, whiteSpace: "nowrap" }}>
                      <AppIcon name="play" size={13} /> Recording
                    </button>
                  ) : (
                    <span style={{ fontSize: 11, color: "var(--ink-mute)", flexShrink: 0 }}>No recording</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        <style>{`.live-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--error-text);animation:livepulse 1.2s infinite}@keyframes livepulse{50%{opacity:.3}}@media (prefers-reduced-motion: reduce){.live-dot{animation:none}}`}</style>
      </div>
    </div>
  );
}
