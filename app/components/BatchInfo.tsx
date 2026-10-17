"use client";

import { useState } from "react";
import type { CatalogBatch } from "./CoursesScreen";
import { AppIcon, featureIconName, type IconName } from "./AppIcon";

// ─────────────────────────────────────────────────────────────
// Everything clatians.com says about a batch (about, what you get,
// preparation plan, plans, FAQs, reviews) laid out as app screens.
// Used before purchase (Courses > batch) and after (My Learning > batch).
// ─────────────────────────────────────────────────────────────

export type BatchInfoTab = "overview" | "syllabus" | "plans" | "faqs" | "reviews";

const card: React.CSSProperties = { background: "white", borderRadius: 16, padding: 16, boxShadow: "0 2px 10px rgba(15,23,41,0.06)" };
const gradient = "linear-gradient(135deg,var(--blue-dark),var(--blue))";
const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
/** CLATians counselling line, as listed on the website. */
const HELPLINE = "8507700177";

function Title({ icon, children }: { icon: IconName; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
      <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--blue-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <AppIcon name={icon} size={16} color="var(--blue)" />
      </span>
      <p style={{ flex: 1, margin: 0, fontSize: 14, fontWeight: 800, color: "var(--ink-primary)" }}>{children}</p>
    </div>
  );
}

export function Check({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
      <span style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
        <AppIcon name="check" size={11} strokeWidth={3} color="var(--success-text)" />
      </span>
      <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55 }}>{children}</span>
    </div>
  );
}

function MoreToggle({ open, label, onClick }: { open: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ marginTop: 10, background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 12.5, fontWeight: 800, color: "var(--blue)", display: "flex", alignItems: "center", gap: 4 }}>
      {open ? "Show less" : label}
      <AppIcon name="chevronDown" size={14} color="var(--blue)" style={{ transform: open ? "rotate(180deg)" : "none" }} />
    </button>
  );
}

const hasPlan = (b: CatalogBatch) => (b.details?.strategySections ?? []).some((s) => s.items.length > 0);

/**
 * The batch's FAQs from the website, or, when the website has none for it,
 * the common questions answered from the batch's own details.
 */
export function batchFaqs(b: CatalogBatch): { question: string; answer: string }[] {
  const own = b.details?.faqs ?? [];
  if (own.length > 0) return own;
  const out: { question: string; answer: string }[] = [];
  if (b.startDate) {
    const till = b.endDate ? (/^till\b/i.test(b.endDate) ? ` and runs ${b.endDate.replace(/^till/i, "till")}` : ` and runs till ${b.endDate}`) : "";
    out.push({ question: "When does this batch start and how long does it run?", answer: `${b.name} starts ${b.startDate}${till}.${b.duration ? ` Duration: ${b.duration}.` : ""}` });
  }
  if (b.mode || b.schedule) {
    out.push({ question: "How and when are the classes held?", answer: [b.mode && `Mode: ${b.mode}.`, b.schedule && `Schedule: ${b.schedule}.`].filter(Boolean).join(" ") });
  }
  if (b.language) {
    out.push({ question: "Which language is the batch taught in?", answer: /hinglish|bilingual/i.test(b.language) ? `Classes are taught in ${b.language} (Hindi and English both), so concepts are easy to follow for students from any medium.` : `Classes are taught in ${b.language}.` });
  }
  if (b.fee > 0) {
    out.push({ question: "What is the fee, and is EMI available?", answer: `The batch fee is ${inr(b.fee)}${b.originalFee > b.fee ? ` (regular price ${inr(b.originalFee)})` : ""}.${b.emi ? ` EMI is available at ${b.emi}.` : ""}` });
  }
  if (b.offer) {
    out.push({ question: "Is a scholarship or offer available?", answer: `Yes: ${b.offer}. Talk to our counsellor to check what you are eligible for.` });
  }
  if (b.chips.length > 0) {
    out.push({ question: "What is included in this batch?", answer: `This batch includes ${b.chips.join(", ")}.` });
  }
  if (b.faculty.length > 0) {
    out.push({ question: "Who teaches this batch?", answer: `${b.faculty.join(" and ")}.` });
  }
  out.push({ question: "Whom do I contact for questions?", answer: `Call or WhatsApp the CLATians counselling team on ${HELPLINE}. Counselling is free.` });
  return out;
}

/** The tabs this batch actually has something to show in. */
export function batchInfoTabs(b: CatalogBatch, owned: boolean): { key: BatchInfoTab; label: string }[] {
  const d = b.details ?? {};
  return [
    { key: "overview" as const, label: "Overview", on: true },
    { key: "syllabus" as const, label: "Syllabus", on: b.syllabus.length > 0 || hasPlan(b) },
    { key: "plans" as const, label: "Plans", on: !owned && (d.plans?.length ?? 0) > 0 },
    { key: "faqs" as const, label: "FAQs", on: true },
    { key: "reviews" as const, label: "Reviews", on: (d.reviews?.length ?? 0) > 0 },
  ].filter((t) => t.on).map(({ key, label }) => ({ key, label }));
}

/** Pill-style segmented control that sticks under the header while scrolling. */
export function BatchInfoSwitch({ tabs, active, onChange }: { tabs: { key: BatchInfoTab; label: string }[]; active: BatchInfoTab; onChange: (t: BatchInfoTab) => void }) {
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 4, background: "var(--app-bg)", padding: "10px 16px" }}>
      <div style={{ display: "flex", gap: 4, background: "white", borderRadius: 14, padding: 4, boxShadow: "0 2px 8px rgba(15,23,41,0.06)", overflowX: "auto", scrollbarWidth: "none" }}>
        {tabs.map((t) => {
          const on = t.key === active;
          return (
            <button key={t.key} onClick={() => onChange(t.key)} style={{
              flex: "1 0 auto", border: "none", cursor: "pointer", whiteSpace: "nowrap", borderRadius: 10,
              padding: "9px 12px", fontSize: 12.5, fontWeight: on ? 800 : 600,
              background: on ? gradient : "transparent", color: on ? "white" : "var(--text-muted)",
              boxShadow: on ? "0 3px 10px rgba(11,92,255,0.25)" : "none",
            }}>{t.label}</button>
          );
        })}
      </div>
    </div>
  );
}

// ── Overview ──

export function BatchOverview({ b }: { b: CatalogBatch }) {
  const d = b.details ?? {};
  const facts: { icon: IconName; label: string; value: string }[] = [
    { icon: "calendar" as const, label: "Starts", value: b.startDate },
    { icon: "flag" as const, label: "Till", value: b.endDate },
    { icon: "clock" as const, label: "Duration", value: b.duration },
    { icon: "calendar" as const, label: "Schedule", value: b.schedule },
    { icon: "pin" as const, label: "Mode", value: b.mode },
    { icon: "language" as const, label: "Language", value: b.language },
  ].filter((f) => f.value);
  const phases = (d.aboutStrategy ?? "").split(/→|->/).map((s) => s.trim()).filter(Boolean);
  const [allHi, setAllHi] = useState(false);
  const hi = allHi ? b.highlights : b.highlights.slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {facts.length > 0 && (
        <div style={card}>
          <Title icon="layers">Batch details</Title>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
            {facts.map((f) => (
              <div key={f.label} style={{ background: "var(--app-bg)", borderRadius: 12, padding: "10px 11px", minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 10.5, fontWeight: 700, color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 5 }}>
                  <AppIcon name={f.icon} size={12} color="var(--text-disabled)" />{f.label}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 12.5, fontWeight: 800, color: "var(--ink-primary)", overflowWrap: "anywhere" }}>{f.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(b.description || d.aboutDuration || phases.length > 0) && (
        <div style={card}>
          <Title icon="info">About this batch</Title>
          {b.description && <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>{b.description}</p>}
          {d.aboutDuration && (
            <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
              <AppIcon name="clock" size={14} color="var(--text-muted)" /><span><b style={{ color: "var(--ink-primary)" }}>Duration:</b> {d.aboutDuration}</span>
            </p>
          )}
          {phases.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 800, color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Strategy</p>
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                {phases.map((p, i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ background: "var(--blue-tint)", color: "var(--blue-dark)", fontSize: 11.5, fontWeight: 800, padding: "5px 10px", borderRadius: 20 }}>{i + 1}. {p}</span>
                    {i < phases.length - 1 && <AppIcon name="chevronRight" size={14} color="var(--text-disabled)" />}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {((d.aboutFeatures?.length ?? 0) > 0 || b.chips.length > 0) && (
        <div style={card}>
          <Title icon="gift">What you get</Title>
          {d.aboutFeatures && d.aboutFeatures.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
              {d.aboutFeatures.map((f, i) => (
                <div key={i} style={{ border: "1px solid var(--line)", borderRadius: 14, padding: "12px 11px", minWidth: 0 }}>
                  <span style={{ width: 34, height: 34, borderRadius: 10, background: "var(--blue-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <AppIcon name={featureIconName(f.title)} size={17} color="var(--blue)" />
                  </span>
                  <p style={{ margin: "8px 0 0", fontSize: 12.5, fontWeight: 800, color: "var(--ink-primary)", lineHeight: 1.3 }}>{f.title}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.45 }}>{f.subtitle}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {b.chips.map((c, i) => <Check key={i}>{c}</Check>)}
            </div>
          )}
        </div>
      )}

      {b.highlights.length > 0 && (
        <div style={card}>
          <Title icon="star">Highlights</Title>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {hi.map((h, i) => <Check key={i}>{h}</Check>)}
          </div>
          {b.highlights.length > 5 && <MoreToggle open={allHi} label={`Show all ${b.highlights.length}`} onClick={() => setAllHi(!allHi)} />}
        </div>
      )}

      {b.faculty.length > 0 && (
        <div style={card}>
          <Title icon="user">Faculty</Title>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {b.faculty.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <span style={{ width: 40, height: 40, borderRadius: "50%", background: gradient, color: "white", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {f.replace(/[^A-Za-z ]/g, "").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("")}
                </span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: "var(--ink-primary)" }}>{f}</p>
                  <p style={{ margin: "1px 0 0", fontSize: 11.5, color: "var(--text-muted)" }}>{i === 0 ? "Lead instructor" : "Instructor"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <BatchMoreDetails b={b} />
    </div>
  );
}

/** The website's long "More details" list, collapsed to a few lines until opened. */
export function BatchMoreDetails({ b }: { b: CatalogBatch }) {
  const items = b.details?.moreDetails ?? [];
  const [all, setAll] = useState(false);
  if (items.length === 0) return null;
  const shown = all ? items : items.slice(0, 4);
  return (
    <div style={card}>
      <Title icon="list">More details</Title>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {shown.map((m, i) => <Check key={i}>{m}</Check>)}
      </div>
      {items.length > 4 && <MoreToggle open={all} label={`Read all ${items.length} points`} onClick={() => setAll(!all)} />}
    </div>
  );
}

// ── Syllabus & preparation plan ──

export function BatchSyllabus({ b }: { b: CatalogBatch }) {
  const sections = (b.details?.strategySections ?? []).filter((s) => s.items.length > 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {b.syllabus.length > 0 && (
        <div style={card}>
          <Title icon="book">Subjects covered</Title>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
            {b.syllabus.map((x, i) => (
              <div key={i} style={{ display: "flex", gap: 9, alignItems: "center", background: "var(--app-bg)", borderRadius: 12, padding: "10px", minWidth: 0 }}>
                <span style={{ width: 24, height: 24, borderRadius: 8, background: gradient, color: "white", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-primary)", lineHeight: 1.35 }}>{x}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {sections.length > 0 && (
        <div style={card}>
          <Title icon="compass">Preparation plan</Title>
          <div>
            {sections.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <span style={{ width: 28, height: 28, borderRadius: "50%", background: gradient, color: "white", fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                  {i < sections.length - 1 && <span style={{ flex: 1, width: 2, background: "var(--blue-ghost)", margin: "4px 0" }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0, paddingBottom: i < sections.length - 1 ? 16 : 0 }}>
                  <p style={{ margin: "4px 0 0", fontSize: 13.5, fontWeight: 800, color: "var(--ink-primary)" }}>{s.title}</p>
                  {s.subtitle && <p style={{ margin: "1px 0 0", fontSize: 11.5, fontWeight: 600, color: "var(--blue)" }}>{s.subtitle}</p>}
                  <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 8 }}>
                    {s.items.map((it, j) => <Check key={j}>{it}</Check>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Plans ──

export function BatchPlans({ b }: { b: CatalogBatch }) {
  const plans = b.details?.plans ?? [];
  const [open, setOpen] = useState<number>(plans.length - 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {plans.map((pl, i) => {
        const on = open === i;
        const best = plans.length > 1 && i === plans.length - 1;
        return (
          <div key={i} style={{ ...card, padding: 0, overflow: "hidden", border: on ? "1.5px solid var(--blue)" : "1.5px solid transparent" }}>
            <button onClick={() => setOpen(on ? -1 : i)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {best && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 5, background: "#FFF4E0", color: "#B45309", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 6 }}>
                    <AppIcon name="star" size={10} color="#B45309" fill="#B45309" />MOST POPULAR
                  </span>
                )}
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: "var(--ink-primary)", lineHeight: 1.35 }}>{pl.name}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "var(--text-muted)" }}>{pl.features.length} features included</p>
              </div>
              {pl.price && <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color: "var(--blue)", flexShrink: 0 }}>₹{pl.price.replace(/^₹/, "")}</p>}
            </button>
            {on && (
              <div style={{ borderTop: "1px solid var(--line)", padding: "12px 16px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                {pl.features.map((f, j) => <Check key={j}>{f}</Check>)}
              </div>
            )}
          </div>
        );
      })}
      <p style={{ margin: "0 4px", fontSize: 11.5, color: "var(--text-disabled)", lineHeight: 1.5 }}>Not sure which plan suits you? Talk to our counsellor before you enroll.</p>
    </div>
  );
}

// ── FAQs ──

export function BatchFaqs({ b }: { b: CatalogBatch }) {
  const faqs = batchFaqs(b);
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {faqs.map((f, i) => {
        const on = open === i;
        return (
          <div key={i} style={{ ...card, padding: 0 }}>
            <button onClick={() => setOpen(on ? null : i)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "14px 16px", textAlign: "left" }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--ink-primary)", lineHeight: 1.45 }}>{f.question}</span>
              <span style={{ width: 24, height: 24, borderRadius: "50%", background: on ? "var(--blue)" : "var(--blue-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <AppIcon name="chevronDown" size={14} strokeWidth={2.5} color={on ? "white" : "var(--blue)"} style={{ transform: on ? "rotate(180deg)" : "none" }} />
              </span>
            </button>
            {on && <p style={{ margin: 0, padding: "0 16px 14px", fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.65 }}>{f.answer}</p>}
          </div>
        );
      })}
    </div>
  );
}

// ── Reviews ──

export function BatchReviews({ b }: { b: CatalogBatch }) {
  const reviews = b.details?.reviews ?? [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {reviews.map((r, i) => (
        <div key={i} style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 38, height: 38, borderRadius: "50%", background: gradient, color: "white", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {r.name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("")}
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: "var(--ink-primary)" }}>{r.name}</p>
              {r.badge && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 2, background: "#FFF4E0", color: "#B45309", fontSize: 10.5, fontWeight: 800, padding: "1px 8px", borderRadius: 6 }}>
                  <AppIcon name="award" size={11} color="#B45309" />{r.badge} · CLAT
                </span>
              )}
            </div>
            <span style={{ display: "flex", gap: 1 }}>
              {[0, 1, 2, 3, 4].map((k) => <AppIcon key={k} name="star" size={12} color="#F5A623" fill="#F5A623" />)}
            </span>
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.65 }}>“{r.text}”</p>
        </div>
      ))}
    </div>
  );
}

/** One tab's content. */
export function BatchInfoPanel({ b, tab }: { b: CatalogBatch; tab: BatchInfoTab }) {
  if (tab === "syllabus") return <BatchSyllabus b={b} />;
  if (tab === "plans") return <BatchPlans b={b} />;
  if (tab === "faqs") return <BatchFaqs b={b} />;
  if (tab === "reviews") return <BatchReviews b={b} />;
  return <BatchOverview b={b} />;
}
