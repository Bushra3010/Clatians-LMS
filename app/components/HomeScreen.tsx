"use client";

import { ChevronRight, CalendarIcon } from "./icons";
import type { Story } from "../lib/resource-types";
import { subjectStyle, fmtTime, type LiveClassItem } from "./detail/LiveClassesPage";

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
  onToolClick?: (tool: string) => void;
  onKnowMoreClick?: (item: string) => void;
  liveClasses?: LiveClassItem[];
  onJoinClass?: (id: string) => void;
  onSeeAllClasses?: () => void;
  onOpenTests?: () => void;
  onOpenStories?: () => void;
  stories?: Story[];
}

/* ─── Inline SVG Tool Icons ─── */
const VideoIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="5" width="15" height="14" rx="2.5" fill="white" fillOpacity=".25" />
    <rect x="2" y="5" width="15" height="14" rx="2.5" stroke="white" strokeWidth="1.6" />
    <path d="M17 9.5l5-3v11l-5-3V9.5z" fill="white" />
    <circle cx="7" cy="12" r="2" fill="white" fillOpacity=".7" />
    <polygon points="6.2,11.2 9,12 6.2,12.8" fill="white" />
  </svg>
);

const NotesIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="2" width="13" height="17" rx="2" fill="white" fillOpacity=".2" stroke="white" strokeWidth="1.6" />
    <path d="M8 7h7M8 11h7M8 15h4" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    <rect x="14" y="14" width="7" height="8" rx="2" fill="white" fillOpacity=".9" />
    <path d="M16 17h3M16 19h2" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const PracticeIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.6" fill="white" fillOpacity=".15" />
    <path d="M12 7v5l3.5 2" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 16l1.5 1.5L14 13" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CurrentAffairsIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M4 4h16v3H4z" fill="white" fillOpacity=".3" stroke="white" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M4 7h16v13H4z" fill="white" fillOpacity=".1" stroke="white" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M7 11h10M7 14h7M7 17h5" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="19" cy="5.5" r="3" fill="#F5A623" />
    <path d="M18 5.5h2M19 4.5v2" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const tools = [
  { Icon: VideoIcon, label: "Video\nLectures", bg: "linear-gradient(145deg,#7C3AED,#5B21B6)", shadow: "rgba(124,58,237,0.35)", id:"videos" },
  { Icon: NotesIcon, label: "Study\nNotes", bg: "linear-gradient(145deg,#0891B2,#0E7490)", shadow: "rgba(8,145,178,0.35)", id:"notes" },
  { Icon: PracticeIcon, label: "Practice\nQuestions", bg: "linear-gradient(145deg,#DB2777,#9D174D)", shadow: "rgba(219,39,119,0.35)", id:"practice" },
  { Icon: CurrentAffairsIcon, label: "Current\nAffairs", bg: "linear-gradient(145deg,#D97706,#B45309)", shadow: "rgba(217,119,6,0.35)", id:"current-affairs" },
];

const toppers = [
  { name: "Aanya Gupta", rank: "AIR 1", score: "99.8%ile", city: "Delhi", initials: "AG" },
  { name: "Rohan Mehta", rank: "AIR 4", score: "99.6%ile", city: "Mumbai", initials: "RM" },
];

const knowMore = [
  { emoji: "✏️", label: "CLAT\nStudy Tools", color: "#7C3AED", id: "study-tools" },
  { emoji: "🏆", label: "CLATians\nToppers", color: "#D97706", id: "toppers" },
  { emoji: "✨", label: "What's\nNew", color: "#0891B2", id: "whats-new" },
  { emoji: "💡", label: "Tips &\nTricks", color: "#059669", id: "tips" },
];


export default function HomeScreen({ onNavigate, onToolClick, onKnowMoreClick, liveClasses = [], onJoinClass, onSeeAllClasses, onOpenTests, onOpenStories, stories = [] }: HomeScreenProps) {
  return (
    <div style={{ background: "#F7F3EA", paddingBottom: 20 }}>

      {/* ── Hero Scholarship Banner ── */}
      <div style={{ padding: "14px 14px 0" }}>
        <div style={{
          background: "linear-gradient(135deg,#B8F0E8 0%,#8EE0D6 55%,#6ECFC4 100%)",
          borderRadius: 22,
          padding: "18px 14px 18px 18px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(110,207,196,0.3)",
        }}>
          {/* Decorative blobs */}
          <div style={{ position: "absolute", right: -30, top: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.18)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", right: 60, bottom: -40, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,0.10)", pointerEvents: "none" }} />

          <div style={{ flex: 1, zIndex: 1 }}>
            <p style={{ margin: "0 0 2px", fontWeight: 800, fontSize: 16, color: "#0D4A42", lineHeight: 1.3 }}>
              Win Scholarship on<br />CLATians Courses
            </p>
            <p style={{ margin: "6px 0 10px", fontSize: 12.5, color: "#1A6B60", lineHeight: 1.4 }}>
              Give CLAT Mock & claim your scholarship
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <CalendarIcon />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "#374151" }}>17th May, 2026</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 1, flexShrink: 0 }}>
            <div style={{
              background: "white",
              borderRadius: 16,
              padding: "10px 14px",
              textAlign: "center",
              boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
              minWidth: 88,
            }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#0D4A42", letterSpacing: "0.5px" }}>UP TO</p>
              <p style={{ margin: "2px 0", fontSize: 38, fontWeight: 900, color: "#0D4A42", lineHeight: 1 }}>
                90<span style={{ fontSize: 20 }}>%</span>
              </p>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#0D4A42" }}>Scholarship</p>
            </div>
            <button onClick={() => onOpenTests?.()} style={{
              background: "linear-gradient(135deg,#3D2411,#5C3A00)",
              color: "white", border: "none",
              borderRadius: 24, padding: "10px 16px",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              whiteSpace: "nowrap",
              boxShadow: "0 4px 12px rgba(61,36,17,0.4)",
            }}>Register Now</button>
          </div>
        </div>
      </div>

      {/* ── Tools Grid ── */}
      <div style={{ padding: "20px 14px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12.5, color: "#6B7280", fontWeight: 500 }}>Tools recommended</p>
            <p style={{ margin: 0, fontSize: 19, fontWeight: 800, color: "#1A1A2E", letterSpacing: "-0.3px" }}>by Toppers</p>
          </div>
          <div style={{ display: "flex" }}>
            {["AG", "RM"].map((init, i) => (
              <div key={i} style={{
                width: 36, height: 36, borderRadius: "50%",
                background: i === 0 ? "linear-gradient(135deg,#3D2411,#8A5A08)" : "linear-gradient(135deg,#DC2626,#EF4444)",
                border: "2.5px solid white",
                marginLeft: i === 0 ? 0 : -10,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800, color: "white",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              }}>{init}</div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
          {tools.map((tool, i) => (
            <button key={i} onClick={() => onToolClick?.(tool.id)} style={{
              background: "white",
              borderRadius: 18,
              padding: "14px 6px 12px",
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 9,
              boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
              cursor: "pointer", border: "none",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 15,
                background: tool.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 4px 14px ${tool.shadow}`,
              }}>
                <tool.Icon />
              </div>
              <span style={{
                fontSize: 10.5, fontWeight: 700, color: "#374151",
                textAlign: "center", lineHeight: 1.3, whiteSpace: "pre-line",
              }}>
                {tool.label}
              </span>
            </button>
          ))}
        </div>

        <button onClick={() => onNavigate("study")} style={{
          marginTop: 12, width: "100%",
          background: "transparent",
          border: "2px solid #3D2411",
          borderRadius: 30, padding: "12px",
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 6, cursor: "pointer",
          color: "#3D2411", fontSize: 14, fontWeight: 700,
        }}>
          Explore more <ChevronRight />
        </button>
      </div>

      {/* ── Live Classes (real data) ── */}
      <div style={{ padding: "22px 14px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1A1A2E" }}>Live Classes</h3>
          <button onClick={() => onSeeAllClasses?.()} style={{ background: "none", border: "none", color: "#3D2411", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 2 }}>
            See all <ChevronRight />
          </button>
        </div>

        {liveClasses.length === 0 ? (
          <div style={{ background: "white", borderRadius: 18, padding: "18px", textAlign: "center", boxShadow: "0 2px 14px rgba(0,0,0,0.07)" }}>
            <p style={{ margin: 0, fontSize: 13, color: "#9CA3AF" }}>No classes scheduled for your batch right now.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {liveClasses.slice(0, 3).map((cls) => {
              const st = subjectStyle(cls.subject);
              const isLive = cls.status === "live";
              return (
                <div key={cls.id} style={{
                  background: "white", borderRadius: 18, overflow: "hidden",
                  boxShadow: "0 2px 14px rgba(0,0,0,0.07)", display: "flex", alignItems: "stretch",
                }}>
                  <div style={{ width: 5, background: st.bg, flexShrink: 0 }} />
                  <div style={{ flex: 1, padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 50, height: 50, borderRadius: 14, background: st.bg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 22, flexShrink: 0, boxShadow: `0 4px 12px ${st.color}40`,
                    }}>
                      {st.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#1A1A2E" }}>{cls.subject || "Class"}</span>
                        {isLive && (
                          <span style={{
                            background: "#FEF2F2", color: "#DC2626",
                            fontSize: 9.5, fontWeight: 800, padding: "2px 7px", borderRadius: 20,
                            display: "flex", alignItems: "center", gap: 3,
                          }}>
                            <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: "#DC2626" }} />
                            LIVE
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: "#374151", fontWeight: 500 }}>{cls.title}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10.5, color: "#9CA3AF" }}>{cls.teacher ?? "Faculty"}</span>
                        <span style={{ fontSize: 10, color: "#9CA3AF" }}>•</span>
                        <span style={{ fontSize: 10.5, color: "#9CA3AF" }}>⏰ {fmtTime(cls.startAt)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onJoinClass?.(cls.id)}
                      style={{
                        background: isLive ? "linear-gradient(135deg,#DC2626,#B91C1C)" : "linear-gradient(135deg,#3D2411,#5C3A00)",
                        color: "white", border: "none",
                        borderRadius: 12, padding: "8px 14px",
                        fontSize: 12, fontWeight: 700, cursor: "pointer",
                        boxShadow: "0 3px 10px rgba(61,36,17,0.3)", whiteSpace: "nowrap",
                      }}
                    >
                      {isLive ? "Join →" : "Remind"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Topper Achievement Banner ── */}
      <div style={{ padding: "22px 14px 0" }}>
        <div style={{
          background: "linear-gradient(135deg,#3D2411 0%,#4A2D14 60%,#3D2411 100%)",
          borderRadius: 22,
          padding: "18px 16px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 6px 24px rgba(61,36,17,0.3)",
        }}>
          {/* bg circles */}
          <div style={{ position: "absolute", top: -30, right: -30, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ position: "absolute", bottom: -20, left: 10, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{ zIndex: 1 }}>
              <div style={{ display: "inline-block", background: "#F5A623", color: "white", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20, marginBottom: 8 }}>
                🇮🇳 FIRST TIME IN INDIA!
              </div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "white", lineHeight: 1.35 }}>
                Online CLAT Coaching<br />Produces a 99.9%iler!
              </p>
            </div>
            <div style={{
              background: "linear-gradient(135deg,#F5A623,#E8930A)",
              borderRadius: 14, padding: "10px 14px",
              textAlign: "center", flexShrink: 0,
              boxShadow: "0 4px 14px rgba(245,166,35,0.4)",
            }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "white" }}>AIR</p>
              <p style={{ margin: 0, fontSize: 34, fontWeight: 900, color: "white", lineHeight: 1 }}>1</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            {toppers.map((t, i) => (
              <div key={i} style={{
                flex: 1,
                background: "rgba(255,255,255,0.10)",
                borderRadius: 14,
                padding: "12px",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "linear-gradient(135deg,#F5A623,#E8930A)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 800, color: "white",
                    boxShadow: "0 2px 8px rgba(245,166,35,0.4)",
                  }}>{t.initials}</div>
                  <div>
                    <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: "white" }}>{t.name}</p>
                    <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.65)" }}>{t.city}</p>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{
                    background: "rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.85)",
                    fontSize: 10.5, fontWeight: 700,
                    padding: "3px 9px", borderRadius: 20,
                  }}>{t.rank}</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: "#F5A623" }}>{t.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Know More About Us ── */}
      <div style={{ padding: "22px 14px 0" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800, color: "#1A1A2E" }}>Know more about us</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
          {knowMore.map((item, i) => (
            <button key={i} onClick={() => onKnowMoreClick?.(item.id)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              background: "none", border: "none", cursor: "pointer",
            }}>
              <div style={{
                width: 62, height: 62, borderRadius: "50%",
                border: `2.5px dashed ${item.color}60`,
                background: `${item.color}0D`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26,
                boxShadow: `0 2px 10px ${item.color}15`,
              }}>{item.emoji}</div>
              <span style={{
                fontSize: 10.5, fontWeight: 700, color: "#374151",
                textAlign: "center", whiteSpace: "pre-line", lineHeight: 1.35,
              }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Daily Mock Test Banner ── */}
      <div style={{ padding: "22px 14px 0" }}>
        <div style={{
          background: "linear-gradient(135deg,#FFF7ED,#FEF3C7)",
          borderRadius: 20,
          padding: "16px",
          border: "1.5px solid #FDE68A",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 12px rgba(245,166,35,0.12)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "linear-gradient(135deg,#F5A623,#E8930A)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
              boxShadow: "0 4px 12px rgba(245,166,35,0.3)",
            }}>📝</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#92400E" }}>Daily Mock Test</p>
                <span style={{ background: "#DCFCE7", color: "#15803D", fontSize: 9.5, fontWeight: 800, padding: "2px 8px", borderRadius: 20, border: "1px solid #BBF7D0" }}>FREE</span>
              </div>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#B45309" }}>CLAT 2026 pattern · 120 Qs</p>
            </div>
          </div>
          <button onClick={() => onOpenTests?.()} style={{
            background: "linear-gradient(135deg,#F5A623,#E8930A)",
            color: "white", border: "none",
            borderRadius: 12, padding: "11px 16px",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 4px 12px rgba(245,166,35,0.35)",
            whiteSpace: "nowrap",
          }}>Attempt →</button>
        </div>
      </div>

      {/* ── AI Practice Banner ── */}
      <div style={{ padding: "14px 14px 0" }}>
        <button onClick={() => onToolClick?.("ai-practice")} style={{
          width: "100%",
          background: "linear-gradient(135deg,#3D2411,#5C3A00)",
          borderRadius: 20,
          padding: "16px",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 6px 20px rgba(61,36,17,0.28)",
          cursor: "pointer",
          textAlign: "left",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "linear-gradient(135deg,#F5A623,#E8930A)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
              boxShadow: "0 4px 12px rgba(245,166,35,0.3)",
            }}>✨</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#F7EFE2" }}>AI Practice</p>
                <span style={{ background: "rgba(245,166,35,0.2)", color: "#F5C97A", fontSize: 9.5, fontWeight: 800, padding: "2px 8px", borderRadius: 20, border: "1px solid rgba(245,166,35,0.35)" }}>NEW</span>
              </div>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#D9C6A8" }}>Instant quiz on any topic · with explanations</p>
            </div>
          </div>
          <span style={{
            background: "rgba(255,255,255,0.12)",
            color: "#F7EFE2", border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 12, padding: "11px 16px",
            fontSize: 12, fontWeight: 700,
            whiteSpace: "nowrap",
          }}>Start →</span>
        </button>
      </div>

      {/* ── Success Stories ── */}
      <div style={{ padding: "22px 14px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1A1A2E" }}>Success Stories</h3>
          <button onClick={() => onOpenStories?.()} style={{ background: "none", border: "none", color: "#3D2411", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>See all</button>
        </div>
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }} className="no-scroll">
          {stories.map((s, i) => (
            <div key={i} onClick={() => onOpenStories?.()} style={{
              minWidth: 130, background: "white",
              borderRadius: 18, overflow: "hidden",
              boxShadow: "0 4px 16px rgba(0,0,0,0.09)",
              flexShrink: 0, cursor: "pointer",
            }}>
              <div style={{
                height: 86,
                background: `linear-gradient(135deg,${s.color},${s.color}BB)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative",
              }}>
                <div style={{
                  width: 50, height: 50, borderRadius: "50%",
                  background: "rgba(255,255,255,0.20)",
                  border: "2px solid rgba(255,255,255,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 900, color: "white",
                }}>{s.initials}</div>
                {/* Play overlay */}
                <div style={{
                  position: "absolute", bottom: 8, right: 8,
                  width: 26, height: 26, borderRadius: "50%",
                  background: "rgba(255,255,255,0.85)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill={s.color}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
              </div>
              <div style={{ padding: "10px 12px 14px" }}>
                <p style={{ margin: 0, fontSize: 12.5, fontWeight: 800, color: "#1A1A2E" }}>{s.name}</p>
                <p style={{ margin: "2px 0 6px", fontSize: 10.5, color: "#6B7280" }}>{s.college}</p>
                <span style={{
                  background: "#F6ECD9", color: "#3D2411",
                  fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 20,
                }}>{s.rank}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Current Affairs Strip ── */}
      <div style={{ padding: "22px 14px 0" }}>
        <div style={{
          background: "linear-gradient(135deg,#7C3AED,#6D28D9)",
          borderRadius: 20,
          padding: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 6px 20px rgba(124,58,237,0.3)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
            }}>📰</div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "white" }}>Today's Current Affairs</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.75)" }}>Stay updated for CLAT GK</p>
            </div>
          </div>
          <button onClick={() => onToolClick?.("current-affairs")} style={{
            background: "white", color: "#6D28D9",
            border: "none", borderRadius: 12, padding: "9px 16px",
            fontSize: 12, fontWeight: 800, cursor: "pointer",
          }}>Read →</button>
        </div>
      </div>
    </div>
  );
}
