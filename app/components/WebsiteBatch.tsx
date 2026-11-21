"use client";

import { useState } from "react";
import type { CatalogBatch } from "./CoursesScreen";
import { AppIcon, featureIconName, type IconName } from "./AppIcon";
import * as kit from "./ui/kit";

// ─────────────────────────────────────────────────────────────
// The batch page from clatians.com (/courses/[course]/[batch]), rebuilt for
// the app: same sections, same order. Styled like Home — blue gradient cards
// with gold accents, white rounded cards, line icons instead of emoji.
// ─────────────────────────────────────────────────────────────

const HELPLINE = "8507700177";
const WHATSAPP = "https://wa.me/918507700177";

type Palette = { from: string; to: string; accent: string };

// Per-type colours, kept for My Learning's batch thumbnails (paletteFor).
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
export const paletteFor = (b: CatalogBatch): Palette => cardPalettes[b.batchType] ?? defaultPalette;

/** Home's hero gradient — every dark surface on this page uses it. */
const HERO_BG = "linear-gradient(150deg,var(--blue-dark) 0%,var(--blue-dark) 55%,var(--blue) 100%)";
const GOLD_BG = "linear-gradient(135deg,var(--gold),var(--gold-dark))";

const statusConfig: Record<string, { label: string; icon: IconName; tone: kit.Tone }> = {
  "filling-fast": { label: "Filling Fast", icon: "flame", tone: "gold" },
  ongoing: { label: "Enrolling Now", icon: "check", tone: "green" },
  upcoming: { label: "Upcoming Batch", icon: "clock", tone: "blue" },
};

/** The website shows these when an admin hasn't added reviews for the batch. */
const sampleReviews = [
  { name: "Sumit Kumar", badge: "AIR 34", text: "This batch completely transformed my preparation. Small batch size means A.K. Sir knows every student personally. Highly recommend!" },
  { name: "Pooja Singh", badge: "AIR 78", text: "The schedule is intense but absolutely worth it. Mock tests every week kept me sharp. Cleared in the first attempt." },
  { name: "Rahul Jha", badge: "AIR 112", text: "Faculty is extremely supportive. Doubt sessions are very productive. Materials are comprehensive and exam-focused." },
  { name: "Ananya Das", badge: "AIR 55", text: "I traveled from Kolkata for offline classes — worth every bit. The peer group is amazing, we all cleared together." },
];
const reviewPalette = ["var(--blue)", "var(--purple)", "var(--gold-dark)", "var(--teal-text)", "var(--blue-dark)", "var(--green)"];

const INK = "var(--ink)";
const MUTED = "var(--ink-soft)";
const box: React.CSSProperties = { ...kit.card, padding: 16 };
const sectionHead: React.CSSProperties = { margin: "0 0 12px", fontSize: 16, fontWeight: 800, color: INK, letterSpacing: "-0.01em", display: "flex", alignItems: "center", gap: 8 };

const rupees = (n: number) => (n > 0 ? "₹" + n.toLocaleString("en-IN") : "FREE");
const initials = (name: string) => name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "CL";

function Tick({ color = "var(--green)", size = 18 }: { color?: string; size?: number }) {
  return (
    <span style={{ width: size, height: size, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
      <AppIcon name="check" size={size * 0.6} strokeWidth={3.5} color="white" />
    </span>
  );
}

/** Card heading with a small icon tile, like Home's section rows. */
function Head({ icon, children }: { icon: IconName; children: React.ReactNode }) {
  return <p style={sectionHead}><kit.IconTile icon={icon} size={30} />{children}</p>;
}

function seatInfo(b: CatalogBatch) {
  const open = b.seats >= 999 || b.seats <= 0;
  const left = Math.max(0, b.seats - b.filled);
  const pct = open ? 0 : Math.min(100, Math.round((b.filled / b.seats) * 100));
  return { open, left, pct };
}
const barColor = (pct: number) => (pct > 80 ? "#ef4444" : GOLD_BG);

/** Gold and white glows from Home's hero card. */
function Glows() {
  return <>
    <div style={{ position: "absolute", right: -50, top: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,166,35,0.30), transparent 70%)", pointerEvents: "none" }} />
    <div style={{ position: "absolute", left: -40, bottom: -70, width: 170, height: 170, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.14), transparent 70%)", pointerEvents: "none" }} />
  </>;
}

// ── Hero ──────────────────────────────────────────────────────

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
  const st = statusConfig[b.status] ?? statusConfig.upcoming;
  const { open, left, pct } = seatInfo(b);
  const info: { icon: IconName; label: string; val: string }[] = [
    { icon: "calendar" as const, label: "Starts", val: b.startDate },
    { icon: "flag" as const, label: "Ends", val: b.endDate },
    { icon: "clock" as const, label: "Duration", val: b.duration.split("(")[0].trim() },
    { icon: "users" as const, label: "Seats Left", val: open ? "Open" : `${left} / ${b.seats}` },
  ];

  const card = (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: embedded ? 18 : 24, background: HERO_BG, boxShadow: embedded ? "none" : "0 10px 28px rgba(11,92,255,0.28)", padding: embedded ? "16px" : "18px 18px 18px" }}>
      <Glows />
      <div style={{ position: "relative" }}>
        {!hideTitle && <>
          {/* Badges — once bought, "Enrolled" replaces the enrolment status */}
          <div className="no-scroll" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, overflowX: "auto" }}>
            {enrolled ? <kit.Pill tone="green"><AppIcon name="check" size={10} strokeWidth={3} />Enrolled</kit.Pill>
              : <kit.Pill tone={st.tone}><AppIcon name={st.icon} size={10} strokeWidth={2.5} />{st.label}</kit.Pill>}
            {b.batchType && <span style={{ flexShrink: 0, background: "#CFFB6B", color: "var(--blue-dark)", fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 8, whiteSpace: "nowrap" }}>{b.batchType}</span>}
            {b.language && <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.15)", color: "white", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap" }}><AppIcon name="language" size={11} />{b.language}</span>}
          </div>
          <h1 style={{ margin: "0 0 4px", fontSize: 23, fontWeight: 700, color: "white", lineHeight: 1.25, letterSpacing: "-0.01em" }}>{b.name}</h1>
          <p style={{ margin: "0 0 16px", fontSize: 13.5, color: "rgba(255,255,255,0.72)" }}>{[b.exam, b.mode].filter(Boolean).join(" · ")}</p>
        </>}

        {/* Key info — Home's translucent stat tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, marginBottom: 14 }}>
          {info.map((d) => (
            <div key={d.label} style={{ borderRadius: 14, padding: "10px 12px", background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.16)", minWidth: 0, display: "flex", gap: 9, alignItems: "center" }}>
              <span style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <AppIcon name={d.icon} size={15} color="var(--gold)" />
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 10.5, color: "rgba(255,255,255,0.6)" }}>{d.label}</span>
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "white", overflowWrap: "anywhere", lineHeight: 1.25 }}>{d.val || "—"}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Seat fill bar */}
        {!open && (
          <div style={{ marginBottom: b.highlights.length > 0 ? 14 : 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.68)", marginBottom: 6 }}>
              <span>{left} seats remaining</span><span style={{ color: "var(--gold)", fontWeight: 700 }}>{pct}% filled</span>
            </div>
            <div style={{ height: 6, borderRadius: 6, overflow: "hidden", background: "rgba(255,255,255,0.14)" }}>
              <div style={{ width: `${pct}%`, height: "100%", borderRadius: 6, background: barColor(pct) }} />
            </div>
          </div>
        )}

        {/* What's Included */}
        {b.highlights.length > 0 && (
          <div style={{ borderRadius: 16, padding: 14, background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.16)", display: "flex", flexDirection: "column", gap: 9 }}>
            <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.6)" }}>What&apos;s Included</p>
            {b.highlights.map((h, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <Tick color="var(--gold)" size={18} />
                <span style={{ fontSize: 13.5, lineHeight: 1.4, color: "rgba(255,255,255,0.9)" }}>{h}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) return card;
  return (
    <div>
      {/* Back + breadcrumb, on the page canvas like Home's header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px 10px", minWidth: 0 }}>
        {onBack && (
          <button onClick={onBack} aria-label="Back" className="press" style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--line)", background: "white", boxShadow: "var(--shadow-md)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AppIcon name="chevronRight" size={18} color="var(--ink)" strokeWidth={2.5} style={{ transform: "rotate(180deg)" }} />
          </button>
        )}
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={{ display: "block", fontSize: 11.5, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Courses › {courseName}</span>
          <span style={{ display: "block", fontSize: 15, fontWeight: 800, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Batch details</span>
        </span>
      </div>
      <div style={{ padding: "0 16px" }}>{card}</div>
    </div>
  );
}

// ── Batch Strategy (phased accordion, as on the website) ───────

const STRATEGY_COLORS = [
  { bar: "var(--blue)", bg: "var(--blue-tint)" },
  { bar: "var(--gold-dark)", bg: "var(--gold-tint)" },
  { bar: "var(--green)", bg: "var(--success)" },
  { bar: "var(--purple)", bg: "var(--purple-tint)" },
  { bar: "var(--teal-text)", bg: "var(--teal-bg)" },
];

function BatchStrategy({ sections }: { sections: { title: string; subtitle?: string; items: string[] }[] }) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? sections : sections.slice(0, 3);
  return (
    <div style={box}>
      <Head icon="layers">Batch Strategy</Head>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {visible.map((sec, i) => {
          const c = STRATEGY_COLORS[i % STRATEGY_COLORS.length];
          const expandable = sec.items.length > 0;
          const isOpen = !!open[i];
          return (
            <div key={i} style={{ borderRadius: 14, overflow: "hidden", background: c.bg, borderLeft: `4px solid ${c.bar}` }}>
              <button type="button" onClick={() => expandable && setOpen((o) => ({ ...o, [i]: !o[i] }))} aria-expanded={isOpen}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, textAlign: "left", padding: 14, background: "none", border: "none", cursor: expandable ? "pointer" : "default" }}>
                <span>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: INK }}>{sec.title}</span>
                  {sec.subtitle && <span style={{ display: "block", fontSize: 12, fontWeight: 600, marginTop: 2, color: c.bar }}>{sec.subtitle}</span>}
                </span>
                {expandable && <AppIcon name="chevronDown" size={18} color={MUTED} strokeWidth={2.5} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} />}
              </button>
              {expandable && isOpen && (
                <ul style={{ listStyle: "none", margin: "-4px 0 0", padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                  {sec.items.map((it, j) => (
                    <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13.5, color: "var(--text-secondary)" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.bar, flexShrink: 0, marginTop: 7 }} />
                      <span style={{ lineHeight: 1.45 }}>{it}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      {sections.length > 3 && (
        <button type="button" onClick={() => setShowAll((v) => !v)} className="press" style={{ ...kit.outlineBtn, width: "100%", marginTop: 12, borderRadius: 999 }}>
          {showAll ? "Show Less" : "Show More"}
          <AppIcon name="chevronDown" size={16} strokeWidth={2.5} style={{ transform: showAll ? "rotate(180deg)" : "none" }} />
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
  const d = b.details ?? {};
  const { open, left } = seatInfo(b);
  const chips = b.chips.filter((c) => c.trim());
  const sourceReviews = (d.reviews ?? []).filter((r) => r.name?.trim() && r.text?.trim());
  const reviews = (sourceReviews.length > 0 ? sourceReviews : sampleReviews).map((r, i) => ({ ...r, color: reviewPalette[i % reviewPalette.length] }));
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* About + Faculty */}
      {(b.description || b.faculty.length > 0) && (
        <div style={box}>
          <Head icon="info">About this batch</Head>
          {b.description && <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: MUTED }}>{b.description}</p>}
          {b.faculty.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, paddingTop: 12, marginTop: b.description ? 14 : 0, borderTop: b.description ? "1px solid var(--line)" : "none" }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: MUTED, marginRight: 2 }}>Faculty</span>
              {b.faculty.map((f) => (
                <span key={f} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 11px 5px 5px", borderRadius: 20, background: "var(--blue-tint)" }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: kit.gradient, color: "white", fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{initials(f)}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--blue)" }}>{f}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Special Features */}
      {(d.aboutDuration || d.aboutStrategy || (d.aboutFeatures?.length ?? 0) > 0) && (
        <div style={box}>
          <Head icon="sparkle">Special Features</Head>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {d.aboutDuration && <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6 }}><b style={{ color: INK }}>Duration: </b><span style={{ color: MUTED }}>{d.aboutDuration}</span></p>}
            {d.aboutStrategy && <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6 }}><b style={{ color: INK }}>Batch Strategy: </b><span style={{ color: MUTED }}>{d.aboutStrategy}</span></p>}
          </div>
          {d.aboutFeatures && d.aboutFeatures.length > 0 && (
            <div style={{ marginTop: d.aboutDuration || d.aboutStrategy ? 14 : 0, paddingTop: d.aboutDuration || d.aboutStrategy ? 14 : 0, borderTop: d.aboutDuration || d.aboutStrategy ? "1px solid var(--line)" : "none" }}>
              {d.aboutFeaturesLabel && <p style={{ margin: "0 0 10px", fontSize: 13.5, fontWeight: 700, color: INK }}>{d.aboutFeaturesLabel}</p>}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                {d.aboutFeatures.map((f, i) => (
                  <div key={i} style={{ borderRadius: 14, padding: "11px 11px 12px", background: "var(--app-bg)", border: "1px solid var(--line)", minWidth: 0 }}>
                    <span style={{ marginBottom: 8, display: "block" }}><kit.IconTile icon={featureIconName(f.title)} size={30} /></span>
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
          <Head icon="checkCircle">Batch Includes</Head>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
            {chips.map((chip) => (
              <div key={chip} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 12, background: "var(--success)", border: "1px solid var(--success-border)", minWidth: 0 }}>
                <Tick size={16} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--success-text)", lineHeight: 1.3 }}>{chip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Plans */}
      {!hidePlans && (d.plans?.length ?? 0) > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <kit.SectionTitle kicker="Pick what fits your preparation" title="Choose your plan" />
          {d.plans!.map((plan, i) => (
            <div key={i} style={{ ...box, display: "flex", flexDirection: "column" }}>
              <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 800, color: INK }}>{plan.name}</p>
              <p style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 800, color: "var(--blue)" }}>{plan.price && !plan.price.trim().startsWith("₹") ? `₹${plan.price}` : plan.price}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                {plan.features.map((f, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <Tick size={16} />
                    <span style={{ fontSize: 13.5, lineHeight: 1.4, color: "var(--text-secondary)" }}>{f}</span>
                  </div>
                ))}
              </div>
              <a href={`tel:${HELPLINE}`} className="press" style={{ ...kit.primaryBtn, textDecoration: "none" }}>Select Plan</a>
            </div>
          ))}
        </div>
      )}

      {/* More Details — numbered points */}
      {(d.moreDetails?.length ?? 0) > 0 && (
        <div style={box}>
          <Head icon="list">More Details</Head>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {d.moreDetails!.map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <span style={{ width: 26, height: 26, borderRadius: 8, background: "var(--blue-tint)", color: "var(--blue)", fontSize: 11, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--text-secondary)" }}>{m}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student Reviews — sideways cards, as on Home */}
      <div>
        <kit.SectionTitle kicker="What toppers say" title="Student reviews" />
        <div className="no-scroll" style={{ display: "flex", gap: 10, overflowX: "auto", margin: "12px -16px 0", padding: "0 16px 10px", scrollSnapType: "x mandatory" }}>
          {reviews.map((r) => (
            <div key={r.name} style={{ ...box, flex: "0 0 82%", scrollSnapAlign: "start", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ width: 40, height: 40, borderRadius: "50%", background: r.color, color: "white", fontSize: 14, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{initials(r.name)}</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 800, lineHeight: 1.2, color: INK }}>{r.name}</p>
                  <span style={{ display: "inline-block", marginTop: 3 }}><kit.Pill tone="gold"><AppIcon name="trophy" size={10} />{r.badge} · CLAT</kit.Pill></span>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: MUTED, flex: 1 }}>{r.text}</p>
              <span style={{ display: "flex", gap: 2, marginTop: 10 }}>
                {[0, 1, 2, 3, 4].map((k) => <AppIcon key={k} name="star" size={13} color="var(--gold)" fill="var(--gold)" />)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs */}
      {(d.faqs?.length ?? 0) > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <kit.SectionTitle kicker="Got questions?" title="Frequently asked" />
          {d.faqs!.map((faq, i) => {
            const on = openFaq === i;
            return (
              <div key={i} style={{ ...box, padding: 14, border: on ? "1px solid var(--blue)" : box.border }}>
                <button type="button" onClick={() => setOpenFaq(on ? null : i)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", fontSize: 13.5, fontWeight: 700, color: INK }}>
                  <span>{faq.question}</span>
                  <span style={{ width: 26, height: 26, borderRadius: "50%", background: on ? kit.gradient : "var(--blue-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <AppIcon name="plus" size={14} color={on ? "white" : "var(--blue)"} strokeWidth={2.6} style={{ transform: on ? "rotate(45deg)" : "none", transition: "transform .2s" }} />
                  </span>
                </button>
                {on && <p style={{ margin: "10px 0 0", fontSize: 13.5, lineHeight: 1.6, color: MUTED }}>{faq.answer}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* CTA Banner — Home's blue card with the gold button */}
      {!hideCta && (
        <div style={{ position: "relative", overflow: "hidden", borderRadius: 22, padding: 18, background: HERO_BG, boxShadow: "0 8px 24px rgba(11,92,255,0.28)" }}>
          <Glows />
          <div style={{ position: "relative" }}>
            <p style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "white" }}>{enrolled ? "You're in this batch" : <>Ready to <span style={{ color: "var(--gold)" }}>join</span> this batch?</>}</p>
            <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "rgba(255,255,255,0.72)" }}>
              {enrolled ? "Your chapters, notes and live classes are in My Learning." : `${open ? "Enrollment open." : `Only ${left} seats left.`} Secure your spot now.`}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <a href={`tel:${HELPLINE}`} className="press" style={{ ...kit.goldBtn, flex: 1, padding: "12px 14px", fontSize: 13.5, textDecoration: "none" }}>
                <AppIcon name="phone" size={15} />Call Now
              </a>
              {onEnroll && (
                <button onClick={onEnroll} className="press" style={{ flex: 1, padding: "12px 14px", borderRadius: 14, fontSize: 13.5, fontWeight: 800, color: "white", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.28)", cursor: "pointer" }}>
                  {enrolled ? "Start learning" : "Enroll Online"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mobile sticky bar ────────────────────────────────────────

export function WebsiteBatchStickyBar({ b, onEnroll, enrolled }: { b: CatalogBatch; onEnroll: () => void; enrolled?: boolean }) {
  const { open, left, pct } = seatInfo(b);
  const full = !enrolled && !open && left === 0;
  return (
    <div style={{ position: "sticky", bottom: 0, zIndex: 6, padding: "0 12px 10px" }}>
      <div style={{ ...kit.card, borderRadius: 20, overflow: "hidden", boxShadow: "0 12px 30px rgba(15,23,41,0.18)" }}>
        <div style={{ padding: "11px 12px 11px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: enrolled ? "var(--success-text)" : INK, lineHeight: 1.1, letterSpacing: "-0.01em" }}>{enrolled ? "Enrolled" : rupees(b.fee)}</div>
            <div style={{ fontSize: 11, marginTop: 3, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {enrolled ? "Full access in My Learning" : `${!open ? `${left} seats left · ` : ""}${b.emi || ""}`}
            </div>
          </div>
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp" className="press" style={{ width: 44, height: 44, borderRadius: 14, background: "var(--blue-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AppIcon name="chat" size={19} color="var(--blue)" />
          </a>
          <button onClick={onEnroll} disabled={full} className="press" style={{ ...kit.primaryBtn, padding: "12px 18px", opacity: full ? 0.5 : 1, cursor: full ? "default" : "pointer", flexShrink: 0 }}>
            {enrolled ? "Open" : full ? "Full" : "Enroll"}<AppIcon name="arrowRight" size={15} strokeWidth={2.4} />
          </button>
        </div>
        {!open && (
          <div style={{ height: 4, background: "var(--surface-dim)" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: barColor(pct) }} />
          </div>
        )}
      </div>
    </div>
  );
}
