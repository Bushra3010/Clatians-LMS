"use client";

import { useState } from "react";
import type { CatalogBatch } from "./CoursesScreen";
import { AppIcon, featureIconName, type IconName } from "./AppIcon";

// ─────────────────────────────────────────────────────────────
// The batch page from clatians.com (/courses/[course]/[batch]), rebuilt for
// the app: same sections, same order, same colours per batch type. Icons are
// SVG instead of the website's emoji.
// ─────────────────────────────────────────────────────────────

const HELPLINE = "8507700177";
const WHATSAPP = "https://wa.me/918507700177";

type Palette = { from: string; to: string; accent: string };

const cardPalettes: Record<string, Palette> = {
  "Target Batch": { from: "#0f3460", to: "#1a6b5c", accent: "#08BD80" },
  "Foundation Batch": { from: "#1e3a5f", to: "#1d4ed8", accent: "#3b82f6" },
  "Dream Batch": { from: "#3b1f6b", to: "#7c3aed", accent: "#8b5cf6" },
  "Crash Course": { from: "#7c1d1d", to: "#c2410c", accent: "#f97316" },
  "Starter Pack": { from: "#134e2c", to: "#15803d", accent: "#22c55e" },
  "Pro Pack": { from: "#1e3a8a", to: "#1d4ed8", accent: "#3b82f6" },
  "Ultimate Pack": { from: "#78350f", to: "#b45309", accent: "#f59e0b" },
};
const defaultPalette: Palette = { from: "#060d1f", to: "#0D1837", accent: "#08BD80" };

const batchTypeColors: Record<string, { bg: string; color: string }> = {
  "Target Batch": { bg: "#ccfbf1", color: "#0f766e" },
  "Foundation Batch": { bg: "#dbeafe", color: "#1d4ed8" },
  "Dream Batch": { bg: "#ede9fe", color: "#6d28d9" },
  "Crash Course": { bg: "#ffedd5", color: "#c2410c" },
  "Starter Pack": { bg: "#dcfce7", color: "#15803d" },
  "Pro Pack": { bg: "#dbeafe", color: "#1d4ed8" },
  "Ultimate Pack": { bg: "#fef3c7", color: "#b45309" },
};

const statusConfig: Record<string, { label: string; icon: IconName; bg: string; color: string }> = {
  "filling-fast": { label: "Filling Fast", icon: "flame", bg: "#fef3c7", color: "#92400e" },
  ongoing: { label: "Enrolling Now", icon: "check", bg: "#dcfce7", color: "#166534" },
  upcoming: { label: "Upcoming Batch", icon: "clock", bg: "#e0f2fe", color: "#0369a1" },
};

/** The website shows these when an admin hasn't added reviews for the batch. */
const sampleReviews = [
  { name: "Sumit Kumar", badge: "AIR 34", text: "This batch completely transformed my preparation. Small batch size means A.K. Sir knows every student personally. Highly recommend!" },
  { name: "Pooja Singh", badge: "AIR 78", text: "The schedule is intense but absolutely worth it. Mock tests every week kept me sharp. Cleared in the first attempt." },
  { name: "Rahul Jha", badge: "AIR 112", text: "Faculty is extremely supportive. Doubt sessions are very productive. Materials are comprehensive and exam-focused." },
  { name: "Ananya Das", badge: "AIR 55", text: "I traveled from Kolkata for offline classes — worth every bit. The peer group is amazing, we all cleared together." },
];
const reviewPalette = ["#6366f1", "#ec4899", "#f59e0b", "#14b8a6", "#0ea5e9", "#a855f7"];

const INK = "#0D1837";
const MUTED = "#6B7280";
const LABEL = "#9CA3AF";
const box: React.CSSProperties = { background: "white", borderRadius: 16, padding: 20, border: "1.5px solid #E9EEF2", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" };
const sectionLabel: React.CSSProperties = { margin: "0 0 12px", fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.04em", color: LABEL };
const bigTitle: React.CSSProperties = { margin: "0 0 12px", fontSize: 18, fontWeight: 900, color: INK };

export const paletteFor = (b: CatalogBatch): Palette => cardPalettes[b.batchType] ?? defaultPalette;
const rupees = (n: number) => (n > 0 ? "₹" + n.toLocaleString("en-IN") : "FREE");
const initials = (name: string) => name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "CL";

function Tick({ color, size = 18, round = true }: { color: string; size?: number; round?: boolean }) {
  return (
    <span style={{ width: size, height: size, borderRadius: round ? "50%" : 6, background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
      <AppIcon name="check" size={size * 0.6} strokeWidth={3.5} color="white" />
    </span>
  );
}

function seatInfo(b: CatalogBatch) {
  const open = b.seats >= 999 || b.seats <= 0;
  const left = Math.max(0, b.seats - b.filled);
  const pct = open ? 0 : Math.min(100, Math.round((b.filled / b.seats) * 100));
  return { open, left, pct };
}

// ── Hero ──────────────────────────────────────────────────────

const badgeStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 3, flexShrink: 0, whiteSpace: "nowrap",
  fontSize: 10.5, fontWeight: 700, padding: "4px 9px", borderRadius: 20,
};

/** The batch page's top block. Buying happens from the sticky bar below, so no buttons here. */
export function WebsiteBatchHero({ b, courseName, onBack, enrolled, embedded, hideTitle }: {
  b: CatalogBatch;
  courseName: string;
  onBack?: () => void;
  enrolled?: boolean;
  /** Inside My Learning: no breadcrumb, no buttons. */
  embedded?: boolean;
  /** The screen already shows the badges and title above — start at the key info. */
  hideTitle?: boolean;
}) {
  const p = paletteFor(b);
  const st = statusConfig[b.status] ?? statusConfig.upcoming;
  const typeStyle = batchTypeColors[b.batchType] ?? { bg: "#f3f4f6", color: "#374151" };
  const { open, left, pct } = seatInfo(b);
  const info: { icon: IconName; label: string; val: string }[] = [
    { icon: "calendar" as const, label: "Starts", val: b.startDate },
    { icon: "flag" as const, label: "Ends", val: b.endDate },
    { icon: "clock" as const, label: "Duration", val: b.duration.split("(")[0].trim() },
    { icon: "users" as const, label: "Seats Left", val: open ? "Open" : `${left} / ${b.seats}` },
  ];

  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: embedded ? 16 : 0, background: `linear-gradient(135deg, ${p.from} 0%, ${p.to} 100%)` }}>
      <div style={{ position: "absolute", top: -80, right: -80, width: 260, height: 260, borderRadius: "50%", background: p.accent, opacity: 0.1, filter: "blur(48px)" }} />
      <div style={{ position: "absolute", bottom: 0, left: "25%", width: 160, height: 160, borderRadius: "50%", background: "white", opacity: 0.05, filter: "blur(32px)" }} />

      <div style={{ position: "relative", padding: embedded ? "18px 16px" : "16px 16px 22px" }}>
        {!embedded && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "rgba(255,255,255,0.5)", marginBottom: 16, flexWrap: "wrap" }}>
            {onBack && (
              <button onClick={onBack} aria-label="Back" style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.14)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 4 }}>
                <AppIcon name="chevronRight" size={16} color="white" strokeWidth={2.5} style={{ transform: "rotate(180deg)" }} />
              </button>
            )}
            <span>Courses</span><span>›</span><span>{courseName}</span><span>›</span>
            <span style={{ color: "rgba(255,255,255,0.8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>{b.name}</span>
          </div>
        )}

        {!hideTitle && <>
        {/* Badges — one compact row; once bought, "Enrolled" replaces the enrolment status */}
        <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center", gap: 6, marginBottom: 12, overflowX: "auto", scrollbarWidth: "none" }}>
          {enrolled ? (
            <span style={{ ...badgeStyle, background: "#dcfce7", color: "#166534" }}><AppIcon name="check" size={10} color="#166534" strokeWidth={3} />Enrolled</span>
          ) : (
            <span style={{ ...badgeStyle, background: st.bg, color: st.color }}><AppIcon name={st.icon} size={10} color={st.color} strokeWidth={2.5} />{st.label}</span>
          )}
          {b.batchType && <span style={{ ...badgeStyle, background: typeStyle.bg, color: typeStyle.color }}>{b.batchType}</span>}
          {b.language && <span style={{ ...badgeStyle, background: "rgba(255,255,255,0.15)", color: "white" }}>{b.language}</span>}
        </div>

        <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 900, color: "white", lineHeight: 1.2 }}>{b.name}</h1>
        <p style={{ margin: "0 0 18px", fontSize: 13.5, color: "rgba(255,255,255,0.6)" }}>{[b.exam, b.mode].filter(Boolean).join(" · ")}</p>
        </>}

        {/* Key info grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginBottom: 18 }}>
          {info.map((d) => (
            <div key={d.label} style={{ borderRadius: 12, padding: "11px 14px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>
                <AppIcon name={d.icon} size={11} color="rgba(255,255,255,0.5)" />{d.label}
              </div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "white", overflowWrap: "anywhere" }}>{d.val}</div>
            </div>
          ))}
        </div>

        {/* Seat fill bar */}
        {!open && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
              <span>{left} seats remaining</span><span>{pct}% filled</span>
            </div>
            <div style={{ height: 8, borderRadius: 8, overflow: "hidden", background: "rgba(255,255,255,0.1)" }}>
              <div style={{ width: `${pct}%`, height: "100%", borderRadius: 8, background: pct > 80 ? "#ef4444" : pct > 50 ? "#f59e0b" : p.accent }} />
            </div>
          </div>
        )}

        {/* What's Included */}
        {b.highlights.length > 0 && (
          <div style={{ borderRadius: 16, padding: 18, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ margin: "0 0 4px", fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(255,255,255,0.5)" }}>What&apos;s Included</p>
            {b.highlights.map((h, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
                <Tick color={p.accent} size={20} />
                <span style={{ fontSize: 14, lineHeight: 1.4, color: "rgba(255,255,255,0.85)" }}>{h}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Batch Strategy (phased accordion, as on the website) ───────

const STRATEGY_COLORS = [
  { bar: "#E8B84B", bg: "#FCF7E8" },
  { bar: "#3FBF7F", bg: "#EAF8F0" },
  { bar: "#9B8CEC", bg: "#F1EEFC" },
  { bar: "#EF6B6B", bg: "#FDEDED" },
  { bar: "#5B9BE8", bg: "#EBF3FD" },
];

function BatchStrategy({ sections }: { sections: { title: string; subtitle?: string; items: string[] }[] }) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? sections : sections.slice(0, 3);
  return (
    <div style={box}>
      <p style={sectionLabel}>Batch Strategy</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {visible.map((sec, i) => {
          const c = STRATEGY_COLORS[i % STRATEGY_COLORS.length];
          const expandable = sec.items.length > 0;
          const isOpen = !!open[i];
          return (
            <div key={i} style={{ borderRadius: 12, overflow: "hidden", background: c.bg, borderLeft: `5px solid ${c.bar}` }}>
              <button type="button" onClick={() => expandable && setOpen((o) => ({ ...o, [i]: !o[i] }))} aria-expanded={isOpen}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, textAlign: "left", padding: 16, background: "none", border: "none", cursor: expandable ? "pointer" : "default" }}>
                <span>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 900, color: INK }}>{sec.title}</span>
                  {sec.subtitle && <span style={{ display: "block", fontSize: 12, fontWeight: 600, marginTop: 2, color: c.bar }}>{sec.subtitle}</span>}
                </span>
                {expandable && <AppIcon name="chevronDown" size={18} color={MUTED} strokeWidth={2.5} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} />}
              </button>
              {expandable && isOpen && (
                <ul style={{ listStyle: "none", margin: "-4px 0 0", padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                  {sec.items.map((it, j) => (
                    <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 14, color: "#374151" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.bar, flexShrink: 0, marginTop: 7 }} />
                      <span style={{ lineHeight: 1.4 }}>{it}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      {sections.length > 3 && (
        <button type="button" onClick={() => setShowAll((v) => !v)}
          style={{ width: "100%", marginTop: 12, padding: 12, borderRadius: 12, fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "white", border: "1.5px solid #2563EB", color: "#2563EB", cursor: "pointer" }}>
          {showAll ? "Show Less" : "Show More"}
          <AppIcon name="chevronDown" size={16} color="#2563EB" strokeWidth={2.5} style={{ transform: showAll ? "rotate(180deg)" : "none" }} />
        </button>
      )}
    </div>
  );
}

// ── Body ──────────────────────────────────────────────────────

export function WebsiteBatchBody({ b, onEnroll, enrolled, hidePlans, hideCta }: {
  b: CatalogBatch;
  onEnroll?: () => void;
  enrolled?: boolean;
  /** Already bought: plan prices aren't relevant any more. */
  hidePlans?: boolean;
  hideCta?: boolean;
}) {
  const p = paletteFor(b);
  const d = b.details ?? {};
  const { open, left } = seatInfo(b);
  const chips = b.chips.filter((c) => c.trim());
  const sourceReviews = (d.reviews ?? []).filter((r) => r.name?.trim() && r.text?.trim());
  const reviews = (sourceReviews.length > 0 ? sourceReviews : sampleReviews).map((r, i) => ({ ...r, color: reviewPalette[i % reviewPalette.length] }));
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* About + Faculty */}
      {(b.description || b.faculty.length > 0) && (
        <div style={box}>
          {b.description && <p style={{ margin: "0 0 14px", fontSize: 15, lineHeight: 1.65, color: "#4B5563" }}>{b.description}</p>}
          {b.faculty.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, paddingTop: 12, borderTop: "1px solid #F3F4F6" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: LABEL, marginRight: 2 }}>Faculty:</span>
              {b.faculty.map((f) => (
                <span key={f} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px 6px 6px", borderRadius: 20, background: "#F0FDF9", border: "1px solid #C6F3E4" }}>
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: p.accent, color: "white", fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{initials(f)}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#0f766e" }}>{f}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Special Features */}
      {(d.aboutDuration || d.aboutStrategy || (d.aboutFeatures?.length ?? 0) > 0) && (
        <div style={box}>
          <p style={sectionLabel}>Special Features</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {d.aboutDuration && <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}><b style={{ color: INK }}>Duration: </b><span style={{ color: MUTED }}>{d.aboutDuration}</span></p>}
            {d.aboutStrategy && <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}><b style={{ color: INK }}>Batch Strategy: </b><span style={{ color: MUTED }}>{d.aboutStrategy}</span></p>}
          </div>
          {d.aboutFeatures && d.aboutFeatures.length > 0 && (
            <div style={{ marginTop: d.aboutDuration || d.aboutStrategy ? 16 : 0, paddingTop: d.aboutDuration || d.aboutStrategy ? 16 : 0, borderTop: d.aboutDuration || d.aboutStrategy ? "1px solid #F3F4F6" : "none" }}>
              {d.aboutFeaturesLabel && <p style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: INK }}>{d.aboutFeaturesLabel}</p>}
              {/* Two compact tiles per row, so six features fit in one screen */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                {d.aboutFeatures.map((f, i) => (
                  <div key={i} style={{ borderRadius: 12, padding: "10px 10px 11px", background: "#F8FAFC", border: "1px solid #E9EEF2", minWidth: 0 }}>
                    <span style={{ width: 28, height: 28, borderRadius: 8, background: `${p.accent}1F`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 7 }}>
                      <AppIcon name={featureIconName(f.title)} size={15} color={p.accent} strokeWidth={2.2} />
                    </span>
                    <p style={{ margin: 0, fontSize: 12.5, fontWeight: 800, lineHeight: 1.3, color: INK }}>{f.title}</p>
                    {f.subtitle && <p style={{ margin: "3px 0 0", fontSize: 11, lineHeight: 1.35, color: MUTED, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{f.subtitle}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Batch Strategy */}
      {(d.strategySections?.length ?? 0) > 0 && <BatchStrategy sections={d.strategySections!} />}

      {/* Batch Includes */}
      {chips.length > 0 && (
        <div style={box}>
          <p style={sectionLabel}>Batch Includes</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {chips.map((chip) => (
              <div key={chip} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 12, background: "#F0FDF9", border: "1px solid #C6F3E4" }}>
                <Tick color={p.accent} size={16} />
                <span style={{ fontSize: 15, fontWeight: 600, color: "#0f766e" }}>{chip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Plans */}
      {!hidePlans && (d.plans?.length ?? 0) > 0 && (
        <div>
          <p style={{ ...bigTitle, margin: "0 0 4px" }}>Choose Your Plan</p>
          <p style={{ margin: "0 0 12px", fontSize: 14, color: MUTED }}>Pick the plan that fits your preparation needs.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {d.plans!.map((plan, i) => (
              <div key={i} style={{ ...box, display: "flex", flexDirection: "column" }}>
                <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 900, color: INK }}>{plan.name}</p>
                <p style={{ margin: "0 0 12px", fontSize: 24, fontWeight: 900, color: p.accent }}>{plan.price && !plan.price.trim().startsWith("₹") ? `₹${plan.price}` : plan.price}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {plan.features.map((f, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <Tick color={p.accent} size={16} />
                      <span style={{ fontSize: 14, lineHeight: 1.4, color: "#374151" }}>{f}</span>
                    </div>
                  ))}
                </div>
                <a href={`tel:${HELPLINE}`} style={{ display: "block", textAlign: "center", padding: 11, borderRadius: 12, fontSize: 14, fontWeight: 700, color: "white", textDecoration: "none", background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}>Select Plan</a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* More Details — numbered points */}
      {(d.moreDetails?.length ?? 0) > 0 && (
        <div style={box}>
          <p style={sectionLabel}>More Details</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {d.moreDetails!.map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <span style={{ width: 24, height: 24, borderRadius: 8, background: p.accent, color: "white", fontSize: 11, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ fontSize: 14, lineHeight: 1.6, color: "#374151" }}>{m}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student Reviews */}
      <div>
        <p style={bigTitle}>Student Reviews</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reviews.map((r) => (
            <div key={r.name} style={{ background: "white", borderRadius: 16, padding: 16, border: "1.5px solid #E9EEF2" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ width: 40, height: 40, borderRadius: "50%", background: r.color, color: "white", fontSize: 14, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{initials(r.name)}</span>
                <div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, lineHeight: 1.2, color: INK }}>{r.name}</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#08BD80" }}>{r.badge} · CLAT</p>
                </div>
                <span style={{ marginLeft: "auto", display: "flex", gap: 1 }}>
                  {[0, 1, 2, 3, 4].map((k) => <AppIcon key={k} name="star" size={13} color="#f59e0b" fill="#f59e0b" />)}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: MUTED }}>{r.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs */}
      {(d.faqs?.length ?? 0) > 0 && (
        <div>
          <p style={bigTitle}>Frequently Asked Questions</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {d.faqs!.map((faq, i) => {
              const on = openFaq === i;
              return (
                <div key={i} style={{ background: "white", borderRadius: 16, padding: 16, border: "1.5px solid #E9EEF2" }}>
                  <button type="button" onClick={() => setOpenFaq(on ? null : i)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", fontSize: 14, fontWeight: 700, color: INK }}>
                    <span>{faq.question}</span>
                    <AppIcon name="close" size={16} color={p.accent} strokeWidth={2.5} style={{ transform: on ? "rotate(0deg)" : "rotate(45deg)", transition: "transform .2s" }} />
                  </button>
                  {on && <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.6, color: MUTED }}>{faq.answer}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CTA Banner */}
      {!hideCta && (
        <div style={{ borderRadius: 16, padding: 20, background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}>
          <p style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 900, color: "white" }}>{enrolled ? "You're in this batch" : "Ready to Join This Batch?"}</p>
          <p style={{ margin: "0 0 14px", fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
            {enrolled ? "Your chapters, notes and live classes are in My Learning." : `${open ? "Enrollment open." : `Only ${left} seats left.`} Secure your spot now.`}
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a href={`tel:${HELPLINE}`} style={{ padding: "10px 18px", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "white", textDecoration: "none", background: p.accent, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <AppIcon name="phone" size={14} />Call Now
            </a>
            {onEnroll && (
              <button onClick={onEnroll} style={{ padding: "10px 18px", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "white", background: "transparent", border: "1px solid rgba(255,255,255,0.25)", cursor: "pointer" }}>
                {enrolled ? "Start learning" : "Enroll Online"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mobile sticky bar ────────────────────────────────────────

export function WebsiteBatchStickyBar({ b, onEnroll, enrolled }: { b: CatalogBatch; onEnroll: () => void; enrolled?: boolean }) {
  const p = paletteFor(b);
  const { open, left, pct } = seatInfo(b);
  const full = !enrolled && !open && left === 0;
  return (
    <div style={{ position: "sticky", bottom: 0, zIndex: 6, padding: "0 12px 10px" }}>
      <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 12px 30px rgba(0,0,0,0.25)", background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}>
        <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: "white", lineHeight: 1 }}>{enrolled ? "Enrolled" : rupees(b.fee)}</div>
            <div style={{ fontSize: 11, marginTop: 3, color: "rgba(255,255,255,0.6)" }}>
              {enrolled ? "Full access in My Learning" : `${!open ? `${left} seats left · ` : ""}${b.emi || ""}`}
            </div>
          </div>
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp" style={{ padding: "10px 13px", borderRadius: 12, background: "rgba(255,255,255,0.15)", display: "flex" }}>
            <AppIcon name="chat" size={17} color="white" />
          </a>
          <button onClick={onEnroll} disabled={full} style={{ padding: "11px 18px", borderRadius: 12, border: "none", cursor: full ? "default" : "pointer", fontSize: 14, fontWeight: 900, color: "white", background: p.accent, display: "flex", alignItems: "center", gap: 6, opacity: full ? 0.5 : 1 }}>
            {enrolled ? "Open" : full ? "Full" : "Enroll"}<AppIcon name="arrowRight" size={15} />
          </button>
        </div>
        {!open && (
          <div style={{ height: 4, background: "rgba(255,255,255,0.1)" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: pct > 80 ? "#ef4444" : pct > 50 ? "#f59e0b" : p.accent }} />
          </div>
        )}
      </div>
    </div>
  );
}
