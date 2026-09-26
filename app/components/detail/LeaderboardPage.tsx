"use client";

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

const medal = (rank: number) => (rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`);

export default function LeaderboardPage({ onBack, engagement }: { onBack: () => void; engagement: Engagement }) {
  const earned = engagement.badges.filter((b) => b.earned).length;

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%", paddingBottom: 24 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "var(--ink-primary)", fontSize: 14, fontWeight: 700, padding: "14px 16px 0" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-primary)" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        Leaderboard
      </button>

      {/* My standing */}
      <div style={{ padding: "14px 14px 0" }}>
        <div style={{ background: "linear-gradient(135deg,var(--blue-dark),var(--blue))", borderRadius: 20, padding: "18px 20px", color: "white", boxShadow: "0 8px 24px rgba(61,36,17,0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {[
            { v: engagement.myRank === null ? "—" : `#${engagement.myRank}`, l: `of ${engagement.totalStudents}` },
            { v: String(engagement.myPoints), l: "points" },
            { v: `🔥 ${engagement.streak}`, l: "day streak" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center", flex: 1 }}>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "var(--gold)" }}>{s.v}</p>
              <p style={{ margin: "2px 0 0", fontSize: 10.5, color: "rgba(255,255,255,0.7)" }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div style={{ padding: "18px 14px 0" }}>
        <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "var(--ink-primary)" }}>Badges <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-disabled)" }}>({earned}/{engagement.badges.length})</span></h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {engagement.badges.map((b) => (
            <div key={b.label} style={{
              background: "white", borderRadius: 16, padding: "14px 8px", textAlign: "center",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)", opacity: b.earned ? 1 : 0.45,
              border: b.earned ? "1.5px solid var(--gold)" : "1.5px solid var(--border)",
            }}>
              <div style={{ fontSize: 28, filter: b.earned ? "none" : "grayscale(1)" }}>{b.emoji}</div>
              <p style={{ margin: "4px 0 2px", fontSize: 11.5, fontWeight: 800, color: "var(--ink-primary)" }}>{b.label}</p>
              <p style={{ margin: 0, fontSize: 9.5, color: "var(--text-disabled)", lineHeight: 1.3 }}>{b.earned ? "Earned" : b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div style={{ padding: "18px 14px 0" }}>
        <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "var(--ink-primary)" }}>Top students</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {engagement.leaderboard.length === 0 && (
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-disabled)" }}>No activity yet — take a test or attend a class to get on the board.</p>
          )}
          {engagement.leaderboard.map((r) => (
            <div key={r.rank} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 16,
              background: r.isMe ? "var(--info-border)" : "white",
              border: r.isMe ? "1.5px solid var(--gold-dark)" : "1.5px solid transparent",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            }}>
              <span style={{ width: 30, textAlign: "center", fontSize: r.rank <= 3 ? 20 : 13, fontWeight: 800, color: "var(--blue)" }}>{medal(r.rank)}</span>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,var(--blue-dark),var(--blue))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "white", flexShrink: 0 }}>
                {r.name.charAt(0)}
              </div>
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: r.isMe ? 800 : 600, color: "var(--ink-primary)" }}>{r.name}{r.isMe ? " (You)" : ""}</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: "var(--gold)" }}>{r.points}<span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-disabled)" }}> pts</span></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
