"use client";

import { AppIcon, type IconName } from "../AppIcon";
import { card, gradient, page, body, ScreenHeader, SectionTitle, EmptyState } from "../ui/kit";

export type Badge = { emoji: string; label: string; desc: string; earned: boolean };
export type LeaderRow = { rank: number; name: string; points: number; isMe: boolean };
export type Engagement = {
  myPoints: number;
  myRank: number | null;
  totalStudents: number;
  streak: number;
  badges: Badge[];
  leaderboard: LeaderRow[];
};

// Badge icons by label — the badge's emoji is never shown.
const BADGE_ICONS: Record<string, IconName> = {
  "First Steps": "flag",
  Sharpshooter: "target",
  Consistent: "calendar",
  Bookworm: "book",
  "On Fire": "flame",
  "Chart Topper": "crown",
};

// Top three get a gold / silver / bronze numbered circle.
const MEDALS: Record<number, { bg: string; fg: string }> = {
  1: { bg: "linear-gradient(135deg,#FFD66B,var(--gold-dark))", fg: "white" },
  2: { bg: "linear-gradient(135deg,#E3E7EF,#A7B0C0)", fg: "white" },
  3: { bg: "linear-gradient(135deg,#E8B68A,#B9773F)", fg: "white" },
};

export default function LeaderboardPage({ onBack, engagement }: { onBack: () => void; engagement: Engagement }) {
  const earned = engagement.badges.filter((b) => b.earned).length;

  return (
    <div style={page}>
      <ScreenHeader title="Leaderboard" onBack={onBack} />

      <div style={body}>
        {/* My standing */}
        <div style={{ background: gradient, borderRadius: 20, padding: "18px 20px", color: "white", boxShadow: "0 8px 22px rgba(11,92,255,0.22)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {[
            { v: engagement.myRank === null ? "—" : `#${engagement.myRank}`, l: `of ${engagement.totalStudents}`, icon: null },
            { v: String(engagement.myPoints), l: "points", icon: null },
            { v: String(engagement.streak), l: "day streak", icon: "flame" as IconName },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center", flex: 1 }}>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                {s.icon && <AppIcon name={s.icon} size={20} color="var(--gold)" strokeWidth={2.4} />}
                {s.v}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.75)" }}>{s.l}</p>
            </div>
          ))}
        </div>

        {/* Badges */}
        <SectionTitle kicker={`${earned} of ${engagement.badges.length} earned`} title="Badges" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {engagement.badges.map((b) => (
            <div key={b.label} style={{
              ...card, padding: "14px 8px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center",
              opacity: b.earned ? 1 : 0.55,
              border: b.earned ? "1.5px solid var(--gold)" : "1px solid var(--line)",
            }}>
              <span style={{ width: 42, height: 42, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", background: b.earned ? "var(--gold-tint)" : "var(--surface-dim)" }}>
                <AppIcon name={BADGE_ICONS[b.label] ?? "award"} size={20} color={b.earned ? "var(--gold-dark)" : "var(--text-muted)"} />
              </span>
              <p style={{ margin: "7px 0 2px", fontSize: 11.5, fontWeight: 800, color: "var(--ink)" }}>{b.label}</p>
              <p style={{ margin: 0, fontSize: 10, color: "var(--ink-soft)", lineHeight: 1.3 }}>{b.earned ? "Earned" : b.desc}</p>
            </div>
          ))}
        </div>

        {/* Leaderboard */}
        <SectionTitle title="Top students" />
        {engagement.leaderboard.length === 0 && (
          <EmptyState icon="trophy" title="No activity yet" text="Take a test or attend a class to get on the board." />
        )}
        {engagement.leaderboard.map((r) => {
          const m = MEDALS[r.rank];
          return (
            <div key={r.rank} style={{
              ...card, display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
              background: r.isMe ? "var(--blue-tint)" : "white",
              border: r.isMe ? "1.5px solid var(--blue)" : "1px solid var(--line)",
            }}>
              {m ? (
                <span style={{ width: 30, height: 30, borderRadius: "50%", background: m.bg, color: m.fg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13.5, fontWeight: 900 }}>{r.rank}</span>
              ) : (
                <span style={{ width: 30, textAlign: "center", fontSize: 13, fontWeight: 800, color: "var(--ink-soft)", flexShrink: 0 }}>#{r.rank}</span>
              )}
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "white", flexShrink: 0 }}>
                {r.name.charAt(0)}
              </div>
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: r.isMe ? 800 : 600, color: "var(--ink)" }}>{r.name}{r.isMe ? " (You)" : ""}</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: "var(--gold-dark)" }}>{r.points}<span style={{ fontSize: 10, fontWeight: 600, color: "var(--ink-soft)" }}> pts</span></span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
