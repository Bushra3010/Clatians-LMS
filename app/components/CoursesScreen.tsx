"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { pushBack, goBack } from "../lib/back-stack";
import type { BatchDetails } from "../lib/catalog/batches";
import { BatchInfoPanel, BatchInfoSwitch, batchInfoTabs, type BatchInfoTab } from "./BatchInfo";
import { AppIcon, courseIconName, type IconName } from "./AppIcon";

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
/** A small icon that sits inline with text (badges, notes). */
const II = (name: IconName, size = 11) => <AppIcon name={name} size={size} strokeWidth={2.6} style={{ display: "inline-block", verticalAlign: "-2px", marginRight: 4 }} />;
/** A tiny status dot, used in front of seat counts. */
const Dot = ({ color }: { color: string }) => <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: color, marginRight: 5, verticalAlign: "1px" }} />;

const METHODS = [
  { id: "upi", icon: "smartphone" as IconName, label: "UPI / GPay / PhonePe", sub: "Instant" },
  { id: "card", icon: "card" as IconName, label: "Credit / Debit Card", sub: "Visa, Mastercard, Rupay" },
  { id: "netbanking", icon: "bank" as IconName, label: "Net Banking", sub: "All major banks" },
];

const gradient = "linear-gradient(135deg,var(--blue-dark),var(--blue))";

/** The website's four modes of study — the top level of the catalog. */
const MODES = [
  { key: "offline", label: "Offline Course", icon: "landmark" as IconName },
  { key: "online", label: "Online Course", icon: "laptop" as IconName },
  { key: "mentorship", label: "Mentorship", icon: "target" as IconName },
  { key: "mock", label: "Mock Tests", icon: "clipboard" as IconName },
] as const;

type ContentKey = "videos" | "notes" | "practice" | "current-affairs";
type Mode = "mine" | (typeof MODES)[number]["key"];

/** What the student is buying — one batch, or a whole course that has no batches. */
type Target = { kind: "course"; course: CatalogItem } | { kind: "batch"; course: CatalogItem; batch: CatalogBatch };

const targetName = (t: Target) => (t.kind === "batch" ? t.batch.name : t.course.name);
const targetPrice = (t: Target) => (t.kind === "batch" ? t.batch.fee : t.course.price);

const liveBatches = (c: CatalogItem) => c.batches.filter((b) => b.status !== "archived");
/** Seats still open. 500+ seats means "unlimited" (mentorship, mock tests), so there is no count to show. */
const seatsLeft = (b: CatalogBatch) => (b.seats > 0 && b.seats < 500 ? Math.max(0, b.seats - b.filled) : null);
const pctOff = (b: CatalogBatch) => (b.originalFee > b.fee && b.originalFee > 0 ? Math.round(((b.originalFee - b.fee) / b.originalFee) * 100) : 0);

function BackBar({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "var(--ink-primary)", fontSize: 14, fontWeight: 700, padding: "14px 16px 4px", maxWidth: "100%" }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-primary)" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}><polyline points="15 18 9 12 15 6" /></svg>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
    </button>
  );
}

function Tick({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
      <span style={{ marginTop: 3 }}><AppIcon name="check" size={13} strokeWidth={3} color="var(--green)" /></span>
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
  /** After a purchase: open the course in My Learning. */
  onOpenCourseLearning?: (courseId: string, batchId?: string) => void;
  onViewOrder?: () => void;
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

export default function CoursesScreen({ catalog, onEnroll, onEnrollBatch, onOpenStudy, onOpenCourseLearning, onViewOrder, initialTab = "all", selectedCourseId = null, onSelectCourse }: CoursesScreenProps) {
  const [choosing, setChoosing] = useState(false);
  const mine = useMemo(() => catalog.filter((c) => c.enrolled || c.batches.some((b) => b.enrolled)), [catalog]);
  // Only offer the modes that actually have courses behind them.
  const modes = useMemo(() => MODES.filter((m) => catalog.some((c) => c.category === m.key)), [catalog]);
  const [mode, setMode] = useState<Mode>(initialTab === "mine" && mine.length > 0 ? "mine" : modes[0]?.key ?? "offline");
  const [view, setView] = useState<View>({ name: "list" });
  const [method, setMethod] = useState("upi");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [infoTab, setInfoTab] = useState<BatchInfoTab>("overview");
  const [showAbout, setShowAbout] = useState(false);
  const [courseSel, setCourseSel] = useState<string | null>(null);

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
    setInfoTab("overview");
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
    const t = view.target;
    const instructor = t.kind === "batch" ? t.batch.faculty[0] : undefined;
    const sub = [t.kind === "batch" ? t.batch.name : "", t.kind === "batch" ? t.batch.duration : t.course.duration].filter(Boolean).join(" · ");
    const confetti = ["#F5A623", "#0B5CFF", "#2F9E76", "#E03131", "#7C3AED", "#0891B2"];
    return (
      <div style={{ background: "white", minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", padding: "36px 20px 28px", textAlign: "center" }}>
        <div style={{ position: "relative", width: 180, height: 150, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {confetti.flatMap((c, i) => [0, 1].map((j) => {
            const a = ((i * 2 + j) / 12) * Math.PI * 2;
            return <span key={`${i}-${j}`} style={{ position: "absolute", left: 90 + Math.cos(a) * 78 - 4, top: 75 + Math.sin(a) * 66 - 2, width: 9, height: 4, borderRadius: 2, background: c, transform: `rotate(${(a * 180) / Math.PI + 45}deg)` }} />;
          }))}
          <div style={{ width: 96, height: 96, borderRadius: "50%", background: "linear-gradient(135deg,#34C759,#1E9E4A)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 28px rgba(30,158,74,0.35)" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
        </div>
        <h2 style={{ margin: "10px 0 6px", fontSize: 24, fontWeight: 900, color: "var(--ink-primary)" }}>Payment Successful!</h2>
        <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)" }}>Welcome to your learning journey</p>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--text-muted)" }}>You now have access to the course.</p>

        <div style={{ width: "100%", maxWidth: 360, marginTop: 22, background: "white", border: "1px solid var(--line)", borderRadius: 16, padding: 12, display: "flex", gap: 12, alignItems: "center", textAlign: "left", boxShadow: "0 2px 10px rgba(15,23,41,0.06)" }}>
          <div style={{ width: 72, height: 72, borderRadius: 12, background: gradient, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AppIcon name={courseIconName(t.course)} size={32} color="white" strokeWidth={1.7} /></div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: "var(--ink-primary)", lineHeight: 1.3 }}>{t.course.name}</p>
            {instructor && <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--text-muted)" }}>Instructor: {instructor}</p>}
            {sub && <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--text-muted)" }}>{sub}</p>}
            <p style={{ margin: "3px 0 0", fontSize: 11.5, color: "var(--text-disabled)" }}>{view.amount > 0 ? inr(view.amount) : "Free"}{view.invoiceNo ? ` · ${view.invoiceNo}` : ""}</p>
          </div>
        </div>

        <div style={{ width: "100%", maxWidth: 360, marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={() => { show({ name: "list" }); if (onOpenCourseLearning) onOpenCourseLearning(t.course.id, t.kind === "batch" ? t.batch.id : undefined); else onOpenStudy?.(); }} style={{ ...primaryBtn, width: "100%", padding: "15px", fontSize: 15 }}>
            Go to My Learning
          </button>
          {onViewOrder && (
            <button onClick={() => { show({ name: "list" }); onViewOrder(); }} style={{ width: "100%", background: "var(--blue-tint)", color: "var(--blue)", border: "none", borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
              View Order Details
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── BATCH DETAIL — everything clatians.com says about the batch, as an app screen ──
  if (view.name === "batch") {
    const c = fresh(view.course);
    const b = freshBatch(view.course, view.batch);
    const left = seatsLeft(b);
    const full = left === 0;
    const pct = b.seats > 0 ? Math.min(100, Math.round((b.filled / b.seats) * 100)) : 0;
    const tabs = batchInfoTabs(b, b.enrolled);
    const tab = tabs.some((t) => t.key === infoTab) ? infoTab : "overview";
    const quick = [
      { label: "Starts", value: b.startDate },
      { label: "Duration", value: b.duration.replace(/\s*\(.*\)$/, "") },
      { label: "Language", value: b.language },
    ].filter((q) => q.value);

    return (
      <div style={{ background: "var(--app-bg)", minHeight: "100vh" }}>
        <BackBar label={c.name} onClick={back} />

        <div style={{ padding: "0 16px" }}>
          {/* Hero */}
          <div style={{ background: gradient, borderRadius: 20, padding: "18px 18px 16px", color: "white", boxShadow: "0 8px 24px rgba(11,92,255,0.28)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: -30, top: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
            <div style={{ position: "absolute", right: 30, bottom: -40, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
            <div style={{ position: "relative", display: "flex", gap: 6, flexWrap: "wrap" }}>
              {b.batchType && <span style={heroChip}>{b.batchType}</span>}
              {b.language && <span style={heroChip}>{b.language}</span>}
              {b.status === "filling-fast" && <span style={{ ...heroChip, background: "#F97316" }}>{II("flame")}HOT</span>}
              {b.enrolled && <span style={{ ...heroChip, background: "var(--green)" }}>{II("check")}ENROLLED</span>}
            </div>
            <h2 style={{ position: "relative", margin: "12px 0 0", fontSize: 20, fontWeight: 900, lineHeight: 1.3 }}>{b.name}</h2>
            <p style={{ position: "relative", margin: "4px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.8)" }}>{II(courseIconName(c), 13)}{c.name}{b.faculty[0] ? ` · by ${b.faculty[0]}` : ""}</p>
            {quick.length > 0 && (
              <div style={{ position: "relative", display: "grid", gridTemplateColumns: `repeat(${quick.length}, minmax(0, 1fr))`, gap: 8, marginTop: 14 }}>
                {quick.map((q) => (
                  <div key={q.label} style={{ background: "rgba(255,255,255,0.14)", borderRadius: 12, padding: "8px 10px", minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>{q.label}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fee — or, once bought, a note that it's theirs */}
          {b.enrolled ? (
            <div style={{ ...cardStyle, background: "var(--success)", border: "1px solid var(--success-border)", boxShadow: "none", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AppIcon name="check" size={20} strokeWidth={3} color="white" /></span>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--success-text)" }}>You&apos;re enrolled in this batch</p>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--success-text)" }}>Chapters, notes and live classes are open in My Learning.</p>
              </div>
            </div>
          ) : (
            <div style={cardStyle}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <Price b={b} size={24} />
                {b.offer && <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 800, color: "var(--success-text)", background: "var(--success)", border: "1px solid var(--success-border)", borderRadius: 8, padding: "4px 8px", maxWidth: 140, textAlign: "center" }}>{II("gift")}{b.offer}</span>}
              </div>
              {left !== null && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 5 }}>
                    <span style={{ fontWeight: 800, color: left !== null && left <= 5 ? "var(--error-text)" : "var(--success-text)" }}>
                      {full ? "Batch full" : <><Dot color={left !== null && left <= 5 ? "var(--error-text)" : "var(--green)"} />{left !== null && left <= 5 ? `Only ${left} seats left!` : `${left} seats left`}</>}
                    </span>
                    <span style={{ color: "var(--text-muted)" }}>{b.filled}/{b.seats} joined</span>
                  </div>
                  <div style={{ height: 6, background: "var(--surface-dim)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: pct >= 80 ? "var(--error-text)" : "var(--green)" }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ marginTop: 6 }}>
          <BatchInfoSwitch tabs={tabs} active={tab} onChange={setInfoTab} />
        </div>
        <div style={{ padding: "2px 16px 18px" }}>
          <BatchInfoPanel key={`${b.id}-${tab}`} b={b} tab={tab} />
        </div>

        {/* Sticky buy bar — the batch's price lives here */}
        <div style={stickyBar}>
          {b.enrolled
            ? <span style={{ fontSize: 13, fontWeight: 800, color: "var(--success-text)" }}>{II("check", 13)}Enrolled</span>
            : <Price b={b} size={20} />}
          {b.enrolled ? (
            <button onClick={() => onOpenCourseLearning ? onOpenCourseLearning(c.id, b.id) : onOpenStudy?.()} style={primaryBtn}>Start learning</button>
          ) : (
            <button onClick={() => startCheckout({ kind: "batch", course: c, batch: b })} disabled={full} style={{ ...primaryBtn, opacity: full ? 0.5 : 1, cursor: full ? "not-allowed" : "pointer" }}>
              {full ? "Batch full" : b.fee === 0 ? "Join free" : "Enroll now"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── COURSE — pick a batch ──
  if (view.name === "course") {
    const c = fresh(view.course);
    const myBatches = c.batches.filter((b) => b.enrolled);
    // Once the course is bought it's theirs: show only their batch, never prices.
    const owned = c.enrolled || myBatches.length > 0;
    const batches = owned ? myBatches : liveBatches(c);
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
              <div style={{ width: 52, height: 52, borderRadius: 15, background: gradient, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AppIcon name={courseIconName(c)} size={26} color="white" strokeWidth={1.8} /></div>
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
                  {II("check", 13)}This is your course
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
            {owned
              ? (myBatches.length > 1 ? `Your batches (${myBatches.length})` : "Your batch")
              : batches.length > 0 ? `Choose your batch (${batches.length})` : "Batches"}
          </p>

          {/* Students always buy a batch — a course has no price of its own. */}
          {batches.length === 0 && (
            <div style={{ ...cardStyle, marginTop: 0 }}>
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
                {c.enrolled ? "You have access to this course." : "No batch is open for this course right now. Ask us when the next batch starts."}
              </p>
              {c.enrolled
                ? <button onClick={() => onOpenCourseLearning ? onOpenCourseLearning(c.id) : onOpenStudy?.()} style={{ ...primaryBtn, marginTop: 12 }}>Start learning</button>
                : <a href="/enquiry" style={{ ...primaryBtn, display: "inline-block", marginTop: 12, textDecoration: "none" }}>Enquire about next batch</a>}
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
                      {b.status === "filling-fast" && <span style={{ ...heroChip, background: "#F97316" }}>{II("flame")}HOT</span>}
                      {b.enrolled && <span style={{ ...heroChip, background: "var(--green)" }}>{II("check")}ENROLLED</span>}
                    </div>
                    <p style={{ margin: "10px 0 0", fontSize: 15.5, fontWeight: 900, color: "white", lineHeight: 1.3 }}>{b.name}</p>
                    {(b.startDate || b.endDate) && (
                      <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "rgba(255,255,255,0.78)" }}>{II("calendar", 12)}{[b.startDate, b.endDate].filter(Boolean).join(" · ")}</p>
                    )}
                  </div>
                  {b.enrolled ? (
                    <div style={{ padding: "13px 16px 15px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--success-text)" }}>{II("check", 13)}You have full access</span>
                      <span style={{ ...primaryBtn, padding: "10px 16px", fontSize: 13 }}>Open</span>
                    </div>
                  ) : (
                  <div style={{ padding: "13px 16px 15px" }}>
                    {left !== null && (
                      <p style={{ margin: "0 0 10px", fontSize: 11.5, fontWeight: 700, color: left <= 5 ? "var(--error-text)" : "var(--success-text)" }}>
                        <Dot color={left <= 5 ? "var(--error-text)" : "var(--green)"} />{left === 0 ? "Batch full" : left <= 5 ? `Only ${left} seats left!` : `${left} seats available`}
                      </p>
                    )}
                    {b.offer && <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "var(--success-text)" }}>{II("gift")}{b.offer}</p>}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, borderTop: "1px solid var(--gold-100)", paddingTop: 12 }}>
                      <Price b={b} />
                      <span style={{ ...primaryBtn, padding: "10px 16px", fontSize: 13 }}>View details</span>
                    </div>
                  </div>
                  )}
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
              <div style={{ width: 50, height: 50, borderRadius: 16, background: gradient, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AppIcon name={courseIconName(t.course)} size={24} color="white" strokeWidth={1.8} /></div>
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
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--blue-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}><AppIcon name={m.icon} size={18} color="var(--blue)" /></span>
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
                <p style={{ margin: 0, fontSize: 11, color: "#92400E" }}>{II("info", 12)}Test mode: this is a simulated payment. No real money is charged.</p>
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

  // ── LIST — website-style catalog: hero, mode tabs, course chips, batch cards ──
  const tabs: { key: Mode; label: string; icon: IconName; count: number }[] = [
    ...(mine.length > 0 ? [{ key: "mine" as Mode, label: "My Courses", icon: "star" as IconName, count: mine.length }] : []),
    ...modes.map((m) => ({ key: m.key as Mode, label: m.label.replace(" Course", "").replace("Mock Tests", "Mock"), icon: m.icon, count: catalog.filter((c) => c.category === m.key).length })),
  ];
  const active = shown.find((c) => c.id === courseSel) ?? shown[0];
  // Browsing a mode shows every open batch (owned ones are marked); "My Courses" shows only what they own.
  const activeBatches = !active ? [] : mode === "mine" ? active.batches.filter((b) => b.enrolled) : liveBatches(active);
  const courseAccess = !!active && active.enrolled && !active.batches.some((b) => b.enrolled);

  return (
    <div style={{ background: "var(--app-bg)", paddingBottom: 24 }}>
      {/* Hero — same as clatians.com/courses */}
      <div style={{ background: gradient, padding: "26px 18px 22px", borderRadius: "0 0 24px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -60, top: -60, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ position: "absolute", left: -50, bottom: -70, width: 170, height: 170, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <span style={{ position: "relative", display: "inline-block", fontSize: 11.5, fontWeight: 700, color: "white", background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.25)", padding: "5px 13px", borderRadius: 20 }}>
          {II("award", 12)}India&apos;s Best Law Entrance Coaching
        </span>
        <h2 style={{ position: "relative", margin: "14px 0 0", fontSize: 25, fontWeight: 900, color: "white", letterSpacing: "-0.01em" }}>
          All Courses &amp; <span style={{ background: "linear-gradient(90deg, #FFD66B, #F5A623)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Programs</span>
        </h2>
        <p style={{ position: "relative", margin: "8px auto 0", maxWidth: 340, fontSize: 13, color: "rgba(255,255,255,0.82)", lineHeight: 1.55 }}>
          Classroom · Online · 1-on-1 Mentorship — pick the format that fits you.
        </p>
        <div style={{ position: "relative", display: "flex", justifyContent: "center", gap: 8, marginTop: 18 }}>
          {[{ v: "15,000+", l: "Students" }, { v: "1,000+", l: "NLU Selections" }, { v: "98%", l: "Success Rate" }].map((s) => (
            <div key={s.l} style={{ flex: "1 1 0", maxWidth: 110, background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 12, padding: "10px 6px" }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#FFD66B" }}>{s.v}</p>
              <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.75)" }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mode tabs */}
      <div style={{ position: "sticky", top: 0, zIndex: 5, background: "var(--app-bg)", padding: "12px 16px 4px" }}>
        <div style={{ display: "flex", gap: 4, background: "white", borderRadius: 14, padding: 4, boxShadow: "0 2px 8px rgba(15,23,41,0.06)", overflowX: "auto", scrollbarWidth: "none" }}>
          {tabs.map((t) => {
            const on = mode === t.key;
            return (
              <button key={t.key} onClick={() => { setMode(t.key); setCourseSel(null); }} style={{
                display: "flex", alignItems: "center", gap: 6, flexShrink: 0, whiteSpace: "nowrap",
                flex: "1 0 auto", justifyContent: "center", padding: "9px 11px", border: "none", cursor: "pointer", borderRadius: 10,
                background: on ? gradient : "transparent", boxShadow: on ? "0 3px 10px rgba(11,92,255,0.25)" : "none",
                fontSize: 12.5, fontWeight: on ? 800 : 600, color: on ? "white" : "var(--text-muted)",
              }}>
                <AppIcon name={t.icon} size={15} />
                {t.label}
                <span style={{ fontSize: 10, fontWeight: 800, minWidth: 18, padding: "1px 6px", borderRadius: 10, background: on ? "rgba(255,255,255,0.25)" : "var(--surface-dim)", color: on ? "white" : "var(--text-muted)" }}>{t.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {shown.length === 0 ? (
        <p style={{ margin: "24px 16px", fontSize: 13, color: "var(--text-disabled)", textAlign: "center" }}>No courses here yet.</p>
      ) : (
        <>
          {/* Course chips */}
          <div style={{ display: "flex", gap: 8, padding: "14px 16px 4px", overflowX: "auto", scrollbarWidth: "none" }}>
            {shown.map((c) => {
              const on = active?.id === c.id;
              const joined = c.enrolled || c.batches.some((b) => b.enrolled);
              return (
                <button key={c.id} onClick={() => setCourseSel(c.id)} className="press" style={{
                  display: "flex", alignItems: "center", gap: 7, flexShrink: 0, whiteSpace: "nowrap",
                  padding: "9px 15px", borderRadius: 24, cursor: "pointer", fontSize: 13, fontWeight: 700,
                  background: on ? "var(--blue-tint)" : "white",
                  border: on ? "1.5px solid var(--blue)" : "1.5px solid var(--line)",
                  color: on ? "var(--blue)" : W.ink,
                }}>
                  <AppIcon name={courseIconName(c)} size={16} />
                  {c.name}
                  {joined && <AppIcon name="check" size={12} strokeWidth={3} color="var(--green)" />}
                </button>
              );
            })}
          </div>

          {active && (
            <div style={{ padding: "10px 16px 0" }}>
              <button onClick={() => openCourse(active)} style={{ background: "none", border: "none", padding: "0 2px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                <AppIcon name={courseIconName(active)} size={14} />{active.name}{active.duration ? ` · ${active.duration}` : ""} · <span style={{ color: "var(--blue)" }}>Course details</span><AppIcon name="chevronRight" size={13} color="var(--blue)" />
              </button>

              {courseAccess && (
                <div style={{ background: "var(--success)", border: "1px solid var(--success-border)", borderRadius: 14, padding: "11px 14px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--success-text)" }}>{II("check", 13)}You have access to this course</span>
                  <button onClick={() => onOpenCourseLearning ? onOpenCourseLearning(active.id) : onOpenStudy?.()} style={{ ...enrollBtn, background: "var(--green)" }}>Start learning</button>
                </div>
              )}

              {activeBatches.length === 0 && !courseAccess && (
                <div style={{ background: "white", borderRadius: 16, padding: 16, border: "1px solid #E9EEF2" }}>
                  <p style={{ margin: 0, fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>No batch is open for this course right now. Ask us when the next batch starts.</p>
                  <a href="/enquiry" style={{ ...enrollBtn, display: "inline-block", marginTop: 12, textDecoration: "none" }}>Enquire</a>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {activeBatches.map((b) => {
                  const left = seatsLeft(b);
                  const seatText = left === null ? "" : left === 0 ? "Batch full" : b.filled === 0 ? `Only ${b.seats} Students` : left <= 5 ? `Only ${left} Seats Left!` : `${left} Seats Left`;
                  const seatColor = left !== null && left <= 5 && b.filled > 0 ? "var(--error-text)" : "var(--success-text)";
                  return (
                    <div key={b.id} onClick={() => openBatch(active, b)} className="press" style={{
                      position: "relative", display: "flex", gap: 10, alignItems: "stretch",
                      background: "white", borderRadius: 16, padding: "14px 14px 14px 18px", cursor: "pointer",
                      border: "none", boxShadow: "0 2px 10px rgba(15,23,41,0.06)", overflow: "hidden",
                    }}>
                      <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: b.enrolled ? "var(--green)" : "var(--blue)" }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          {b.batchType && <span style={{ ...badge, background: "var(--blue-tint)", color: "var(--blue)" }}>{b.batchType}</span>}
                          {b.language && <span style={{ ...badge, background: "#FEF3C7", color: "#92400E" }}>{b.language}</span>}
                          {b.status === "filling-fast" && <span style={{ ...badge, background: "#FFEDD5", color: "#EA580C" }}>{II("flame", 10)}HOT</span>}
                          {b.enrolled && <span style={{ ...badge, background: "var(--success)", color: "var(--success-text)" }}>{II("check", 10)}ENROLLED</span>}
                        </div>
                        <p style={{ margin: "8px 0 0", fontSize: 14.5, fontWeight: 800, color: W.ink, lineHeight: 1.3 }}>{b.name}</p>
                        {(b.startDate || b.endDate) && (
                          <p style={{ margin: "5px 0 0", fontSize: 11.5, color: "#94A3B8" }}>{II("calendar", 12)}{[b.startDate, b.endDate].filter(Boolean).join(" – ")}</p>
                        )}
                        {b.chips.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 7 }}>
                            {b.chips.slice(0, 3).map((x, i) => <span key={i} style={{ fontSize: 11.5, color: "#475569" }}><AppIcon name="check" size={11} strokeWidth={3} color="var(--green)" style={{ display: "inline-block", verticalAlign: "-1px", marginRight: 5 }} />{x}</span>)}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between", gap: 6, flexShrink: 0 }}>
                        {b.enrolled ? (
                          <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--success-text)" }}>Full access</span>
                        ) : (
                          <div style={{ textAlign: "right" }}>
                            <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color: W.ink }}>{b.fee === 0 ? "FREE" : inr(b.fee)}</p>
                            {b.originalFee > b.fee && <p style={{ margin: 0, fontSize: 11, color: "#94A3B8", textDecoration: "line-through" }}>{inr(b.originalFee)}</p>}
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); if (b.enrolled) openBatch(active, b); else startCheckout({ kind: "batch", course: active, batch: b }); }}
                          disabled={!b.enrolled && left === 0}
                          style={{ ...enrollBtn, opacity: !b.enrolled && left === 0 ? 0.5 : 1 }}
                        >
                          {b.enrolled ? "Open" : "Enroll"}
                        </button>
                        {!b.enrolled && seatText && <span style={{ fontSize: 10.5, fontWeight: 700, color: seatColor, whiteSpace: "nowrap" }}>{seatText}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Counselling nudge — as on the website */}
              <div style={{ marginTop: 18, background: "white", boxShadow: "0 2px 10px rgba(15,23,41,0.06)", borderRadius: 16, padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: W.ink }}>Need Help Choosing?</p>
                  <p style={{ margin: "3px 0 0", fontSize: 11.5, color: "var(--text-muted)" }}>Talk to our expert counsellors — free!</p>
                </div>
                <a href="/enquiry" style={{ flexShrink: 0, background: gradient, color: "white", borderRadius: 10, padding: "9px 13px", fontSize: 12, fontWeight: 800, textDecoration: "none", whiteSpace: "nowrap" }}>{II("chat", 12)}Free Counselling</a>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const W = { ink: "var(--ink-primary)" };
const badge: React.CSSProperties = { fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6 };
const enrollBtn: React.CSSProperties = {
  background: gradient, color: "white", border: "none", borderRadius: 10, boxShadow: "0 3px 10px rgba(11,92,255,0.25)",
  padding: "9px 14px", fontSize: 12.5, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap",
};

const cardStyle: React.CSSProperties = {
  background: "white", borderRadius: 16, padding: "16px",
  marginTop: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
};
const heroChip: React.CSSProperties = {
  background: "rgba(255,255,255,0.18)", color: "white", fontSize: 10.5, fontWeight: 800, padding: "3px 10px", borderRadius: 20,
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
