"use client";

import { ChevronRight, CalendarIcon } from "./icons";
import ClatLogo from "./ClatLogo";
import { fmtIST } from "../lib/dates";
import type { Story } from "../lib/resource-types";

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
  onLogoClick?: () => void;
  onToolClick?: (tool: string) => void;
  onKnowMoreClick?: (item: string) => void;
  nextBooking?: { teacher: string; startAt: string } | null;
  onOpenTests?: () => void;
  onOpenStories?: () => void;
  onOpenTutor?: () => void;
  stories?: Story[];
}

/* ─── Tool icons — flat two-tone illustrations that sit directly on the
     white tile (no coloured chip behind them). ─── */
const VideoIcon = () => (
  <svg width="44" height="44" viewBox="0 0 42 42" fill="none">
    <rect x="6" y="9" width="24" height="18" rx="5" fill="var(--purple-400)" />
    <path d="M30 15.5l7-4.5v14l-7-4.5v-5z" fill="var(--purple-400)" />
    <rect x="10" y="18" width="24" height="14" rx="5" fill="var(--purple-600)" />
  </svg>
);

const NotesIcon = () => (
  <svg width="44" height="44" viewBox="0 0 42 42" fill="none">
    <rect x="9" y="10" width="20" height="26" rx="4" fill="var(--teal)" />
    <rect x="14" y="7" width="18" height="26" rx="4" fill="var(--teal-light)" />
    <circle cx="23" cy="7" r="4" fill="var(--teal)" />
    <path d="M18 17h10M18 22h10M18 27h6" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

const PracticeIcon = () => (
  <svg width="44" height="44" viewBox="0 0 42 42" fill="none">
    <path d="M9 12h3M9 17h3M9 22h3M9 27h3" stroke="var(--purple-400)" strokeWidth="2.6" strokeLinecap="round" />
    <rect x="14" y="7" width="21" height="27" rx="5" fill="var(--purple-400)" />
    <circle cx="24" cy="18" r="7" fill="none" stroke="white" strokeWidth="2.6" />
    <circle cx="24" cy="18" r="2.6" fill="white" />
    {/* pencil laid across the lower-right corner */}
    <path d="M22 34.5l1-4.2 9.6-9.6 3.2 3.2-9.6 9.6-4.2 1z" fill="var(--purple)" />
    <path d="M32.6 20.7l3.2 3.2 1.6-1.6a2.3 2.3 0 0 0-3.2-3.2l-1.6 1.6z" fill="#5B21B6" />
  </svg>
);

const CurrentAffairsIcon = () => (
  <svg width="44" height="44" viewBox="0 0 42 42" fill="none">
    <rect x="8" y="7" width="19" height="28" rx="5" fill="#F0A44A" />
    <rect x="15" y="7" width="19" height="28" rx="5" fill="#E07B1F" />
    <path d="M26 13l-6 9h4.5l-1.5 7 6-9H24.5L26 13z" fill="white" />
  </svg>
);

/** Tilted card with a clock, framed by green corner brackets. */
const SlotArtwork = () => (
  <svg width="64" height="64" viewBox="0 0 104 104" fill="none" style={{ flexShrink: 0 }} aria-hidden="true">
    <g stroke="#22C55E" strokeWidth="5" strokeLinecap="round">
      <path d="M14 30V17h13M90 30V17H77M14 74v13h13M90 74v13H77" />
    </g>
    <rect x="24" y="22" width="58" height="58" rx="16" fill="#93BDFB" transform="rotate(-11 53 51)" />
    <circle cx="53" cy="51" r="20" fill="none" stroke="#DCE9FD" strokeWidth="6" />
    <path d="M53 39v13l9 5" stroke="var(--blue)" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Tilted card with a question mark, framed by green corner brackets. */
const QuestionArtwork = () => (
  <svg width="64" height="64" viewBox="0 0 104 104" fill="none" style={{ flexShrink: 0 }} aria-hidden="true">
    <g stroke="#22C55E" strokeWidth="5" strokeLinecap="round">
      <path d="M14 30V17h13M90 30V17H77M14 74v13h13M90 74v13H77" />
    </g>
    <rect x="24" y="22" width="58" height="58" rx="16" fill="#93BDFB" transform="rotate(-11 53 51)" />
    <g transform="rotate(-11 53 51)">
      <path
        d="M44 43a9.5 9.5 0 0 1 18.6 3c0 6-7.6 7.2-8.6 12.4"
        stroke="var(--blue)" strokeWidth="8.5" strokeLinecap="round" fill="none"
      />
      <circle cx="53" cy="68" r="4.8" fill="var(--blue)" />
    </g>
  </svg>
);

/** Support line shown on the "Have any questions?" card. */
const SUPPORT_PHONE = "+911800000000";

const tools = [
  { Icon: VideoIcon, label: "Video\nlectures", id: "videos" },
  { Icon: NotesIcon, label: "Study Notes", id: "notes" },
  { Icon: PracticeIcon, label: "Practice\nQuestions", id: "practice" },
  { Icon: CurrentAffairsIcon, label: "Current\nAffairs", id: "current-affairs" },
];

const toppers = [
  { name: "Aanya Gupta", rank: "AIR 1", score: "99.8%ile", city: "Delhi", initials: "AG" },
  { name: "Rohan Mehta", rank: "AIR 4", score: "99.6%ile", city: "Mumbai", initials: "RM" },
];

const knowMore = [
  { emoji: "✏️", label: "CLAT\nStudy Tools", color: "var(--purple)", id: "study-tools" },
  { emoji: "🏆", label: "CLATians\nToppers", color: "var(--gold)", id: "toppers" },
  { emoji: "✨", label: "What's\nNew", color: "var(--blue)", id: "whats-new" },
  { emoji: "💡", label: "Tips &\nTricks", color: "var(--green)", id: "tips" },
];


const fmtBooking = (iso: string) =>
  fmtIST(iso, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });

export default function HomeScreen({ onNavigate, onLogoClick, onToolClick, onKnowMoreClick, onOpenTests, onOpenStories, onOpenTutor, stories = [], nextBooking = null }: HomeScreenProps) {
  return (
    <div style={{ background: "var(--app-bg)", paddingBottom: 32 }}>

      {/* ── Hero Scholarship Banner — carries the brand logo now that the
           top bar is a plain chip row. ── */}
      <div style={{ padding: "4px 16px 0" }}>
        <div style={{
          background: "linear-gradient(150deg,var(--blue-dark) 0%,var(--blue-dark) 55%,var(--blue) 100%)",
          borderRadius: 24,
          padding: "20px 20px 22px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 10px 28px rgba(11,92,255,0.28)",
        }}>
          {/* Decorative gold glows */}
          <div style={{ position: "absolute", right: -50, top: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,166,35,0.30), transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", left: -40, bottom: -70, width: 170, height: 170, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.14), transparent 70%)", pointerEvents: "none" }} />

          {/* Logo + campaign tag */}
          <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
            <div onClick={onLogoClick} className="press" style={{
              background: "white", borderRadius: 12,
              padding: "8px 12px", display: "flex", alignItems: "center",
              cursor: onLogoClick ? "pointer" : "default",
              boxShadow: "0 4px 14px rgba(4,36,107,0.25)",
            }}>
              <ClatLogo size="sm" showTagline={false} />
            </div>
            <span style={{
              background: "#CFFB6B", color: "var(--blue-dark)",
              fontSize: 11, fontWeight: 700, letterSpacing: "0.02em",
              padding: "6px 12px", borderRadius: 8, whiteSpace: "nowrap",
            }}>
              Scholarship test
            </span>
          </div>

          <p style={{ position: "relative", zIndex: 1, margin: 0, fontWeight: 700, fontSize: 25, color: "white", lineHeight: 1.25 }}>
            Win up to <span style={{ color: "var(--gold)" }}>90% off</span><br />on CLATians courses
          </p>
          <p style={{ position: "relative", zIndex: 1, margin: "8px 0 18px", fontSize: 14, color: "rgba(255,255,255,0.72)", lineHeight: 1.5 }}>
            Attempt the CLAT mock &amp; claim your scholarship
          </p>

          {/* Stat + date strip */}
          <div style={{
            position: "relative", zIndex: 1,
            display: "flex", alignItems: "center", gap: 14,
            background: "rgba(255,255,255,0.09)",
            border: "1px solid rgba(255,255,255,0.16)",
            borderRadius: 16, padding: "12px 14px", marginBottom: 16,
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em" }}>UP TO</p>
              <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: "var(--gold)", lineHeight: 1.1 }}>
                90<span style={{ fontSize: 18 }}>%</span>
              </p>
            </div>
            <div style={{ width: 1, alignSelf: "stretch", background: "rgba(255,255,255,0.16)" }} />
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "white" }}>Scholarship</p>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                <CalendarIcon />
                <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.75)" }}>17 May 2026</span>
              </div>
            </div>
          </div>

          <button onClick={() => onOpenTests?.()} className="press" style={{
            position: "relative", zIndex: 1, width: "100%",
            background: "linear-gradient(135deg,var(--gold),var(--gold-dark))",
            color: "var(--blue-dark)", border: "none",
            borderRadius: 16, padding: "14px 18px",
            fontSize: 15, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 6px 16px rgba(245,166,35,0.40)",
          }}>Register Now →</button>
        </div>
      </div>

      {/* ── Tools Grid ── */}
      <div style={{ padding: "20px 14px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-soft)", fontWeight: 500 }}>Tools recommended</p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.02em" }}>by Toppers</p>
          </div>
          <div style={{ display: "flex" }}>
            {["AG", "RM"].map((init, i) => (
              <div key={i} style={{
                width: 36, height: 36, borderRadius: "50%",
                background: i === 0 ? "linear-gradient(135deg,var(--blue),var(--blue-dark))" : "linear-gradient(135deg,var(--gold),var(--gold-dark))",
                border: "2.5px solid white",
                marginLeft: i === 0 ? 0 : -10,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800, color: "white",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              }}>{init}</div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
          {tools.map((tool, i) => (
            <button key={i} onClick={() => onToolClick?.(tool.id)} className="press" style={{
              background: "none", border: "none", padding: 0,
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 10,
              cursor: "pointer",
            }}>
              {/* Squircle tile — the icon sits straight on the white, and the
                  shadow pools under the bottom edge like a physical key. */}
              <div style={{
                width: "100%", aspectRatio: "1 / 1", maxWidth: 74,
                background: "var(--surface)",
                borderRadius: "28%",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 6px 10px -2px rgba(15,23,41,0.16), 0 2px 4px rgba(15,23,41,0.06)",
              }}>
                <tool.Icon />
              </div>
              <span style={{
                fontSize: 12.5, fontWeight: 500, color: "var(--ink)",
                textAlign: "center", lineHeight: 1.35, whiteSpace: "pre-line",
              }}>
                {tool.label}
              </span>
            </button>
          ))}
        </div>

        <button onClick={() => onNavigate("study")} className="press" style={{
          marginTop: 22, width: "100%",
          background: "transparent",
          border: "2px solid var(--blue)",
          borderRadius: 999, padding: "15px",
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 12, cursor: "pointer",
          color: "var(--ink)", fontSize: 16, fontWeight: 500,
        }}>
          Explore more
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12h15M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      {/* ── Topper Achievement Banner ── */}
      <div style={{ padding: "22px 14px 0" }}>
        <div style={{
          background: "linear-gradient(135deg,var(--blue-dark) 0%,var(--blue) 60%,var(--blue) 100%)",
          borderRadius: 22,
          padding: "18px 16px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(11,92,255,0.28)",
        }}>
          {/* bg circles */}
          <div style={{ position: "absolute", top: -30, right: -30, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ position: "absolute", bottom: -20, left: 10, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{ zIndex: 1 }}>
              <div style={{ display: "inline-block", background: "var(--gold)", color: "var(--blue-dark)", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, marginBottom: 8 }}>
                🇮🇳 FIRST TIME IN INDIA!
              </div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "white", lineHeight: 1.35 }}>
                Online CLAT Coaching<br />Produces a 99.9%iler!
              </p>
            </div>
            <div style={{
              background: "linear-gradient(135deg,var(--gold),var(--gold-dark))",
              borderRadius: 16, padding: "10px 14px",
              textAlign: "center", flexShrink: 0,
              boxShadow: "0 4px 14px rgba(245,166,35,0.4)",
            }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "var(--blue-dark)" }}>AIR</p>
              <p style={{ margin: 0, fontSize: 34, fontWeight: 800, color: "var(--blue-dark)", lineHeight: 1 }}>1</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            {toppers.map((t, i) => (
              <div key={i} style={{
                flex: 1,
                background: "rgba(255,255,255,0.10)",
                borderRadius: 16,
                padding: "12px",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "linear-gradient(135deg,var(--gold),var(--gold-dark))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, color: "var(--blue-dark)",
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
                    fontSize: 11, fontWeight: 700,
                    padding: "3px 9px", borderRadius: 20,
                  }}>{t.rank}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "var(--gold)" }}>{t.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Know More About Us ── */}
      <div style={{ padding: "22px 14px 0" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 19, fontWeight: 700, color: "var(--ink)" }}>Know more about us</h3>
        {/* One shared gradient for every dashed ring — gold at the top fading
            into red at the bottom. */}
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="0.35" y2="1">
              <stop offset="0%" stopColor="#F5C33B" />
              <stop offset="45%" stopColor="#EF8B23" />
              <stop offset="100%" stopColor="#CE2A22" />
            </linearGradient>
          </defs>
        </svg>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
          {knowMore.map((item, i) => (
            <button key={i} onClick={() => onKnowMoreClick?.(item.id)} className="press" style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
              background: "none", border: "none", padding: 0, cursor: "pointer",
            }}>
              <div style={{ position: "relative", width: "100%", maxWidth: 72, aspectRatio: "1 / 1" }}>
                <svg viewBox="0 0 72 72" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
                  <circle cx="36" cy="36" r="34" fill="var(--surface)" />
                  <circle
                    cx="36" cy="36" r="34"
                    fill="none"
                    stroke="url(#ringGrad)"
                    strokeWidth="3.4"
                    strokeDasharray="10 8"
                    strokeLinecap="butt"
                  />
                </svg>
                <span style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 27, lineHeight: 1,
                }}>{item.emoji}</span>
              </div>
              <span style={{
                fontSize: 12.5, fontWeight: 500, color: "var(--ink)",
                textAlign: "center", whiteSpace: "pre-line", lineHeight: 1.35,
              }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Daily Mock Test Banner ── */}
      <div style={{ padding: "22px 14px 0" }}>
        <div style={{
          background: "var(--surface)",
          borderRadius: 18,
          padding: "14px",
          border: "1px solid var(--line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          boxShadow: "var(--shadow-card)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: "linear-gradient(135deg,var(--gold),var(--gold-dark))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
              boxShadow: "0 4px 12px rgba(245,166,35,0.3)",
            }}>📝</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>Daily Mock Test</p>
                <span style={{ background: "var(--success)", color: "var(--success-text)", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20, border: "1px solid var(--success-border)" }}>FREE</span>
              </div>
              <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "var(--ink-soft)" }}>CLAT 2026 pattern · 120 Qs</p>
            </div>
          </div>
          <button onClick={() => onOpenTests?.()} style={{
            background: "linear-gradient(135deg,var(--gold),var(--gold-dark))",
            color: "var(--blue-dark)", border: "none",
            borderRadius: 12, padding: "11px 16px",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 4px 12px rgba(245,166,35,0.35)",
            whiteSpace: "nowrap",
          }}>Attempt →</button>
        </div>
      </div>

      {/* ── AI Zone ── */}
      <div style={{ padding: "26px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--ink-primary)", letterSpacing: "-0.2px" }}>AI-Powered Prep</h3>
          <span style={{ background: "linear-gradient(135deg,var(--blue),var(--blue))", color: "#FFD489", fontSize: 9.5, fontWeight: 800, padding: "3px 9px", borderRadius: 20, letterSpacing: "0.04em" }}>✨ SMART</span>
        </div>
        <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--text-disabled)" }}>Your personal AI toolkit — practice, doubts & more</p>
        <button onClick={() => onToolClick?.("ai-practice")} className="press" style={{
          width: "100%",
          background: "linear-gradient(135deg,var(--blue),var(--blue))",
          borderRadius: 18,
          padding: "14px",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 6px 20px rgba(11,92,255,0.28)",
          cursor: "pointer",
          textAlign: "left",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: "linear-gradient(135deg,var(--gold),var(--gold-dark))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
              boxShadow: "0 4px 12px rgba(245,166,35,0.3)",
            }}>✨</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "var(--surface)" }}>AI Practice</p>
                <span style={{ background: "rgba(245,166,35,0.2)", color: "#FFD489", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20, border: "1px solid rgba(245,166,35,0.35)" }}>NEW</span>
              </div>
              <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "rgba(255,255,255,0.78)" }}>Instant quiz on any topic · with explanations</p>
            </div>
          </div>
          <span style={{
            background: "rgba(255,255,255,0.12)",
            color: "var(--surface)", border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 12, padding: "11px 16px",
            fontSize: 12, fontWeight: 700,
            whiteSpace: "nowrap",
          }}>Start →</span>
        </button>
      </div>

      {/* ── AI Tutor Banner (part of AI Zone) ── */}
      <div style={{ padding: "10px 16px 0" }}>
        <button onClick={() => onOpenTutor?.()} className="press" style={{
          width: "100%",
          background: "white",
          borderRadius: 18,
          padding: "16px",
          border: "1px solid var(--line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 1px 8px rgba(15,23,41,0.06)",
          cursor: "pointer",
          textAlign: "left",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: "linear-gradient(135deg,var(--blue),var(--blue))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, boxShadow: "0 4px 12px rgba(11,92,255,0.25)",
            }}>🤖</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--ink-primary)" }}>AI Tutor</p>
                <span style={{ background: "var(--gold-tint)", color: "var(--gold-700, #a86a06)", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20 }}>24×7</span>
              </div>
              <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "var(--text-muted)" }}>Ask any CLAT doubt · instant answers</p>
            </div>
          </div>
          <span style={{
            background: "linear-gradient(135deg,var(--blue),var(--blue))", color: "white",
            borderRadius: 12, padding: "11px 16px",
            fontSize: 12, fontWeight: 800,
            whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(11,92,255,0.25)",
          }}>Chat →</span>
        </button>
      </div>

      {/* ── 1:1 Slot Booking — headline + pill CTA on the left, illustration
           on the right. ── */}
      <div style={{ padding: "16px 14px 0" }}>
        <button onClick={() => onToolClick?.("slots")} className="press" style={{
          width: "100%",
          background: "var(--surface-dim)",
          borderRadius: 18,
          padding: "14px",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          cursor: "pointer",
          textAlign: "left",
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: "var(--ink)", lineHeight: 1.3 }}>
              {nextBooking ? "Your next 1:1 session" : "Need 1-on-1 help?"}
            </p>
            <p style={{ margin: "3px 0 0", fontSize: 11.5, color: "var(--ink-soft)" }}>
              {nextBooking
                ? `${nextBooking.teacher} · ${fmtBooking(nextBooking.startAt)}`
                : "Book personal doubt & mentorship time"}
            </p>
            <span style={{
              display: "inline-block", marginTop: 10,
              background: "var(--blue)", color: "white",
              borderRadius: 999, padding: "8px 17px",
              fontSize: 12.5, fontWeight: 600,
            }}>{nextBooking ? "View slot" : "Book a slot"}</span>
          </div>

          <SlotArtwork />
        </button>
      </div>

      {/* ── Success Stories — the heading rides in the scroll row as the first
           cell, then portrait video cards follow. ── */}
      <div style={{ background: "var(--surface)", padding: "16px 0", marginTop: 16 }}>
        <div style={{ display: "flex", gap: 14, overflowX: "auto", padding: "0 16px" }} className="no-scroll">
          <div style={{ width: 106, flexShrink: 0, alignSelf: "center" }}>
            {/* Play-strip mark */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 16 }}>
              <div style={{ width: 38, height: 22, borderRadius: 6, background: "var(--line)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--red)"><polygon points="6 4 20 12 6 20 6 4" /></svg>
              </div>
              <div style={{ width: 4, height: 21, borderRadius: 3, background: "var(--border)" }} />
              <div style={{ width: 4, height: 21, borderRadius: 3, background: "var(--surface-dim)" }} />
            </div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--ink)", lineHeight: 1.2 }}>
              Success<br />Stories
            </h3>
            <p style={{ margin: "6px 0 0", fontSize: 11.5, color: "var(--ink-soft)", lineHeight: 1.45 }}>
              Students who inspire us !
            </p>
          </div>

          {stories.map((s, i) => (
            <button key={i} onClick={() => onOpenStories?.()} className="press" style={{
              width: 126, flexShrink: 0,
              aspectRatio: "3 / 4",
              border: "none", padding: 0,
              borderRadius: 20, overflow: "hidden",
              position: "relative", cursor: "pointer",
              background: `linear-gradient(160deg,${s.color},${s.color}AA)`,
            }}>
              {/* Portrait stand-in */}
              <div style={{
                position: "absolute", top: "8%", left: "50%", transform: "translateX(-50%)",
                width: 54, height: 54, borderRadius: "50%",
                background: "rgba(255,255,255,0.22)",
                border: "2px solid rgba(255,255,255,0.45)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 17, fontWeight: 700, color: "white",
              }}>{s.initials}</div>

              {/* Caption plate */}
              <div style={{
                position: "absolute", left: 0, right: 0, bottom: 0, height: "52%",
                background: "linear-gradient(to bottom, rgba(10,14,24,0) 0%, rgba(10,14,24,0.82) 45%, #0A0E18 100%)",
                display: "flex", alignItems: "flex-end",
                padding: "0 12px 13px", textAlign: "left",
              }}>
                <p style={{
                  margin: 0, fontSize: 11, fontWeight: 700, color: "white", lineHeight: 1.3,
                  display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>{s.quote}</p>
              </div>

              {/* Play button */}
              <div style={{
                position: "absolute", top: "55%", left: "50%", transform: "translate(-50%,-50%)",
                width: 34, height: 34, borderRadius: "50%",
                background: "var(--blue)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 14px rgba(10,14,24,0.35)",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="7 4 20 12 7 20 7 4" /></svg>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Current Affairs Strip ── */}
      <div style={{ padding: "22px 14px 0" }}>
        <div style={{
          background: "linear-gradient(135deg,var(--blue-dark),var(--blue))",
          borderRadius: 18,
          padding: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 8px 22px rgba(11,92,255,0.25)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: "rgba(245,166,35,0.16)",
              border: "1px solid rgba(245,166,35,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
            }}>📰</div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "white" }}>Today&apos;s Current Affairs</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.65)" }}>Stay updated for CLAT GK</p>
            </div>
          </div>
          <button onClick={() => onToolClick?.("current-affairs")} className="press" style={{
            background: "linear-gradient(135deg,var(--gold),var(--gold-dark))", color: "var(--blue-dark)",
            border: "none", borderRadius: 12, padding: "10px 16px",
            fontSize: 12, fontWeight: 800, cursor: "pointer",
            boxShadow: "0 4px 12px rgba(245,166,35,0.3)",
          }}>Read →</button>
        </div>
      </div>

      {/* ── Have any questions? ── */}
      <div style={{ padding: "16px 14px 0" }}>
        <div style={{
          background: "var(--surface-dim)",
          borderRadius: 18,
          padding: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: "var(--ink)", lineHeight: 1.3 }}>
              Have any questions?
            </p>
            <a href={`tel:${SUPPORT_PHONE}`} className="press" style={{
              display: "inline-block", marginTop: 10,
              background: "var(--blue)", color: "white",
              borderRadius: 999, padding: "8px 17px",
              fontSize: 12.5, fontWeight: 600, textDecoration: "none",
            }}>Call Us</a>
          </div>

          <QuestionArtwork />
        </div>
      </div>
    </div>
  );
}
