"use client";

import { AppIcon, type IconName } from "../AppIcon";

// ─────────────────────────────────────────────────────────────
// The app's look, taken from the Home screen, in one place: page header,
// section titles, cards, icon tiles, empty states and buttons. Every inner
// screen builds from these so the whole app reads as one product.
// ─────────────────────────────────────────────────────────────

export const gradient = "linear-gradient(135deg,var(--blue-dark),var(--blue))";

/** A white card: the basic block of every screen. */
export const card: React.CSSProperties = {
  background: "white", borderRadius: 18, boxShadow: "var(--shadow-md)", border: "1px solid var(--line)",
};

/** Main action — blue gradient, as on Home. */
export const primaryBtn: React.CSSProperties = {
  background: gradient, color: "white", border: "none", borderRadius: 14, padding: "13px 16px",
  fontSize: 14, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
  boxShadow: "0 6px 16px rgba(11,92,255,0.22)",
};

/** Secondary action — outlined, like Home's "Explore more". */
export const outlineBtn: React.CSSProperties = {
  background: "white", color: "var(--blue)", border: "1.5px solid var(--blue)", borderRadius: 14, padding: "12px 16px",
  fontSize: 13.5, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
};

/** Small action inside a card row. */
export const smallBtn: React.CSSProperties = {
  background: "var(--blue-tint)", color: "var(--blue)", border: "none", borderRadius: 10, padding: "8px 14px",
  fontSize: 12.5, fontWeight: 800, cursor: "pointer", flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5,
};

/** Highlight action — Home's gold "Register Now". */
export const goldBtn: React.CSSProperties = {
  background: "linear-gradient(135deg,var(--gold),var(--gold-dark))", color: "var(--ink)", border: "none", borderRadius: 14,
  padding: "13px 16px", fontSize: 14, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
};

/** Text input / textarea. */
export const input: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", border: "1.5px solid var(--line-strong)", borderRadius: 12, padding: "11px 12px",
  fontSize: 16, fontFamily: "inherit", color: "var(--ink)", background: "white", outline: "none",
};

/** The page canvas under the header. */
export const page: React.CSSProperties = { background: "var(--app-bg)", minHeight: "100%", paddingBottom: 28 };
export const body: React.CSSProperties = { padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 12 };

/** Top of every inner screen: back button, title, optional subtitle and actions. */
export function ScreenHeader({ title, subtitle, onBack, right }: {
  title: string; subtitle?: string; onBack?: () => void; right?: React.ReactNode;
}) {
  return (
    <div style={{ background: "white", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }}>
      {onBack && (
        <button onClick={onBack} aria-label="Back" style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "var(--app-bg)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <AppIcon name="chevronRight" size={19} color="var(--ink)" strokeWidth={2.5} style={{ transform: "rotate(180deg)" }} />
        </button>
      )}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 17, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
        {subtitle && <span style={{ display: "block", fontSize: 12, color: "var(--ink-soft)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subtitle}</span>}
      </span>
      {right}
    </div>
  );
}

/** Section heading, Home style: a small grey line over a bold title. */
export function SectionTitle({ kicker, title, right }: { kicker?: string; title: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10, margin: "8px 2px 0" }}>
      <span>
        {kicker && <span style={{ display: "block", fontSize: 12.5, color: "var(--ink-soft)", fontWeight: 500 }}>{kicker}</span>}
        <span style={{ display: "block", fontSize: 18, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.02em" }}>{title}</span>
      </span>
      {right}
    </div>
  );
}

export type Tone = "blue" | "gold" | "green" | "purple" | "red" | "teal" | "grey";
const TONES: Record<Tone, { bg: string; fg: string }> = {
  blue: { bg: "var(--blue-tint)", fg: "var(--blue)" },
  gold: { bg: "var(--gold-tint)", fg: "var(--gold-dark)" },
  green: { bg: "var(--success)", fg: "var(--success-text)" },
  purple: { bg: "var(--purple-tint)", fg: "var(--purple)" },
  red: { bg: "var(--error)", fg: "var(--error-text)" },
  teal: { bg: "var(--teal-bg)", fg: "var(--teal-text)" },
  grey: { bg: "var(--surface-dim)", fg: "var(--text-muted)" },
};

/** A tinted square holding a line icon — what the app shows instead of emoji. */
export function IconTile({ icon, tone = "blue", size = 42, solid = false }: { icon: IconName; tone?: Tone; size?: number; solid?: boolean }) {
  const t = TONES[tone];
  return (
    <span style={{ width: size, height: size, borderRadius: Math.round(size * 0.3), flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: solid ? gradient : t.bg }}>
      <AppIcon name={icon} size={Math.round(size * 0.46)} color={solid ? "white" : t.fg} />
    </span>
  );
}

/** Nothing to show yet. */
export function EmptyState({ icon, title, text, action }: { icon: IconName; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div style={{ ...card, padding: "28px 18px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <IconTile icon={icon} size={56} />
      <p style={{ margin: "12px 0 0", fontSize: 14.5, fontWeight: 800, color: "var(--ink)" }}>{title}</p>
      {text && <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.55 }}>{text}</p>}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}

/** Small rounded label. */
export function Pill({ children, tone = "blue" }: { children: React.ReactNode; tone?: Tone }) {
  const t = TONES[tone];
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 20, background: t.bg, color: t.fg, whiteSpace: "nowrap" }}>{children}</span>;
}
