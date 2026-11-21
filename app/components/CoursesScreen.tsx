"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { pushBack, goBack } from "../lib/back-stack";
import type { BatchDetails } from "../lib/catalog/batches";
import { WebsiteBatchHero, WebsiteBatchBody, WebsiteBatchStickyBar } from "./WebsiteBatch";
import { AppIcon, courseIconName, type IconName } from "./AppIcon";
import * as kit from "./ui/kit";

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
  /** false when the website no longer sells it: hidden from browsing, kept for enrolled students. */
  listed: boolean;
  contentCount: number;
  classCount: number;
  testCount: number;
  breakdown: { videos: number; notes: number; practice: number; currentAffairs: number };
  contents: { type: string; title: string }[];
  batches: CatalogBatch[];
};

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
const METHODS = [
  { id: "upi", icon: "smartphone" as IconName, label: "UPI / GPay / PhonePe", sub: "Instant" },
  { id: "card", icon: "card" as IconName, label: "Credit / Debit Card", sub: "Visa, Mastercard, Rupay" },
  { id: "netbanking", icon: "bank" as IconName, label: "Net Banking", sub: "All major banks" },
];

const gradient = "linear-gradient(135deg,var(--blue-dark),var(--blue))";

/** The website's four modes of study — the top level of the catalog, in tab order. */
const MODES = [
  { key: "online", label: "Online Course", icon: "laptop" as IconName },
  { key: "mentorship", label: "Mentorship", icon: "target" as IconName },
  { key: "mock", label: "Mock Tests", icon: "clipboard" as IconName },
  { key: "offline", label: "Offline Course", icon: "landmark" as IconName },
] as const;

type ContentKey = "videos" | "notes" | "practice" | "current-affairs";
type Mode = (typeof MODES)[number]["key"];

/** What the student is buying — one batch, or a whole course that has no batches. */
type Target = { kind: "course"; course: CatalogItem } | { kind: "batch"; course: CatalogItem; batch: CatalogBatch };

const targetName = (t: Target) => (t.kind === "batch" ? t.batch.name : t.course.name);
const targetPrice = (t: Target) => (t.kind === "batch" ? t.batch.fee : t.course.price);

const liveBatches = (c: CatalogItem) => c.batches.filter((b) => b.status !== "archived");
/** Seats still open. 500+ seats means "unlimited" (mentorship, mock tests), so there is no count to show. */
const seatsLeft = (b: CatalogBatch) => (b.seats > 0 && b.seats < 500 ? Math.max(0, b.seats - b.filled) : null);
const pctOff = (b: CatalogBatch) => (b.originalFee > b.fee && b.originalFee > 0 ? Math.round(((b.originalFee - b.fee) / b.originalFee) * 100) : 0);

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

export default function CoursesScreen({ catalog, onEnroll, onEnrollBatch, onOpenStudy, onOpenCourseLearning, onViewOrder, selectedCourseId = null, onSelectCourse }: CoursesScreenProps) {
  const [choosing, setChoosing] = useState(false);
  // Only offer the modes that actually have courses behind them.
  // Browsing shows only what the website sells today.
  const browsable = useMemo(() => catalog.filter((c) => c.listed !== false), [catalog]);
  const modes = useMemo(() => MODES.filter((m) => browsable.some((c) => c.category === m.key)), [browsable]);
  const [mode, setMode] = useState<Mode>(modes[0]?.key ?? "offline");
  const [view, setView] = useState<View>({ name: "list" });
  const [method, setMethod] = useState("upi");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [showAbout, setShowAbout] = useState(false);
  const [courseSel, setCourseSel] = useState<string | null>(null);

  const shown = browsable.filter((c) => c.category === mode);

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

  const openBatch = (course: CatalogItem, batch: CatalogBatch) => {
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
    const confetti = ["var(--gold)", "var(--blue)", "var(--green)", "#CFFB6B", "var(--purple)", "white"];
    return (
      <div style={{ ...kit.page, padding: "4px 16px 28px", minHeight: "100vh", boxSizing: "border-box" }}>
        {/* Celebration card — Home's hero gradient */}
        <div style={{ position: "relative", overflow: "hidden", borderRadius: 24, padding: "26px 18px 22px", background: "linear-gradient(150deg,var(--blue-dark) 0%,var(--blue-dark) 55%,var(--blue) 100%)", boxShadow: "0 10px 28px rgba(11,92,255,0.28)", textAlign: "center" }}>
          <div style={{ position: "absolute", right: -50, top: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,166,35,0.30), transparent 70%)" }} />
          <div style={{ position: "absolute", left: -40, bottom: -70, width: 170, height: 170, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.14), transparent 70%)" }} />
          <div style={{ position: "relative", width: 170, height: 130, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {confetti.flatMap((c, i) => [0, 1].map((j) => {
              const a = ((i * 2 + j) / 12) * Math.PI * 2;
              return <span key={`${i}-${j}`} style={{ position: "absolute", left: 85 + Math.cos(a) * 74 - 4, top: 65 + Math.sin(a) * 58 - 2, width: 9, height: 4, borderRadius: 2, background: c, transform: `rotate(${(a * 180) / Math.PI + 45}deg)` }} />;
            }))}
            <div style={{ width: 88, height: 88, borderRadius: "50%", background: "linear-gradient(135deg,var(--gold),var(--gold-dark))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 28px rgba(245,166,35,0.45)" }}>
              <AppIcon name="check" size={44} color="var(--blue-dark)" strokeWidth={3} />
            </div>
          </div>
          <h2 style={{ position: "relative", margin: "8px 0 6px", fontSize: 23, fontWeight: 700, color: "white" }}>Payment <span style={{ color: "var(--gold)" }}>Successful!</span></h2>
          <p style={{ position: "relative", margin: 0, fontSize: 13.5, color: "rgba(255,255,255,0.75)", lineHeight: 1.55 }}>Welcome to your learning journey.<br />You now have access to the course.</p>
        </div>

        <div style={{ ...kit.card, marginTop: 14, padding: 14, display: "flex", gap: 12, alignItems: "center" }}>
          <kit.IconTile icon={courseIconName(t.course)} size={60} solid />
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: "var(--ink)", lineHeight: 1.3 }}>{t.course.name}</p>
            {instructor && <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--ink-soft)" }}>Instructor: {instructor}</p>}
            {sub && <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--ink-soft)" }}>{sub}</p>}
            <span style={{ display: "inline-block", marginTop: 6 }}><kit.Pill tone="green"><AppIcon name="receipt" size={11} />{view.amount > 0 ? inr(view.amount) : "Free"}{view.invoiceNo ? ` · ${view.invoiceNo}` : ""}</kit.Pill></span>
          </div>
        </div>

        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={() => { show({ name: "list" }); onOpenStudy?.(); }} className="press" style={{ ...kit.primaryBtn, width: "100%", padding: 15, fontSize: 15 }}>
            Go to My Learning<AppIcon name="arrowRight" size={17} />
          </button>
          {onViewOrder && (
            <button onClick={() => { show({ name: "list" }); onViewOrder(); }} className="press" style={{ ...kit.outlineBtn, width: "100%", padding: 14 }}>
              View Order Details
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── BATCH DETAIL — the clatians.com batch page, section for section ──
  if (view.name === "batch") {
    const c = fresh(view.course);
    const b = freshBatch(view.course, view.batch);
    const enroll = () => {
      if (b.enrolled) { if (onOpenCourseLearning) onOpenCourseLearning(c.id, b.id); else onOpenStudy?.(); }
      else startCheckout({ kind: "batch", course: c, batch: b });
    };
    return (
      <div style={{ background: "var(--app-bg)", minHeight: "100vh" }}>
        <WebsiteBatchHero b={b} courseName={c.name} onBack={back} enrolled={b.enrolled} />
        <div style={{ padding: "16px 16px 16px" }}>
          <WebsiteBatchBody b={b} onEnroll={enroll} enrolled={b.enrolled} />
        </div>
        <WebsiteBatchStickyBar b={b} onEnroll={enroll} enrolled={b.enrolled} />
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
    const facts: { label: string; value: string; icon: IconName }[] = [
      { label: "Duration", value: c.duration, icon: "clock" as IconName },
      { label: "Batch size", value: c.batchSize, icon: "users" as IconName },
      { label: "Mode", value: c.mode, icon: "laptop" as IconName },
    ].filter((f) => f.value);

    return (
      <div style={{ ...kit.page, minHeight: "100vh" }}>
        <kit.ScreenHeader title={c.name} subtitle="Courses" onBack={back} />

        <div style={kit.body}>
          {/* Course card — Home's hero gradient */}
          <div style={{ position: "relative", overflow: "hidden", borderRadius: 24, padding: 18, background: "linear-gradient(150deg,var(--blue-dark) 0%,var(--blue-dark) 55%,var(--blue) 100%)", boxShadow: "0 10px 28px rgba(11,92,255,0.28)" }}>
            <div style={{ position: "absolute", right: -50, top: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,166,35,0.30), transparent 70%)" }} />
            <div style={{ position: "absolute", left: -40, bottom: -70, width: 170, height: 170, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.14), transparent 70%)" }} />
            <div style={{ position: "relative", display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.28)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <AppIcon name={courseIconName(c)} size={26} color="white" strokeWidth={1.8} />
              </span>
              <div style={{ minWidth: 0 }}>
                <span style={{ display: "inline-block", background: "#CFFB6B", color: "var(--blue-dark)", fontSize: 10.5, fontWeight: 800, padding: "3px 8px", borderRadius: 6 }}>{MODES.find((m) => m.key === c.category)?.label ?? c.category}</span>
                <h2 style={{ margin: "5px 0 0", fontSize: 20, fontWeight: 700, color: "white", lineHeight: 1.25 }}>{c.name}</h2>
              </div>
            </div>
            {c.tagline && <p style={{ position: "relative", margin: "12px 0 0", fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.55 }}>{c.tagline}</p>}
            {facts.length > 0 && (
              <div style={{ position: "relative", display: "flex", marginTop: 14, background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 16, padding: "10px 4px" }}>
                {facts.map((f, i) => (
                  <div key={f.label} style={{ flex: "1 1 0", minWidth: 0, textAlign: "center", padding: "0 6px", borderLeft: i ? "1px solid rgba(255,255,255,0.16)" : "none" }}>
                    <AppIcon name={f.icon} size={15} color="var(--gold)" />
                    <p style={{ margin: "3px 0 0", fontSize: 12.5, fontWeight: 800, color: "white", overflowWrap: "anywhere", lineHeight: 1.25 }}>{f.value}</p>
                    <p style={{ margin: "1px 0 0", fontSize: 10, color: "rgba(255,255,255,0.6)" }}>{f.label}</p>
                  </div>
                ))}
              </div>
            )}
            {/* Make this the course that heads the home screen */}
            {onSelectCourse && (
              selectedCourseId === c.id ? (
                <p style={{ position: "relative", margin: "14px 0 0", fontSize: 12.5, fontWeight: 800, color: "var(--success-text)", background: "var(--success)", borderRadius: 12, padding: "9px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                  <AppIcon name="checkCircle" size={15} />This is your course
                </p>
              ) : (
                <button
                  onClick={async () => { setChoosing(true); await onSelectCourse(c.id); setChoosing(false); }}
                  disabled={choosing}
                  className="press"
                  style={{ ...kit.goldBtn, position: "relative", width: "100%", marginTop: 14, opacity: choosing ? 0.6 : 1 }}
                >
                  {choosing ? "Saving…" : "Choose this course"}
                </button>
              )
            )}
          </div>

          {/* About — collapsible card */}
          {(c.overview || c.curriculum.length > 0 || c.features.length > 0) && (
            <div style={{ ...kit.card, padding: 0, overflow: "hidden" }}>
              <button onClick={() => setShowAbout(!showAbout)} style={{ width: "100%", background: "none", border: "none", padding: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
                <kit.IconTile icon="info" size={36} />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>About this course</span>
                <AppIcon name="chevronDown" size={18} color="var(--ink-soft)" strokeWidth={2.5} style={{ transform: showAbout ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
              </button>
              {showAbout && (
                <div style={{ borderTop: "1px solid var(--line)", padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                  {c.overview && <p style={{ margin: 0, fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.7 }}>{c.overview}</p>}
                  {c.features.length > 0 && <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>{c.features.map((f, i) => <Tick key={i}>{f}</Tick>)}</div>}
                  {c.curriculum.map((m, i) => (
                    <div key={i} style={{ background: "var(--app-bg)", borderRadius: 12, padding: "10px 12px" }}>
                      <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>{m.module}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.55 }}>{m.topics.join(" · ")}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <kit.SectionTitle
            kicker={owned ? "Already yours" : "Open for enrolment"}
            title={owned
              ? (myBatches.length > 1 ? `Your batches (${myBatches.length})` : "Your batch")
              : batches.length > 0 ? `Choose your batch (${batches.length})` : "Batches"}
          />

          {/* Students always buy a batch — a course has no price of its own. */}
          {batches.length === 0 && (
            <kit.EmptyState
              icon={c.enrolled ? "checkCircle" : "calendar"}
              title={c.enrolled ? "You have access to this course" : "No batch open right now"}
              text={c.enrolled ? undefined : "Ask us when the next batch starts."}
              action={c.enrolled
                ? <button onClick={() => onOpenCourseLearning ? onOpenCourseLearning(c.id) : onOpenStudy?.()} className="press" style={kit.primaryBtn}>Start learning</button>
                : <a href="/enquiry" style={{ ...kit.primaryBtn, textDecoration: "none" }}>Enquire about next batch</a>}
            />
          )}

          {batches.map((b) => {
            const left = seatsLeft(b);
            const validity = [b.startDate, b.endDate].filter(Boolean).join(" – ");
            return (
              <div key={b.id} onClick={() => openBatch(c, b)} className="press" style={{ ...kit.card, borderRadius: 22, overflow: "hidden", cursor: "pointer" }}>
                <div style={{ position: "relative", overflow: "hidden", padding: "14px 16px", background: "linear-gradient(150deg,var(--blue-dark) 0%,var(--blue-dark) 45%,var(--blue) 100%)" }}>
                  <div style={{ position: "absolute", right: -30, top: -50, width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,166,35,0.32), transparent 70%)" }} />
                  <AppIcon name={courseIconName(c)} size={84} color="rgba(255,255,255,0.08)" strokeWidth={1.2} style={{ position: "absolute", right: -8, bottom: -18 }} />
                  <div style={{ position: "relative", display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {b.enrolled && <span style={heroChip}><AppIcon name="check" size={10} strokeWidth={3} />ENROLLED</span>}
                    {!b.enrolled && b.status === "filling-fast" && <span style={{ ...heroChip, background: "white", color: "#EA580C" }}><AppIcon name="flame" size={10} />FILLING FAST</span>}
                    {b.batchType && <span style={{ ...heroChip, background: "#CFFB6B", color: "var(--blue-dark)", borderRadius: 6 }}>{b.batchType}</span>}
                  </div>
                  <p style={{ position: "relative", margin: "9px 0 0", fontSize: 16, fontWeight: 700, color: "white", lineHeight: 1.3, paddingRight: 40 }}>{b.name}</p>
                </div>
                <div style={{ padding: "12px 16px 14px" }}>
                  {(b.language || validity) && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {b.language && <Meta icon="language">{b.language}</Meta>}
                      {validity && <Meta icon="calendar">{validity}</Meta>}
                    </div>
                  )}
                  {!b.enrolled && (left !== null || b.offer) && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 10 }}>
                      {left !== null && (
                        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, color: left <= 5 ? "var(--error-text)" : "var(--success-text)" }}>
                          <AppIcon name="users" size={12} strokeWidth={2.4} />{left === 0 ? "Batch full" : left <= 5 ? `Only ${left} seats left!` : `${left} seats available`}
                        </span>
                      )}
                      {b.offer && <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, color: "var(--gold-dark)" }}><AppIcon name="gift" size={12} />{b.offer}</span>}
                    </div>
                  )}
                  <div style={{ height: 1, background: "var(--line)", margin: "12px 0" }} />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    {b.enrolled
                      ? <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 800, color: "var(--success-text)" }}><AppIcon name="checkCircle" size={16} />You have full access</span>
                      : <Price b={b} size={20} />}
                    <span style={{ ...kit.primaryBtn, padding: "11px 16px", fontSize: 13, flexShrink: 0 }}>
                      {b.enrolled ? "Open" : "View Details"}<AppIcon name="arrowRight" size={15} strokeWidth={2.4} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
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
      <div style={{ ...kit.page, minHeight: "100vh" }}>
        <kit.ScreenHeader title="Checkout" subtitle="Review and pay" onBack={back} />

        <div style={kit.body}>
          <div style={{ ...kit.card, overflow: "hidden" }}>
            {/* Item — blue strip like Home's cards */}
            <div style={{ position: "relative", overflow: "hidden", display: "flex", gap: 12, alignItems: "center", padding: 14, background: "linear-gradient(150deg,var(--blue-dark) 0%,var(--blue-dark) 55%,var(--blue) 100%)" }}>
              <div style={{ position: "absolute", right: -40, top: -50, width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,166,35,0.30), transparent 70%)" }} />
              <span style={{ position: "relative", width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.28)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <AppIcon name={courseIconName(t.course)} size={24} color="white" strokeWidth={1.8} />
              </span>
              <div style={{ position: "relative", minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "white", lineHeight: 1.3 }}>{targetName(t)}</p>
                <p style={{ margin: "3px 0 0", fontSize: 11.5, color: "rgba(255,255,255,0.7)" }}>{subtitle}</p>
              </div>
            </div>
            <div style={{ padding: 16 }}>
              <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>Order Summary</p>
              {price > 0 ? (
                <>
                  {[[t.kind === "batch" ? "Batch fee" : "Course fee", inr(price)], ["GST (18%)", inr(gst)]].map(([l, v], i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 9 }}>
                      <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>{l}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4, padding: "12px 14px", borderRadius: 14, background: "var(--blue-tint)" }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>Total</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: "var(--blue)" }}>{inr(total)}</span>
                  </div>
                </>
              ) : (
                <kit.Pill tone="green"><AppIcon name="gift" size={12} />Free — no payment needed</kit.Pill>
              )}
            </div>
          </div>

          {price > 0 && (
            <div style={{ ...kit.card, padding: 16 }}>
              <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>Payment Method</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {METHODS.map((m) => {
                  const on = method === m.id;
                  return (
                    <div key={m.id} onClick={() => setMethod(m.id)} className="press" style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "11px 12px",
                      borderRadius: 14, cursor: "pointer",
                      border: `1.5px solid ${on ? "var(--blue)" : "var(--line)"}`,
                      background: on ? "var(--blue-tint)" : "white",
                    }}>
                      <kit.IconTile icon={m.icon} size={38} solid={on} />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{m.label}</p>
                        <p style={{ margin: "1px 0 0", fontSize: 11.5, color: "var(--ink-soft)" }}>{m.sub}</p>
                      </div>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${on ? "var(--blue)" : "var(--line-strong)"}`, background: on ? "var(--blue)" : "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {on && <AppIcon name="check" size={11} color="white" strokeWidth={3.5} />}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ background: "var(--gold-tint)", borderRadius: 12, padding: "9px 12px", marginTop: 12, display: "flex", gap: 6, alignItems: "flex-start" }}>
                <AppIcon name="info" size={13} color="var(--gold-dark)" style={{ marginTop: 1, flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 11.5, color: "var(--gold-dark)", lineHeight: 1.45 }}>Test mode: this is a simulated payment. No real money is charged.</p>
              </div>
            </div>
          )}

          {error && <p style={{ margin: 0, fontSize: 13, color: "var(--error-text)", background: "var(--error)", borderRadius: 12, padding: "10px 12px" }}>{error}</p>}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 11.5, color: "var(--ink-soft)" }}>
            <AppIcon name="lock" size={12} />Secure checkout
          </div>
          <button onClick={() => pay(t)} disabled={paying} className="press" style={{
            ...kit.primaryBtn, width: "100%", borderRadius: 16, padding: 16, fontSize: 16,
            cursor: paying ? "default" : "pointer", opacity: paying ? 0.7 : 1,
          }}>
            {paying ? "Processing…" : price > 0 ? `Pay ${inr(total)}` : "Enroll Free"}
            {!paying && <AppIcon name="arrowRight" size={17} strokeWidth={2.4} />}
          </button>
        </div>
      </div>
    );
  }

  // ── LIST — Home-style catalog: promo card, format cards, course chips, batch cards ──
  const TAB_LABEL: Record<Mode, string> = { online: "Online", mentorship: "Mentorship", mock: "Mock", offline: "Classroom" };
  const tabs: { key: Mode; label: string; icon: IconName; count: number }[] = [
    ...modes.map((m) => ({ key: m.key as Mode, label: TAB_LABEL[m.key as Mode] ?? m.label, icon: m.icon, count: browsable.filter((c) => c.category === m.key).length })),
  ];
  const active = shown.find((c) => c.id === courseSel) ?? shown[0];
  // A mode's list shows every open batch for that category — owned ones are marked ENROLLED.
  const activeBatches = !active ? [] : liveBatches(active);
  const courseAccess = !!active && active.enrolled && !active.batches.some((b) => b.enrolled);

  return (
    <div style={{ ...kit.page, paddingBottom: 28 }}>
      {/* ── Promo card — same gradient, glows and stat strip as Home's hero ── */}
      <div style={{ padding: "4px 16px 0" }}>
        <div style={{
          background: "linear-gradient(150deg,var(--blue-dark) 0%,var(--blue-dark) 55%,var(--blue) 100%)",
          borderRadius: 24, padding: "18px 18px 16px", position: "relative", overflow: "hidden",
          boxShadow: "0 10px 28px rgba(11,92,255,0.28)",
        }}>
          <div style={{ position: "absolute", right: -50, top: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,166,35,0.30), transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", left: -40, bottom: -70, width: 170, height: 170, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.14), transparent 70%)", pointerEvents: "none" }} />

          <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 5, background: "#CFFB6B", color: "var(--blue-dark)", fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 8 }}>
            <AppIcon name="award" size={12} strokeWidth={2.4} />India&apos;s Best Law Entrance Coaching
          </span>
          <p style={{ position: "relative", margin: "12px 0 0", fontSize: 23, fontWeight: 700, color: "white", lineHeight: 1.25, letterSpacing: "-0.01em" }}>
            All Courses &amp; <span style={{ color: "var(--gold)" }}>Programs</span>
          </p>
          <p style={{ position: "relative", margin: "6px 0 0", fontSize: 13.5, color: "rgba(255,255,255,0.72)", lineHeight: 1.5 }}>
            Classroom · Online · 1-on-1 Mentorship — pick the format that fits you.
          </p>

          <div style={{
            position: "relative", display: "flex", alignItems: "stretch", marginTop: 14,
            background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 16, padding: "10px 4px",
          }}>
            {[{ v: "15,000+", l: "Students" }, { v: "1,000+", l: "NLU Selections" }, { v: "98%", l: "Success Rate" }].map((s, i) => (
              <div key={s.l} style={{ flex: "1 1 0", minWidth: 0, textAlign: "center", borderLeft: i ? "1px solid rgba(255,255,255,0.16)" : "none" }}>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "var(--gold)", lineHeight: 1.2 }}>{s.v}</p>
                <p style={{ margin: "2px 0 0", fontSize: 10.5, fontWeight: 500, color: "rgba(255,255,255,0.68)", whiteSpace: "nowrap" }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Format cards — Home's squircle tiles; scroll sideways if more are added ── */}
      <div style={{ padding: "20px 16px 0" }}>
        <kit.SectionTitle kicker="Choose your format" title="Explore courses" />
      </div>
      <div className="no-scroll" style={{
        display: "grid", gridAutoFlow: "column", gridAutoColumns: "minmax(76px, 1fr)", gap: 10,
        overflowX: "auto", padding: "12px 16px 10px",
      }}>
        {tabs.map((t) => {
          const on = mode === t.key;
          return (
            <button key={t.key} onClick={() => { setMode(t.key); setCourseSel(null); }} className="press" style={{
              position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              padding: "12px 4px 10px", borderRadius: 18, cursor: "pointer",
              border: on ? "1px solid transparent" : "1px solid var(--line)",
              background: on ? kit.gradient : "var(--surface)",
              boxShadow: on ? "0 8px 18px rgba(11,92,255,0.28)" : "0 6px 10px -2px rgba(15,23,41,0.12), 0 2px 4px rgba(15,23,41,0.05)",
            }}>
              <span style={{
                width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                background: on ? "rgba(255,255,255,0.18)" : "var(--blue-tint)",
              }}>
                <AppIcon name={t.icon} size={20} color={on ? "white" : "var(--blue)"} />
              </span>
              <span style={{ fontSize: 12, fontWeight: on ? 700 : 600, color: on ? "white" : "var(--ink)", whiteSpace: "nowrap" }}>{t.label}</span>
              <span style={{
                position: "absolute", top: 7, right: 7, minWidth: 18, height: 18, padding: "0 5px", boxSizing: "border-box",
                borderRadius: 9, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
                background: on ? "var(--gold)" : "var(--surface-dim)", color: on ? "var(--blue-dark)" : "var(--text-muted)",
              }}>{t.count}</span>
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <div style={{ padding: "8px 16px 0" }}>
          <kit.EmptyState icon="book" title="No courses here yet" text="Check another format, or ask us what's coming next." />
        </div>
      ) : (
        <>
          {/* Course chips */}
          <div className="no-scroll" style={{ display: "flex", gap: 8, padding: "4px 16px 6px", overflowX: "auto" }}>
            {shown.map((c) => {
              const on = active?.id === c.id;
              const joined = c.enrolled || c.batches.some((b) => b.enrolled);
              return (
                <button key={c.id} onClick={() => setCourseSel(c.id)} className="press" style={{
                  display: "flex", alignItems: "center", gap: 6, flexShrink: 0, whiteSpace: "nowrap",
                  padding: "7px 13px", borderRadius: 999, cursor: "pointer", fontSize: 12, fontWeight: 700,
                  background: on ? "var(--blue-tint)" : "white",
                  border: on ? "1.5px solid var(--blue)" : "1.5px solid var(--line)",
                  color: on ? "var(--blue)" : "var(--ink)",
                }}>
                  <AppIcon name={courseIconName(c)} size={13} />
                  {c.name}
                  {joined && <AppIcon name="checkCircle" size={13} strokeWidth={2.4} color="var(--green)" />}
                </button>
              );
            })}
          </div>

          {active && (
            <div style={{ padding: "10px 16px 0", display: "flex", flexDirection: "column", gap: 12 }}>

              {courseAccess && (
                <div style={{ ...kit.card, background: "var(--success)", border: "1px solid var(--success-border)", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 800, color: "var(--success-text)" }}>
                    <AppIcon name="checkCircle" size={16} />You have access to this course
                  </span>
                  <button onClick={() => onOpenCourseLearning ? onOpenCourseLearning(active.id) : onOpenStudy?.()} className="press" style={{ ...enrollBtn, background: "var(--green)", boxShadow: "none" }}>Start learning</button>
                </div>
              )}

              {activeBatches.length === 0 && !courseAccess && (
                <kit.EmptyState
                  icon="calendar"
                  title="No batch open right now"
                  text="Ask us when the next batch of this course starts."
                  action={<a href="/enquiry" style={{ ...kit.primaryBtn, textDecoration: "none", padding: "11px 20px" }}>Enquire</a>}
                />
              )}

              {activeBatches.map((b) => {
                const left = seatsLeft(b);
                const seatText = left === null ? "" : left === 0 ? "Batch full" : b.filled === 0 ? `Only ${b.seats} Students` : left <= 5 ? `Only ${left} Seats Left!` : `${left} Seats Left`;
                const urgent = left !== null && left <= 5 && b.filled > 0;
                const off = pctOff(b);
                const validity = [b.startDate, b.endDate].filter(Boolean).join(" – ");
                return (
                  <div key={b.id} onClick={() => openBatch(active, b)} className="press" style={{ ...kit.card, padding: 12, cursor: "pointer" }}>
                    <div style={{ display: "flex", gap: 12 }}>
                      {/* Visual — a small Home-blue tile */}
                      <div style={{ position: "relative", width: 78, height: 78, borderRadius: 18, flexShrink: 0, overflow: "hidden", background: kit.heroBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ position: "absolute", right: -24, top: -24, width: 70, height: 70, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,166,35,0.45), transparent 70%)" }} />
                        <AppIcon name={courseIconName(active)} size={32} color="white" strokeWidth={1.7} style={{ position: "relative" }} />
                        {off > 0 && !b.enrolled && (
                          <span style={{ position: "absolute", left: 0, right: 0, bottom: 0, textAlign: "center", background: "#CFFB6B", color: "var(--blue-dark)", fontSize: 9.5, fontWeight: 800, padding: "2px 0" }}>{off}% OFF</span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 4 }}>
                          {b.enrolled && <kit.Pill tone="green"><AppIcon name="check" size={10} strokeWidth={3} />Enrolled</kit.Pill>}
                          {!b.enrolled && b.status === "filling-fast" && <kit.Pill tone="gold"><AppIcon name="flame" size={10} />Filling fast</kit.Pill>}
                          {b.batchType && <kit.Pill tone="blue">{b.batchType}</kit.Pill>}
                        </div>
                        <p style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: "var(--ink)", lineHeight: 1.3 }}>{b.name}</p>
                        <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "var(--ink-soft)", display: "flex", flexWrap: "wrap", gap: "2px 10px" }}>
                          {b.language && <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><AppIcon name="language" size={12} color="var(--blue)" />{b.language}</span>}
                          {validity && <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><AppIcon name="calendar" size={12} color="var(--blue)" />{validity}</span>}
                        </p>
                      </div>
                    </div>

                    {b.chips.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", marginTop: 10 }}>
                        {b.chips.slice(0, 4).map((x, i) => (
                          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "var(--text-secondary)" }}>
                            <AppIcon name="check" size={12} strokeWidth={3} color="var(--green)" />{x}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                      {b.enrolled ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 800, color: "var(--success-text)" }}>
                          <AppIcon name="checkCircle" size={15} />Full access
                        </span>
                      ) : (
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 17, fontWeight: 800, color: b.fee === 0 ? "var(--green)" : "var(--ink)" }}>{b.fee === 0 ? "FREE" : inr(b.fee)}</span>
                            {b.originalFee > b.fee && <span style={{ fontSize: 11.5, color: "var(--text-disabled)", textDecoration: "line-through" }}>{inr(b.originalFee)}</span>}
                          </div>
                          {seatText && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: urgent || left === 0 ? "var(--error-text)" : "var(--success-text)" }}>
                              <AppIcon name="users" size={11} strokeWidth={2.4} />{seatText}{b.filled > 0 ? ` · ${b.filled} enrolled` : ""}
                            </span>
                          )}
                        </div>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); openBatch(active, b); }}
                        className="press"
                        style={{ ...kit.primaryBtn, padding: "9px 14px", fontSize: 12.5, borderRadius: 12, flexShrink: 0 }}
                      >
                        View Details<AppIcon name="arrowRight" size={14} strokeWidth={2.4} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Counselling nudge */}
              <div style={{ ...kit.card, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
                <kit.IconTile icon="chat" tone="gold" size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>Need help choosing?</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--ink-soft)" }}>Talk to our expert counsellors — free!</p>
                </div>
                <a href="/enquiry" className="press" style={{ ...kit.goldBtn, flexShrink: 0, padding: "9px 13px", fontSize: 12, borderRadius: 12, textDecoration: "none", whiteSpace: "nowrap" }}>Free Counselling</a>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** A small grey info chip with an icon: batch type, language, validity. */
function Meta({ icon, children }: { icon: IconName; children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: "var(--text-secondary)", background: "var(--app-bg)", border: "1px solid var(--line)", padding: "4px 9px", borderRadius: 999, whiteSpace: "nowrap" }}>
      <AppIcon name={icon} size={12} color="var(--blue)" strokeWidth={2.2} />{children}
    </span>
  );
}

const enrollBtn: React.CSSProperties = {
  background: gradient, color: "white", border: "none", borderRadius: 10, boxShadow: "0 3px 10px rgba(11,92,255,0.25)",
  padding: "9px 14px", fontSize: 12.5, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap",
};

const heroChip: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 4, background: "white", color: "var(--success-text)",
  fontSize: 10.5, fontWeight: 800, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap",
};
