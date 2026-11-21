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

/** Top of every inner screen: back button, title, optional subtitle and actions — on the page canvas, like Home. */
export function ScreenHeader({ title, subtitle, onBack, right }: {
  title: string; subtitle?: string; onBack?: () => void; right?: React.ReactNode;
}) {
  return (
    <div style={{ background: "var(--app-bg)", display: "flex", alignItems: "center", gap: 10, padding: "10px 16px 6px" }}>
      {onBack && (
        <button onClick={onBack} aria-label="Back" className="press" style={{ width: 38, height: 38, borderRadius: "50%", border: "1px solid var(--line)", background: "white", boxShadow: "var(--shadow-md)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <AppIcon name="chevronRight" size={18} color="var(--ink)" strokeWidth={2.5} style={{ transform: "rotate(180deg)" }} />
        </button>
      )}
      <span style={{ flex: 1, minWidth: 0 }}>
        {subtitle && <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-soft)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subtitle}</span>}
        <span style={{ display: "block", fontSize: 17, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
      </span>
      {right}
    </div>
  );
}

/** Title of a main tab screen (My Learning, Doubts…): Home's grey kicker over a bold title. */
export function PageTitle({ kicker, title, right }: { kicker?: string; title: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10, padding: "6px 18px 2px" }}>
      <span style={{ minWidth: 0 }}>
        {kicker && <span style={{ display: "block", fontSize: 12.5, color: "var(--ink-soft)", fontWeight: 500 }}>{kicker}</span>}
        <span style={{ display: "block", fontSize: 22, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.02em" }}>{title}</span>
      </span>
      {right}
    </div>
  );
}

/** A round white icon button (bell, share…), as in Home's top bar. */
export function RoundBtn({ icon, label, onClick, dot, onDark }: { icon: IconName; label: string; onClick?: () => void; dot?: boolean; onDark?: boolean }) {
  return (
    <button onClick={onClick} aria-label={label} className="press" style={{
      position: "relative", width: 38, height: 38, borderRadius: "50%", cursor: "pointer", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: onDark ? "rgba(255,255,255,0.16)" : "white",
      border: onDark ? "1px solid rgba(255,255,255,0.22)" : "1px solid var(--line)",
      boxShadow: onDark ? "none" : "var(--shadow-md)",
    }}>
      <AppIcon name={icon} size={18} color={onDark ? "white" : "var(--ink)"} />
      {dot && <span style={{ position: "absolute", top: 7, right: 8, width: 8, height: 8, borderRadius: "50%", background: "#E03131", border: "1.5px solid white" }} />}
    </button>
  );
}

/** Home's hero background: deep blue into bright blue. */
export const heroBg = "linear-gradient(150deg,var(--blue-dark) 0%,var(--blue-dark) 55%,var(--blue) 100%)";

/** Home's hero look as one style: blue gradient with the gold (top-right) and white (bottom-left) glows layered in. */
export const heroSurface: React.CSSProperties = {
  position: "relative", overflow: "hidden", color: "white", borderRadius: 24,
  background: "radial-gradient(circle at 100% 0%, rgba(245,166,35,0.32), transparent 55%), radial-gradient(circle at 0% 100%, rgba(255,255,255,0.14), transparent 50%), " + heroBg,
  boxShadow: "0 10px 28px rgba(11,92,255,0.26)",
};

/** The blue card from the top of Home, with its gold and white glows. Children sit above the glows. */
export function HeroCard({ children, style, padding = 18 }: { children: React.ReactNode; style?: React.CSSProperties; padding?: number | string }) {
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 24, padding, background: heroBg, boxShadow: "0 10px 28px rgba(11,92,255,0.26)", color: "white", ...style }}>
      <div style={{ position: "absolute", right: -50, top: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,166,35,0.30), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: -40, bottom: -70, width: 170, height: 170, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.14), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}

/** Translucent strip inside a HeroCard (stats, progress), like Home's "UP TO 90%" strip. */
export const heroStrip: React.CSSProperties = {
  background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 16,
};

/** Pill tab switcher — white track, blue gradient on the active tab. */
export function Segmented<T extends string>({ tabs, active, onChange, style }: {
  tabs: { key: T; label: string; icon?: IconName }[]; active: T; onChange: (t: T) => void; style?: React.CSSProperties;
}) {
  return (
    <div className="no-scroll" style={{ display: "flex", gap: 4, background: "white", borderRadius: 999, padding: 4, border: "1px solid var(--line)", boxShadow: "var(--shadow-md)", overflowX: "auto", ...style }}>
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <button key={t.key} onClick={() => onChange(t.key)} style={{
            flex: "1 0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, whiteSpace: "nowrap",
            padding: "9px 12px", borderRadius: 999, border: "none", cursor: "pointer",
            background: on ? gradient : "transparent", boxShadow: on ? "0 4px 12px rgba(11,92,255,0.25)" : "none",
            fontSize: 12.5, fontWeight: on ? 700 : 600, color: on ? "white" : "var(--ink-soft)",
          }}>
            {t.icon && <AppIcon name={t.icon} size={14} />}{t.label}
          </button>
        );
      })}
    </div>
  );
}

/** Progress bar. `onDark` for use inside a HeroCard (gold fill). */
export function Progress({ pct, height = 6, onDark }: { pct: number; height?: number; onDark?: boolean }) {
  return (
    <div style={{ height, borderRadius: height, overflow: "hidden", background: onDark ? "rgba(255,255,255,0.16)" : "var(--surface-dim)" }}>
      <div style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: "100%", borderRadius: height, background: onDark ? "linear-gradient(90deg,var(--gold),var(--gold-dark))" : gradient, transition: "width 0.3s" }} />
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
