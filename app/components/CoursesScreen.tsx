"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { pushBack, goBack } from "../lib/back-stack";
import type { BatchDetails } from "../lib/catalog/batches";

/** A cohort of a course — what a student actually joins and pays for. */
export type CatalogBatch = {
  id: string;
  slug: string;
  name: string;
  exam: string;
  batchCode: string;
  startDate: string;
  endDate: string;
  duration: string;
  schedule: string;
  mode: string;
  seats: number;
  filled: number;
  fee: number;
  originalFee: number;
  emi: string;
  offer: string;
  status: string;
  language: string;
  batchType: string;
  chips: string[];
  faculty: string[];
  highlights: string[];
  syllabus: string[];
  description: string;
  details: BatchDetails;
  enrolled: boolean;
};

/**
 * A course as shown in the app. Everything from `category` down mirrors the
 * course's row on the CLATians website, so the app and the site describe the
 * same product; the counts below come from the LMS's own content and classes.
 */
export type CatalogItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  category: string;
  icon: string;
  color: string;
  bg: string;
  tagline: string;
  overview: string;
  duration: string;
  batchSize: string;
  mode: string;
  feeText: string;
  emi: string;
  features: string[];
  includes: { label: string; value: string; icon: string }[];
  curriculum: { module: string; topics: string[] }[];
  whoFor: string[];
  testimonial: { name: string; rank: string; college: string; quote: string; avatar: string } | null;
  enrolled: boolean;
  contentCount: number;
  classCount: number;
  testCount: number;
  breakdown: { videos: number; notes: number; practice: number; currentAffairs: number };
  contents: { type: string; title: string }[];
  batches: CatalogBatch[];
};

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

const METHODS = [
  { id: "upi", icon: "📱", label: "UPI / GPay / PhonePe", sub: "Instant" },
  { id: "card", icon: "💳", label: "Credit / Debit Card", sub: "Visa, Mastercard, Rupay" },
  { id: "netbanking", icon: "🏦", label: "Net Banking", sub: "All major banks" },
];

const gradient = "linear-gradient(135deg,var(--blue-dark),var(--blue))";

/** The website's four modes of study — the top level of the catalog. */
const MODES = [
  { key: "offline", label: "Offline Course", icon: "🏫" },
  { key: "online", label: "Online Course", icon: "💻" },
  { key: "mentorship", label: "Mentorship", icon: "🎯" },
  { key: "mock", label: "Mock Tests", icon: "📝" },
] as const;

type ContentKey = "videos" | "notes" | "practice" | "current-affairs";
type Mode = "mine" | (typeof MODES)[number]["key"];

/** What the student is buying — one batch, or a whole course that has no batches. */
type Target = { kind: "course"; course: CatalogItem } | { kind: "batch"; course: CatalogItem; batch: CatalogBatch };

const targetName = (t: Target) => (t.kind === "batch" ? t.batch.name : t.course.name);
const targetPrice = (t: Target) => (t.kind === "batch" ? t.batch.fee : t.course.price);

const liveBatches = (c: CatalogItem) => c.batches.filter((b) => b.status !== "archived");
const seatsLeft = (b: CatalogBatch) => (b.seats > 0 ? Math.max(0, b.seats - b.filled) : null);
const pctOff = (b: CatalogBatch) => (b.originalFee > b.fee && b.originalFee > 0 ? Math.round(((b.originalFee - b.fee) / b.originalFee) * 100) : 0);

function BackBar({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "var(--ink-primary)", fontSize: 14, fontWeight: 700, padding: "14px 16px 4px", maxWidth: "100%" }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-primary)" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}><polyline points="15 18 9 12 15 6" /></svg>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
    </button>
  );
}

function Chevron() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6" /></svg>
  );
}

function Tick({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
      <span style={{ color: "var(--green)", fontSize: 14, lineHeight: 1.5, flexShrink: 0 }}>✓</span>
      <span style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.55 }}>{children}</span>
    </div>
  );
}

/** Fee block: current price, struck-through list price and the discount. */
function Price({ b, size = 22 }: { b: CatalogBatch; size?: number }) {
  const off = pctOff(b);
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 7, flexWrap: "wrap" }}>
        <span style={{ fontSize: size, fontWeight: 900, color: b.fee === 0 ? "var(--green)" : "var(--ink-primary)" }}>{b.fee === 0 ? "FREE" : inr(b.fee)}</span>
        {b.originalFee > b.fee && <span style={{ fontSize: 12.5, color: "var(--text-disabled)", textDecoration: "line-through" }}>{inr(b.originalFee)}</span>}
        {off > 0 && <span style={{ fontSize: 11, fontWeight: 800, color: "var(--success-text)" }}>{off}% off</span>}
      </div>
      {b.emi && b.fee > 0 && <p style={{ margin: "1px 0 0", fontSize: 11, color: "var(--text-disabled)" }}>or {b.emi}</p>}
    </div>
  );
}

export type EnrollResult = { ok: boolean; invoiceNo?: string; amount?: number; error?: string };

interface CoursesScreenProps {
  catalog: CatalogItem[];
  onEnroll: (courseId: string, method: string) => Promise<EnrollResult>;
  onEnrollBatch?: (batchId: string, method: string) => Promise<EnrollResult>;
  onOpenContent?: (key: ContentKey) => void;
  onOpenTests?: () => void;
  onOpenStudy?: () => void;
  initialTab?: "all" | "mine";
  /** The course the student picked to head their home screen. */
  selectedCourseId?: string | null;
  onSelectCourse?: (courseId: string) => Promise<void>;
}

type View =
  | { name: "list" }
  | { name: "course"; course: CatalogItem }
  | { name: "batch"; course: CatalogItem; batch: CatalogBatch }
  | { name: "checkout"; target: Target }
  | { name: "success"; target: Target; invoiceNo: string; amount: number };

export default function CoursesScreen({ catalog, onEnroll, onEnrollBatch, onOpenStudy, initialTab = "all", selectedCourseId = null, onSelectCourse }: CoursesScreenProps) {
  const [choosing, setChoosing] = useState(false);
  const mine = useMemo(() => catalog.filter((c) => c.enrolled || c.batches.some((b) => b.enrolled)), [catalog]);
  // Only offer the modes that actually have courses behind them.
  const modes = useMemo(() => MODES.filter((m) => catalog.some((c) => c.category === m.key)), [catalog]);
  const [mode, setMode] = useState<Mode>(initialTab === "mine" && mine.length > 0 ? "mine" : modes[0]?.key ?? "offline");
  const [view, setView] = useState<View>({ name: "list" });
  const [method, setMethod] = useState("upi");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showAbout, setShowAbout] = useState(false);

  const shown = mode === "mine" ? mine : catalog.filter((c) => c.category === mode);

  // The catalog prop refreshes after a purchase; always render the fresh copy
  // of whatever course/batch the view points at.
  const fresh = (c: CatalogItem) => catalog.find((x) => x.id === c.id) ?? c;
  const freshBatch = (c: CatalogItem, b: CatalogBatch) => fresh(c).batches.find((x) => x.id === b.id) ?? b;

  // Course → batch → checkout are steps the phone's back gesture should undo
  // one at a time (see back-stack.ts). Steps left behind when this screen
  // unmounts are skipped by the stack.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const viewRef = useRef<View>(view);
  const show = (v: View) => { viewRef.current = v; setView(v); };
  const go = (v: View) => {
    const prev = viewRef.current;
    pushBack(() => show(prev), () => mounted.current);
    show(v);
  };
  const back = () => goBack(() => show({ name: "list" }));

  const openCourse = (course: CatalogItem) => {
    setShowAbout(false);
    go({ name: "course", course });
  };
  const openBatch = (course: CatalogItem, batch: CatalogBatch) => {
    setOpenFaq(null);
    go({ name: "batch", course, batch });
  };
  const startCheckout = (target: Target) => {
    setError("");
    setMethod("upi");
    go({ name: "checkout", target });
  };

  const pay = async (target: Target) => {
    setPaying(true);
    setError("");
    const res = target.kind === "batch" && onEnrollBatch
      ? await onEnrollBatch(target.batch.id, method)
      : await onEnroll(target.course.id, method);
    setPaying(false);
    if (res.ok) {
      show({ name: "success", target, invoiceNo: res.invoiceNo ?? "", amount: res.amount ?? targetPrice(target) });
    } else {
      setError(res.error ?? "Payment failed. Please try again.");
    }
  };

  // ── SUCCESS ──
  if (view.name === "success") {
    return (
      <div style={{ background: "var(--app-bg)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 72, marginBottom: 12 }}>🎉</div>
        <div style={{ background: gradient, borderRadius: 24, padding: "26px 22px", width: "100%", maxWidth: 340, marginBottom: 20, boxShadow: "0 12px 36px rgba(61,36,17,0.35)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 14px" }}>✅</div>
          <p style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 900, color: "white" }}>You&apos;re enrolled!</p>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{targetName(view.target)}</p>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 16, padding: "12px 16px" }}>
            {[
              { label: "Amount paid", value: view.amount > 0 ? inr(view.amount) : "FREE" },
              { label: "Invoice", value: view.invoiceNo || "—" },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: i === 0 ? 8 : 0, paddingBottom: i === 0 ? 8 : 0, borderBottom: i === 0 ? "1px solid rgba(255,255,255,0.12)" : "none" }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{r.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
        <p style={{ margin: "0 0 18px", fontSize: 12.5, color: "var(--text-muted)", maxWidth: 300 }}>
          Your batch&apos;s subjects, topic videos, notes, tests and live classes are now unlocked in the Study tab.
        </p>
        <button onClick={() => { show({ name: "list" }); setMode("mine"); }} style={{
          background: gradient, color: "white", border: "none", borderRadius: 16,
          padding: "15px 28px", fontSize: 15, fontWeight: 800, cursor: "pointer",
          boxShadow: "0 6px 16px rgba(61,36,17,0.35)",
        }}>Go to My Courses</button>
      </div>
    );
  }

  // ── BATCH DETAIL — everything about one batch, and where it's bought ──
  if (view.name === "batch") {
    const c = fresh(view.course);
    const b = freshBatch(view.course, view.batch);
    const d = b.details ?? {};
    const left = seatsLeft(b);
    const full = left === 0;
    const pct = b.seats > 0 ? Math.min(100, Math.round((b.filled / b.seats) * 100)) : 0;
    const facts = [
      { icon: "📅", label: "Starts", value: b.startDate },
      { icon: "🏁", label: "Till", value: b.endDate },
      { icon: "⏱", label: "Duration", value: b.duration },
      { icon: "🕒", label: "Schedule", value: b.schedule },
      { icon: "📍", label: "Mode", value: b.mode },
      { icon: "🗣", label: "Language", value: b.language },
    ].filter((f) => f.value);

    return (
      <div style={{ background: "var(--app-bg)", minHeight: "100vh" }}>
        <BackBar label={c.name} onClick={back} />

        <div style={{ padding: "0 16px 16px" }}>
          {/* Hero */}
          <div style={{ background: gradient, borderRadius: 20, padding: "20px", color: "white", boxShadow: "0 8px 24px rgba(61,36,17,0.3)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: -24, top: -24, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {b.batchType && <span style={heroChip}>{b.batchType}</span>}
              {b.language && <span style={heroChip}>{b.language}</span>}
              {b.enrolled && <span style={{ ...heroChip, background: "var(--green)" }}>✓ ENROLLED</span>}
            </div>
            <h2 style={{ margin: "12px 0 0", fontSize: 20, fontWeight: 900, lineHeight: 1.3 }}>{b.name}</h2>
            <p style={{ margin: "5px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.8)" }}>{c.icon} {c.name}{b.batchCode ? ` · ${b.batchCode}` : ""}</p>
          </div>

          {/* Fee */}
          <div style={cardStyle}>
            <p style={cardTitle}>Batch fee</p>
            <Price b={b} size={26} />
            {b.offer && (
              <p style={{ margin: "10px 0 0", fontSize: 11.5, fontWeight: 700, color: "var(--success-text)", background: "var(--success)", border: "1px solid var(--success-border)", borderRadius: 8, padding: "6px 10px", display: "inline-block" }}>🎁 {b.offer}</p>
            )}
            {b.seats > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: left !== null && left <= 5 ? "var(--error-text)" : "var(--text-muted)" }}>
                    {full ? "Batch full" : left !== null && left <= 5 ? `Only ${left} seats left!` : `${left} seats left`}
                  </span>
                  <span>{b.filled}/{b.seats} filled</span>
                </div>
                <div style={{ height: 6, background: "var(--bg-secondary)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: pct >= 80 ? "var(--error-text)" : "var(--green)" }} />
                </div>
              </div>
            )}
          </div>

          {/* Key facts */}
          {facts.length > 0 && (
            <div style={cardStyle}>
              <p style={cardTitle}>Batch details</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                {facts.map((f) => (
                  <div key={f.label} style={{ background: "var(--bg-secondary)", border: "1px solid var(--gold-100)", borderRadius: 12, padding: "9px 11px", minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 10.5, color: "var(--text-disabled)" }}>{f.icon} {f.label}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12.5, fontWeight: 800, color: "var(--ink-primary)", overflowWrap: "anywhere" }}>{f.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* About */}
          {(b.description || d.aboutDuration || d.aboutStrategy) && (
            <div style={cardStyle}>
              <p style={cardTitle}>About this batch</p>
              {b.description && <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>{b.description}</p>}
              {d.aboutDuration && <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "var(--text-secondary)" }}><b style={{ color: "var(--ink-primary)" }}>Duration:</b> {d.aboutDuration}</p>}
              {d.aboutStrategy && <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "var(--text-secondary)" }}><b style={{ color: "var(--ink-primary)" }}>Strategy:</b> {d.aboutStrategy}</p>}
            </div>
          )}

          {/* What you get */}
          {(b.chips.length > 0 || (d.aboutFeatures?.length ?? 0) > 0) && (
            <div style={cardStyle}>
              <p style={cardTitle}>What you get</p>
              {b.chips.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: d.aboutFeatures?.length ? 12 : 0 }}>
                  {b.chips.map((x, i) => <span key={i} style={softChip}>{x}</span>)}
                </div>
              )}
              {d.aboutFeatures && d.aboutFeatures.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                  {d.aboutFeatures.map((f, i) => (
                    <div key={i} style={{ background: "var(--bg-secondary)", border: "1px solid var(--gold-100)", borderRadius: 12, padding: "10px 11px" }}>
                      <p style={{ margin: 0, fontSize: 12.5, fontWeight: 800, color: "var(--ink-primary)" }}>{f.title}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.45 }}>{f.subtitle}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {b.highlights.length > 0 && (
            <div style={cardStyle}>
              <p style={cardTitle}>Highlights</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {b.highlights.map((h, i) => <Tick key={i}>{h}</Tick>)}
              </div>
            </div>
          )}

          {b.syllabus.length > 0 && (
            <div style={cardStyle}>
              <p style={cardTitle}>Subjects covered</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {b.syllabus.map((x, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: i < b.syllabus.length - 1 ? "1px solid var(--gold-100)" : "none" }}>
                    <span style={{ width: 24, height: 24, borderRadius: 7, background: "var(--info-border)", color: "var(--blue)", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{x}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {d.strategySections && d.strategySections.some((s) => s.items.length > 0) && (
            <div style={cardStyle}>
              <p style={cardTitle}>Preparation plan</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {d.strategySections.filter((s) => s.items.length > 0).map((s, i) => (
                  <div key={i}>
                    <p style={{ margin: "0 0 6px", fontSize: 12.5, fontWeight: 800, color: "var(--ink-primary)" }}>
                      {s.title}{s.subtitle ? <span style={{ fontWeight: 600, color: "var(--text-disabled)" }}> · {s.subtitle}</span> : null}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {s.items.map((it, j) => <Tick key={j}>{it}</Tick>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {d.plans && d.plans.length > 0 && (
            <div style={cardStyle}>
              <p style={cardTitle}>Plans in this batch</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {d.plans.map((pl, i) => (
                  <div key={i} style={{ border: "1.5px solid var(--gold-100)", borderRadius: 14, padding: "12px 13px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "var(--ink-primary)" }}>{pl.name}</p>
                      {pl.price && <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "var(--blue)", flexShrink: 0 }}>₹{pl.price.replace(/^₹/, "")}</p>}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                      {pl.features.map((f, j) => <span key={j} style={softChip}>{f}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {b.faculty.length > 0 && (
            <div style={cardStyle}>
              <p style={cardTitle}>Faculty</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {b.faculty.map((f, i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--bg-secondary)", border: "1px solid var(--gold-100)", borderRadius: 20, padding: "5px 11px 5px 5px", fontSize: 12, fontWeight: 700, color: "var(--ink-primary)" }}>
                    <span style={{ width: 24, height: 24, borderRadius: "50%", background: gradient, color: "white", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{f.replace(/[^A-Za-z ]/g, "").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("")}</span>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {d.moreDetails && d.moreDetails.length > 0 && (
            <div style={cardStyle}>
              <p style={cardTitle}>More details</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {d.moreDetails.map((m, i) => <Tick key={i}>{m}</Tick>)}
              </div>
            </div>
          )}

          {d.reviews && d.reviews.length > 0 && (
            <div style={cardStyle}>
              <p style={cardTitle}>What students say</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {d.reviews.map((r, i) => (
                  <div key={i} style={{ background: "var(--bg-secondary)", border: "1px solid var(--gold-100)", borderRadius: 12, padding: "11px 12px" }}>
                    <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6, fontStyle: "italic" }}>“{r.text}”</p>
                    <p style={{ margin: "6px 0 0", fontSize: 11.5, fontWeight: 800, color: "var(--ink-primary)" }}>{r.name}{r.badge ? <span style={{ color: "var(--text-disabled)", fontWeight: 600 }}> · {r.badge}</span> : null}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {d.faqs && d.faqs.length > 0 && (
            <div style={cardStyle}>
              <p style={cardTitle}>FAQs</p>
              {d.faqs.map((f, i) => (
                <div key={i} style={{ borderBottom: i < d.faqs!.length - 1 ? "1px solid var(--gold-100)" : "none" }}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 10, padding: "10px 0", textAlign: "left", fontSize: 12.5, fontWeight: 700, color: "var(--ink-primary)" }}>
                    {f.question}<span style={{ color: "var(--blue)", flexShrink: 0 }}>{openFaq === i ? "−" : "+"}</span>
                  </button>
                  {openFaq === i && <p style={{ margin: "0 0 10px", fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>{f.answer}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sticky buy bar — the batch's price lives here */}
        <div style={stickyBar}>
          <Price b={b} size={20} />
          {b.enrolled ? (
            <button onClick={() => onOpenStudy?.()} style={{ ...primaryBtn, background: "var(--success)", color: "var(--success-text)", boxShadow: "none", border: "1px solid var(--success-border)" }}>Start learning →</button>
          ) : (
            <button onClick={() => startCheckout({ kind: "batch", course: c, batch: b })} disabled={full} style={{ ...primaryBtn, opacity: full ? 0.5 : 1, cursor: full ? "not-allowed" : "pointer" }}>
              {full ? "Batch full" : b.fee === 0 ? "Join free" : "Enroll now →"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── COURSE — pick a batch ──
  if (view.name === "course") {
    const c = fresh(view.course);
    const batches = liveBatches(c);
    const facts = [
      { label: "Duration", value: c.duration },
      { label: "Batch size", value: c.batchSize },
      { label: "Mode", value: c.mode },
    ].filter((f) => f.value);

    return (
      <div style={{ background: "var(--app-bg)", minHeight: "100vh", paddingBottom: 28 }}>
        <BackBar label="Courses" onClick={back} />

        <div style={{ padding: "0 16px" }}>
          <div style={{ background: "white", borderRadius: 18, padding: "16px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: 15, background: gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>{c.icon}</div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 10.5, fontWeight: 800, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{MODES.find((m) => m.key === c.category)?.label ?? c.category}</p>
                <h2 style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 900, color: "var(--ink-primary)" }}>{c.name}</h2>
              </div>
            </div>
            {c.tagline && <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.55 }}>{c.tagline}</p>}
            {facts.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 10, fontSize: 11.5, color: "var(--text-muted)", fontWeight: 600 }}>
                {facts.map((f) => <span key={f.label}>{f.label}: <b style={{ color: "var(--ink-primary)" }}>{f.value}</b></span>)}
              </div>
            )}
            {/* Make this the course that heads the home screen */}
            {onSelectCourse && (
              selectedCourseId === c.id ? (
                <p style={{ margin: "12px 0 0", fontSize: 12.5, fontWeight: 800, color: "var(--success-text)", background: "var(--success)", border: "1px solid var(--success-border)", borderRadius: 10, padding: "8px 12px", display: "inline-block" }}>
                  ✓ This is your course
                </p>
              ) : (
                <button
                  onClick={async () => { setChoosing(true); await onSelectCourse(c.id); setChoosing(false); }}
                  disabled={choosing}
                  style={{ display: "block", marginTop: 12, width: "100%", background: "var(--info-border)", color: "var(--blue)", border: "1.5px solid var(--blue)", borderRadius: 12, padding: "11px", fontSize: 13.5, fontWeight: 800, cursor: "pointer", opacity: choosing ? 0.6 : 1 }}
                >
                  {choosing ? "Saving…" : "Choose this course"}
                </button>
              )
            )}
            {(c.overview || c.curriculum.length > 0 || c.features.length > 0) && (
              <button onClick={() => setShowAbout(!showAbout)} style={{ marginTop: 12, background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 12.5, fontWeight: 800, color: "var(--blue)" }}>
                {showAbout ? "Hide course info ▲" : "About this course ▼"}
              </button>
            )}
            {showAbout && (
              <div style={{ marginTop: 10, borderTop: "1px solid var(--gold-100)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 12 }}>
                {c.overview && <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.7 }}>{c.overview}</p>}
                {c.features.length > 0 && <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>{c.features.map((f, i) => <Tick key={i}>{f}</Tick>)}</div>}
                {c.curriculum.map((m, i) => (
                  <div key={i}>
                    <p style={{ margin: "0 0 4px", fontSize: 12.5, fontWeight: 800, color: "var(--ink-primary)" }}>{m.module}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.55 }}>{m.topics.join(" · ")}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p style={{ margin: "20px 2px 10px", fontSize: 12, fontWeight: 800, color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {batches.length > 0 ? `Choose your batch (${batches.length})` : "Batches"}
          </p>

          {batches.length === 0 && (
            <div style={{ ...cardStyle, marginTop: 0 }}>
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.6 }}>No batch is scheduled for this course right now.{c.price > 0 || c.enrolled ? " You can still take the full course:" : " Contact us for the next batch."}</p>
              {(c.price > 0 || c.enrolled) && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 12 }}>
                  <div>
                    <span style={{ fontSize: 22, fontWeight: 900, color: "var(--ink-primary)" }}>{inr(c.price)}</span>
                    {c.emi && <p style={{ margin: 0, fontSize: 11, color: "var(--text-disabled)" }}>or {c.emi}</p>}
                  </div>
                  {c.enrolled
                    ? <button onClick={() => onOpenStudy?.()} style={{ ...primaryBtn, background: "var(--success)", color: "var(--success-text)", boxShadow: "none" }}>Start learning →</button>
                    : <button onClick={() => startCheckout({ kind: "course", course: c })} style={primaryBtn}>Enroll now →</button>}
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {batches.map((b) => {
              const left = seatsLeft(b);
              return (
                <div key={b.id} onClick={() => openBatch(c, b)} style={{ background: "white", borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", cursor: "pointer" }}>
                  <div style={{ background: gradient, padding: "14px 16px", position: "relative" }}>
                    <div style={{ position: "absolute", right: -18, top: -18, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {b.batchType && <span style={heroChip}>{b.batchType}</span>}
                      {b.language && <span style={heroChip}>{b.language}</span>}
                      {b.status === "filling-fast" && <span style={{ ...heroChip, background: "#F97316" }}>🔥 HOT</span>}
                      {b.enrolled && <span style={{ ...heroChip, background: "var(--green)" }}>✓ ENROLLED</span>}
                    </div>
                    <p style={{ margin: "10px 0 0", fontSize: 15.5, fontWeight: 900, color: "white", lineHeight: 1.3 }}>{b.name}</p>
                    {(b.startDate || b.endDate) && (
                      <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "rgba(255,255,255,0.78)" }}>📅 {[b.startDate, b.endDate].filter(Boolean).join(" · ")}</p>
                    )}
                  </div>
                  <div style={{ padding: "13px 16px 15px" }}>
                    {left !== null && (
                      <p style={{ margin: "0 0 10px", fontSize: 11.5, fontWeight: 700, color: left <= 5 ? "var(--error-text)" : "var(--success-text)" }}>
                        ● {left === 0 ? "Batch full" : left <= 5 ? `Only ${left} seats left!` : `${left} seats available`}
                      </p>
                    )}
                    {b.offer && <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "var(--success-text)" }}>🎁 {b.offer}</p>}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, borderTop: "1px solid var(--gold-100)", paddingTop: 12 }}>
                      <Price b={b} />
                      <span style={{ ...primaryBtn, padding: "10px 16px", fontSize: 13 }}>{b.enrolled ? "Open →" : "View details →"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── CHECKOUT ──
  if (view.name === "checkout") {
    const t = view.target;
    const price = targetPrice(t);
    const gst = Math.round(price * 0.18);
    const total = price + gst;
    const subtitle = t.kind === "batch"
      ? [t.course.name, t.batch.duration].filter(Boolean).join(" · ")
      : `${t.course.contentCount} study items · ${t.course.classCount} classes`;
    return (
      <div style={{ background: "var(--app-bg)", paddingBottom: 30, minHeight: "100vh" }}>
        <BackBar label="Checkout" onClick={back} />

        <div style={{ padding: "0 16px" }}>
          <div style={{ background: "white", borderRadius: 18, padding: "16px", marginBottom: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
            <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800, color: "var(--ink-primary)" }}>Order Summary</p>
            <div style={{ display: "flex", gap: 12, alignItems: "center", paddingBottom: 12, borderBottom: "1px solid var(--surface-dim)", marginBottom: 12 }}>
              <div style={{ width: 50, height: 50, borderRadius: 16, background: gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{t.course.icon}</div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--ink-primary)" }}>{targetName(t)}</p>
                <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--text-disabled)" }}>{subtitle}</p>
              </div>
            </div>
            {price > 0 ? (
              <>
                {[[t.kind === "batch" ? "Batch fee" : "Course fee", inr(price)], ["GST (18%)", inr(gst)]].map(([l, v], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{l}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-primary)" }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid var(--surface-dim)" }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "var(--ink-primary)" }}>Total</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: "var(--blue)" }}>{inr(total)}</span>
                </div>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--green)" }}>Free — no payment needed</p>
            )}
          </div>

          {price > 0 && (
            <div style={{ background: "white", borderRadius: 18, padding: "16px", marginBottom: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
              <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "var(--ink-primary)" }}>Payment Method</p>
              {METHODS.map((m) => (
                <div key={m.id} onClick={() => setMethod(m.id)} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                  borderRadius: 12, marginBottom: 8, cursor: "pointer",
                  border: `1.5px solid ${method === m.id ? "var(--blue)" : "var(--border)"}`,
                  background: method === m.id ? "var(--info-border)" : "white",
                }}>
                  <span style={{ fontSize: 22 }}>{m.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--ink-primary)" }}>{m.label}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "var(--text-disabled)" }}>{m.sub}</p>
                  </div>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${method === m.id ? "var(--blue)" : "#D1D5DB"}`, background: method === m.id ? "var(--blue)" : "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {method === m.id && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "white" }} />}
                  </div>
                </div>
              ))}
              <div style={{ background: "var(--warning)", borderRadius: 10, padding: "8px 12px", marginTop: 4 }}>
                <p style={{ margin: 0, fontSize: 11, color: "#92400E" }}>🧪 Test mode — this is a simulated payment. No real money is charged.</p>
              </div>
            </div>
          )}

          {error && <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--error-text)", background: "var(--error)", border: "1px solid var(--success-border)", borderRadius: 10, padding: "10px 12px" }}>{error}</p>}

          <button onClick={() => pay(t)} disabled={paying} style={{
            width: "100%", background: gradient, color: "white", border: "none",
            borderRadius: 16, padding: "16px", fontSize: 16, fontWeight: 800,
            cursor: paying ? "default" : "pointer", opacity: paying ? 0.7 : 1,
            boxShadow: "0 6px 18px rgba(61,36,17,0.35)",
          }}>
            {paying ? "Processing…" : price > 0 ? `Pay ${inr(total)}` : "Enroll Free"}
          </button>
        </div>
      </div>
    );
  }

  // ── LIST — mode of study, then the courses in it ──
  const tabs: { key: Mode; label: string; count: number }[] = [
    ...(mine.length > 0 ? [{ key: "mine" as Mode, label: "⭐ My Courses", count: mine.length }] : []),
    ...modes.map((m) => ({ key: m.key as Mode, label: `${m.icon} ${m.label}`, count: catalog.filter((c) => c.category === m.key).length })),
  ];

  return (
    <div style={{ background: "var(--app-bg)", paddingBottom: 24 }}>
      <div style={{ background: "white", padding: "16px 16px 0", borderBottom: "1px solid var(--border)" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "var(--ink-primary)" }}>Courses</h2>
        <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "var(--text-muted)" }}>Pick a mode, then a course, then your batch</p>
        <div style={{ display: "flex", gap: 7, paddingBottom: 14, overflowX: "auto", scrollbarWidth: "none" }}>
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setMode(t.key)} style={{
              padding: "9px 14px", borderRadius: 20, fontSize: 12.5, fontWeight: 700,
              border: "none", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
              display: "flex", alignItems: "center", gap: 6,
              background: mode === t.key ? "var(--blue)" : "var(--bg-secondary)",
              color: mode === t.key ? "white" : "var(--text-secondary)",
            }}>
              {t.label}
              <span style={{ fontSize: 10.5, fontWeight: 800, padding: "1px 7px", borderRadius: 10, background: mode === t.key ? "rgba(255,255,255,0.22)" : "white" }}>{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        <p style={{ margin: "0 2px 10px", fontSize: 12, fontWeight: 800, color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {mode === "mine" ? "Your courses" : "Select a course"}
        </p>

        {shown.length === 0 && (
          <p style={{ margin: "10px 0", fontSize: 13, color: "var(--text-disabled)", textAlign: "center" }}>No courses here yet.</p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {shown.map((c) => {
            const n = liveBatches(c).length;
            const joined = c.enrolled || c.batches.some((b) => b.enrolled);
            return (
              <button key={c.id} onClick={() => openCourse(c)} className="press" style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
                background: "white", border: joined ? "1.5px solid var(--success-border)" : "1.5px solid transparent",
                borderRadius: 16, padding: "13px 14px", cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
              }}>
                <span style={{ width: 46, height: 46, borderRadius: 13, background: "var(--bg-secondary)", border: "1px solid var(--gold-100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 23, flexShrink: 0 }}>{c.icon}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14.5, fontWeight: 800, color: "var(--ink-primary)" }}>{c.name}</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
                    {n > 0 ? `${n} ${n === 1 ? "batch" : "batches"}` : "No batch scheduled"}
                    {c.duration ? ` · ${c.duration}` : ""}
                  </span>
                  {joined && <span style={{ display: "inline-block", marginTop: 5, fontSize: 10, fontWeight: 800, color: "var(--success-text)", background: "var(--success)", padding: "2px 8px", borderRadius: 20 }}>✓ ENROLLED</span>}
                </span>
                <Chevron />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "white", borderRadius: 16, padding: "16px",
  marginTop: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
};
const cardTitle: React.CSSProperties = {
  margin: "0 0 10px", fontSize: 13, fontWeight: 800, color: "var(--ink-primary)",
};
const heroChip: React.CSSProperties = {
  background: "rgba(255,255,255,0.18)", color: "white", fontSize: 10.5, fontWeight: 800, padding: "3px 10px", borderRadius: 20,
};
const softChip: React.CSSProperties = {
  background: "var(--bg-secondary)", border: "1px solid var(--gold-100)", color: "var(--text-secondary)",
  padding: "4px 9px", borderRadius: 8, fontSize: 11, fontWeight: 600,
};
const primaryBtn: React.CSSProperties = {
  background: gradient, color: "white", border: "none", borderRadius: 14,
  padding: "13px 20px", fontSize: 14, fontWeight: 800, cursor: "pointer",
  boxShadow: "0 6px 16px rgba(61,36,17,0.3)", whiteSpace: "nowrap", flexShrink: 0,
};
const stickyBar: React.CSSProperties = {
  position: "sticky", bottom: 0, background: "white", borderTop: "1px solid var(--gold-100)",
  padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
  boxShadow: "0 -4px 16px rgba(0,0,0,0.06)",
};
