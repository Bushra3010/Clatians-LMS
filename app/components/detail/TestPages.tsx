"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import type { StartResult, SubmitResult, TakeQuestion, ReviewItem } from "../../lib/test-actions";
import { explainAnswerAction } from "../../lib/ai-actions";
import AiText from "../AiText";
import { pushBack } from "../../lib/back-stack";
import { AppIcon } from "../AppIcon";
import { ScreenHeader, SectionTitle, IconTile, EmptyState, Pill, card, page, primaryBtn, outlineBtn, smallBtn, gradient } from "../ui/kit";

export type TestListItem = {
  id: string;
  title: string;
  description: string;
  type: string;
  /** The section this paper covers, when every question shares one. */
  subject: string;
  durationMin: number;
  questionCount: number;
  myAttempts: number;
  bestScore: number | null;
  bestTotal: number | null;
};

const typeLabel: Record<string, string> = { mock: "Full Mock", sectional: "Sectional", pyq: "Previous Year", practice: "Practice" };

/** Passages are shared by consecutive questions — render one only when it changes. */
function PassageBlock({ passage }: { passage: string }) {
  if (!passage) return null;
  return (
    <div style={{ background: "var(--app-bg)", border: "1px solid var(--line)", borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
      <p style={{ margin: "0 0 6px", fontSize: 10.5, fontWeight: 800, color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Passage</p>
      <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{passage}</p>
    </div>
  );
}

// ── Test list ──────────────────────────────────────────────
export function TestSeriesPage({ onBack, tests, onStart }: { onBack: () => void; tests: TestListItem[]; onStart: (id: string) => Promise<StartResult> }) {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const start = async (id: string) => { setErr(""); setBusy(id); const r = await onStart(id); if (!r.ok) setErr(r.error); setBusy(null); };

  return (
    <div style={page}>
      <ScreenHeader title="Test Series" onBack={onBack} />
      <div style={{ padding: "14px 16px 0" }}>
        {err && <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--error-text)", background: "var(--error)", borderRadius: 12, padding: "10px 12px" }}>{err}</p>}
        {tests.length === 0 && (
          <EmptyState icon="clipboard" title="No tests yet" text="Published mock tests for your batch will appear here." />
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {tests.map((t) => (
            <div key={t.id} style={{ ...card, padding: "15px 16px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <IconTile icon="clipboard" size={42} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, flexWrap: "wrap" }}>
                    <Pill tone="blue">{typeLabel[t.type] ?? t.type}</Pill>
                    {t.bestScore !== null && <Pill tone="green">Best {t.bestScore}/{t.bestTotal}</Pill>}
                  </div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>{t.title}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                    <AppIcon name="clock" size={13} color="var(--ink-mute)" />
                    {t.questionCount} questions · {t.durationMin} min{t.myAttempts > 0 ? ` · ${t.myAttempts} attempt${t.myAttempts > 1 ? "s" : ""}` : ""}
                  </p>
                </div>
              </div>
              <button onClick={() => start(t.id)} disabled={busy === t.id} style={{ ...primaryBtn, width: "100%", marginTop: 12, cursor: busy === t.id ? "default" : "pointer", opacity: busy === t.id ? 0.7 : 1 }}>
                {busy === t.id ? "Loading…" : <>{t.myAttempts > 0 ? "Re-attempt" : "Start test"} <AppIcon name="arrowRight" size={16} color="white" /></>}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Taking a test ──────────────────────────────────────────
// One question per screen, CBT-style. A comprehension's passage sits in its
// own scrollable panel above the question (expandable to full length), the
// question and its options below, Previous / Next at the bottom, and a
// question map showing what is answered, skipped or marked for review.

type QStatus = "answered" | "marked" | "answered-marked" | "skipped" | "unseen";

const STATUS_STYLE: Record<QStatus, { bg: string; fg: string; border: string; label: string }> = {
  answered: { bg: "#16A34A", fg: "white", border: "#16A34A", label: "Answered" },
  "answered-marked": { bg: "var(--purple)", fg: "white", border: "#16A34A", label: "Answered & marked" },
  marked: { bg: "var(--purple)", fg: "white", border: "var(--purple)", label: "Marked for review" },
  skipped: { bg: "var(--error)", fg: "#B91C1C", border: "#FCA5A5", label: "Not answered" },
  unseen: { bg: "white", fg: "var(--ink-soft)", border: "var(--line-strong)", label: "Not visited" },
};

export function TestTakePage({ session, onSubmit, onExit }: { session: Extract<StartResult, { ok: true }>; onSubmit: (answers: Record<string, string>) => Promise<void>; onExit: () => void }) {
  const questions = session.questions;
  const total = questions.length;
  const timed = session.durationMin > 0;

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [visited, setVisited] = useState<Set<string>>(() => new Set(questions[0] ? [questions[0].id] : []));
  const [index, setIndex] = useState(0);
  const [secs, setSecs] = useState(session.durationMin * 60);
  const [submitting, setSubmitting] = useState(false);
  const [sheet, setSheet] = useState<"none" | "map" | "confirm" | "exit">("none");
  const [passageOpen, setPassageOpen] = useState(false);

  // The timer's auto-submit must send the answers as they are *then*, not as
  // they were when the timer started.
  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  const submittedRef = useRef(false);

  const doSubmit = async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setSheet("none");
    await onSubmit(answersRef.current);
  };

  // A stray back swipe mustn't throw the attempt away: while the test is on
  // screen, the back gesture asks first (and re-arms itself if they stay).
  const leavingRef = useRef(false);
  useEffect(() => {
    let active = true;
    const alive = () => active && !leavingRef.current && !submittedRef.current;
    const guard = () => { setSheet("exit"); pushBack(guard, alive); };
    pushBack(guard, alive);
    return () => { active = false; };
  }, []);
  const leave = () => { leavingRef.current = true; onExit(); };

  useEffect(() => {
    if (!timed) return; // untimed practice — no clock, no auto-submit
    const t = setInterval(() => setSecs((s) => {
      if (s <= 1) { clearInterval(t); doSubmit(); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timed]);

  // Comprehension numbering: consecutive questions sharing a passage are one set.
  const sets = useMemo(() => {
    const out: { number: number; from: number; to: number }[] = [];
    questions.forEach((q, i) => {
      const last = out[out.length - 1];
      if (q.passage && last && questions[last.to].passage === q.passage) last.to = i;
      else if (q.passage) out.push({ number: out.length + 1, from: i, to: i });
    });
    return out;
  }, [questions]);
  const setOf = (i: number) => sets.find((s) => i >= s.from && i <= s.to) ?? null;

  const q = questions[index];
  const set = setOf(index);

  const goTo = (i: number) => {
    const next = Math.max(0, Math.min(total - 1, i));
    const nq = questions[next];
    // A new passage starts collapsed; staying on the same passage keeps its state.
    if (nq && nq.passage !== q?.passage) setPassageOpen(false);
    setIndex(next);
    if (nq) setVisited((v) => (v.has(nq.id) ? v : new Set(v).add(nq.id)));
    setSheet("none");
    const el = document.getElementById("screen-content");
    if (el) el.scrollTop = 0;
  };

  const choose = (opt: string) => setAnswers((a) => ({ ...a, [q.id]: opt }));
  const clear = () => setAnswers((a) => { const n = { ...a }; delete n[q.id]; return n; });
  const toggleMark = () => setMarked((m) => { const n = new Set(m); if (n.has(q.id)) n.delete(q.id); else n.add(q.id); return n; });

  const statusOf = (qq: TakeQuestion): QStatus => {
    const a = !!answers[qq.id];
    const m = marked.has(qq.id);
    if (a && m) return "answered-marked";
    if (a) return "answered";
    if (m) return "marked";
    return visited.has(qq.id) ? "skipped" : "unseen";
  };

  const answered = Object.keys(answers).length;
  const counts = questions.reduce((c, qq) => { c[statusOf(qq)]++; return c; },
    { answered: 0, "answered-marked": 0, marked: 0, skipped: 0, unseen: 0 } as Record<QStatus, number>);

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const low = timed && secs <= 60;
  const isLast = index === total - 1;

  if (!q) return null;

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header: title, progress, timer, map */}
      <div style={{ position: "sticky", top: 0, zIndex: 5, background: "white", borderBottom: "1px solid var(--line)", padding: "12px 16px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setSheet("exit")} aria-label="Exit test" style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "var(--app-bg)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AppIcon name="close" size={18} color="var(--ink)" strokeWidth={2.5} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.title}</p>
            <p style={{ margin: "1px 0 0", fontSize: 11.5, color: "var(--ink-soft)" }}>{answered}/{total} answered</p>
          </div>
          {timed ? (
            <div style={{ background: low ? "var(--error)" : "var(--blue-tint)", color: low ? "var(--error-text)" : "var(--blue)", borderRadius: 10, padding: "6px 10px", fontSize: 14, fontWeight: 900, fontVariantNumeric: "tabular-nums", flexShrink: 0, display: "flex", alignItems: "center", gap: 5 }}>
              <AppIcon name="clock" size={15} strokeWidth={2.4} />{mm}:{ss}
            </div>
          ) : (
            <div style={{ background: "var(--success)", color: "var(--success-text)", borderRadius: 10, padding: "6px 10px", fontSize: 11.5, fontWeight: 800, flexShrink: 0 }}>Untimed</div>
          )}
          <button onClick={() => setSheet("map")} aria-label="Question map" style={{ ...smallBtn, padding: "7px 10px", borderRadius: 10, fontSize: 12 }}>
            <AppIcon name="layers" size={15} />
            Map
          </button>
        </div>
        {/* Thin strip: one tick per question, coloured by status — a glanceable map */}
        <div style={{ display: "flex", gap: 2, marginTop: 8 }}>
          {questions.map((qq, i) => (
            <button key={qq.id} onClick={() => goTo(i)} aria-label={`Question ${i + 1}`} style={{
              flex: 1, height: i === index ? 6 : 4, borderRadius: 3, border: "none", padding: 0, cursor: "pointer",
              background: i === index ? "var(--blue)" : STATUS_STYLE[statusOf(qq)].bg === "white" ? "var(--line)" : STATUS_STYLE[statusOf(qq)].bg,
            }} />
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: "12px 14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Comprehension passage — its own panel, scrollable, expandable */}
        {q.passage && (
          <div style={{ ...card, borderTop: "4px solid var(--blue)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "10px 14px", borderBottom: "1px solid var(--line)" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6 }}>
                <AppIcon name="book" size={14} />
                Comprehension {set?.number ?? ""}{q.subject ? ` · ${q.subject}` : ""}
              </span>
              {set && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-mute)", flexShrink: 0 }}>Q{set.from + 1}–{set.to + 1}</span>}
            </div>
            <div style={{
              maxHeight: passageOpen ? "none" : "38vh", overflowY: passageOpen ? "visible" : "auto",
              padding: "12px 14px", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap",
              WebkitOverflowScrolling: "touch",
            }}>
              {q.passage}
            </div>
            <button onClick={() => setPassageOpen(!passageOpen)} style={{ width: "100%", background: "var(--blue-tint)", border: "none", borderTop: "1px solid var(--line)", padding: "9px", fontSize: 12, fontWeight: 800, color: "var(--blue)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              <AppIcon name="chevronDown" size={15} strokeWidth={2.5} style={passageOpen ? { transform: "rotate(180deg)" } : undefined} />
              {passageOpen ? "Collapse passage" : "Show full passage"}
            </button>
          </div>
        )}

        {/* The one question on screen */}
        <div style={{ ...card, padding: "14px 15px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--blue)" }}>Question {index + 1} of {total}</span>
            {!q.passage && q.subject && <span style={{ fontSize: 10.5, color: "var(--ink-mute)", fontWeight: 700 }}>{q.subject}</span>}
          </div>
          <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600, color: "var(--ink)", lineHeight: 1.55 }}>{q.text}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(["a", "b", "c", "d"] as const).map((opt) => {
              const sel = answers[q.id] === opt;
              return (
                <button key={opt} onClick={() => choose(opt)} style={{
                  display: "flex", alignItems: "flex-start", gap: 10, textAlign: "left",
                  border: `1.5px solid ${sel ? "var(--blue)" : "var(--line-strong)"}`, background: sel ? "var(--blue-tint)" : "white",
                  borderRadius: 12, padding: "11px 12px", cursor: "pointer", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5,
                }}>
                  <span style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, border: `2px solid ${sel ? "var(--blue)" : "var(--line-strong)"}`, background: sel ? "var(--blue)" : "white", color: sel ? "white" : "var(--ink-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{opt.toUpperCase()}</span>
                  <span style={{ paddingTop: 1 }}>{q[opt]}</span>
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
            <button onClick={toggleMark} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 12.5, fontWeight: 800, color: marked.has(q.id) ? "var(--purple)" : "var(--ink-soft)", display: "flex", alignItems: "center", gap: 5 }}>
              <AppIcon name="star" size={15} fill={marked.has(q.id) ? "var(--purple)" : "none"} />
              {marked.has(q.id) ? "Marked for review" : "Mark for review"}
            </button>
            {answers[q.id] && (
              <button onClick={clear} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: "var(--ink-soft)" }}>Clear answer</button>
            )}
          </div>
        </div>
      </div>

      {/* Previous / Next */}
      <div style={{ position: "sticky", bottom: 0, zIndex: 5, background: "white", borderTop: "1px solid var(--line)", padding: "10px 16px", display: "flex", gap: 10, boxShadow: "0 -4px 16px rgba(15,23,41,0.06)" }}>
        <button onClick={() => goTo(index - 1)} disabled={index === 0} style={{ ...outlineBtn, flex: 1, padding: "12px 10px", cursor: index === 0 ? "default" : "pointer", opacity: index === 0 ? 0.45 : 1 }}>
          <AppIcon name="chevronRight" size={16} strokeWidth={2.5} style={{ transform: "rotate(180deg)" }} /> Previous
        </button>
        {isLast ? (
          <button onClick={() => setSheet("confirm")} disabled={submitting} style={{ ...primaryBtn, flex: 1.4, opacity: submitting ? 0.7 : 1 }}>
            {submitting ? "Submitting…" : timed ? "Submit test" : "Check answers"}
          </button>
        ) : (
          <button onClick={() => goTo(index + 1)} style={{ ...primaryBtn, flex: 1.4 }}>
            {answers[q.id] ? "Save & Next" : "Next"} <AppIcon name="chevronRight" size={16} color="white" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Bottom sheets: question map, and the submit confirmation */}
      {sheet !== "none" && (
        <div onClick={() => setSheet("none")} style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 430, maxHeight: "82vh", overflowY: "auto", background: "white", borderRadius: "20px 20px 0 0", padding: "16px 16px 20px", boxShadow: "0 -10px 30px rgba(0,0,0,0.2)" }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--line)", margin: "0 auto 12px" }} />

            {sheet === "exit" ? (
              <>
                <p style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.01em" }}>Leave this test?</p>
                <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5 }}>
                  Your {answered} answer{answered === 1 ? "" : "s"} won&apos;t be saved. To keep them, submit the test instead.
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={leave} style={{ ...outlineBtn, flex: 1, color: "var(--error-text)", borderColor: "var(--error)", background: "var(--error)" }}>Leave</button>
                  <button onClick={() => setSheet("none")} style={{ ...primaryBtn, flex: 1.4 }}>Continue test</button>
                </div>
              </>
            ) : sheet === "map" ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.01em" }}>Question map</p>
                  <button onClick={() => setSheet("none")} style={{ ...smallBtn, padding: "6px 12px" }}>Close</button>
                </div>

                {/* Legend with counts */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6, marginBottom: 14 }}>
                  {(["answered", "skipped", "marked", "unseen"] as QStatus[]).map((k) => (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--ink-soft)" }}>
                      <span style={{ width: 16, height: 16, borderRadius: 5, background: STATUS_STYLE[k].bg, border: `1.5px solid ${STATUS_STYLE[k].border}`, flexShrink: 0 }} />
                      {STATUS_STYLE[k].label} <b style={{ color: "var(--ink)" }}>{k === "marked" ? counts.marked + counts["answered-marked"] : k === "answered" ? counts.answered + counts["answered-marked"] : counts[k]}</b>
                    </div>
                  ))}
                </div>

                {/* Numbers, grouped under their comprehension */}
                {(() => {
                  const blocks: { label: string; items: number[] }[] = [];
                  questions.forEach((qq, i) => {
                    const s = setOf(i);
                    const label = s ? `Comprehension ${s.number}` : "Questions";
                    const last = blocks[blocks.length - 1];
                    if (last && last.label === label) last.items.push(i);
                    else blocks.push({ label, items: [i] });
                  });
                  return blocks.map((b, bi) => (
                    <div key={bi} style={{ marginBottom: 12 }}>
                      <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 800, color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{b.label}</p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 8 }}>
                        {b.items.map((i) => {
                          const st = STATUS_STYLE[statusOf(questions[i])];
                          return (
                            <button key={i} onClick={() => goTo(i)} style={{
                              aspectRatio: "1", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 800,
                              background: st.bg, color: st.fg, border: `2px solid ${i === index ? "var(--blue)" : st.border}`,
                            }}>{i + 1}</button>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}

                <button onClick={() => setSheet("confirm")} style={{ ...primaryBtn, width: "100%", marginTop: 4 }}>
                  {timed ? "Submit test" : "Check answers"}
                </button>
              </>
            ) : (
              <>
                <p style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.01em" }}>{timed ? "Submit the test?" : "Check your answers?"}</p>
                <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--ink-soft)" }}>You can&apos;t change answers after this.</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginBottom: 16 }}>
                  {[
                    { n: answered, label: "Answered", c: "#16A34A" },
                    { n: total - answered, label: "Not answered", c: "#B91C1C" },
                    { n: marked.size, label: "Marked", c: "var(--purple)" },
                  ].map((x) => (
                    <div key={x.label} style={{ background: "var(--app-bg)", border: "1px solid var(--line)", borderRadius: 12, padding: "10px 6px", textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: x.c }}>{x.n}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 10.5, color: "var(--ink-soft)" }}>{x.label}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setSheet("map")} style={{ ...outlineBtn, flex: 1 }}>Review</button>
                  <button onClick={doSubmit} disabled={submitting} style={{ ...primaryBtn, flex: 1.4, opacity: submitting ? 0.7 : 1 }}>
                    {submitting ? "Submitting…" : "Yes, submit"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// One reviewed question, with an on-demand "Explain with AI" panel.
function ReviewCard({ r, index, showPassage }: { r: ReviewItem; index: number; showPassage: boolean }) {
  const optText = (k: string) => (r as unknown as Record<string, string>)[k];
  const [busy, setBusy] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const explain = async () => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await explainAnswerAction({ questionId: r.id, chosen: r.chosen });
      if (res.ok && res.text) setExplanation(res.text);
      else setErr(res.error ?? "Couldn't generate an explanation right now.");
    } catch {
      setErr("Couldn't generate an explanation right now.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ ...card, padding: "13px 14px" }}>
      {showPassage && <PassageBlock passage={r.passage} />}
      <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Q{index + 1}. {r.text}</p>
      {(["a", "b", "c", "d"] as const).map((opt) => {
        const isCorrect = r.correct === opt;
        const isChosen = r.chosen === opt;
        const bg = isCorrect ? "var(--success)" : isChosen ? "var(--error)" : "transparent";
        const col = isCorrect ? "var(--success-text)" : isChosen ? "var(--error-text)" : "var(--text-muted)";
        return (
          <div key={opt} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, background: bg, fontSize: 12.5, color: col, fontWeight: isCorrect || isChosen ? 700 : 400 }}>
            <span style={{ fontWeight: 800 }}>{opt.toUpperCase()}.</span>
            <span style={{ flex: 1 }}>{optText(opt)}</span>
            {isCorrect && <span style={{ fontSize: 11, display: "inline-flex", alignItems: "center", gap: 3 }}><AppIcon name="check" size={12} strokeWidth={2.6} />correct</span>}
            {isChosen && !isCorrect && <span style={{ fontSize: 11 }}>your answer</span>}
          </div>
        );
      })}
      {!r.chosen && <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--ink-mute)" }}>Not attempted</p>}

      {/* The paper's own solution, when the author wrote one. */}
      {r.explanation && (
        <div style={{ marginTop: 10, background: "var(--info-bg)", border: "1px solid var(--info-border)", borderRadius: 12, padding: "10px 12px" }}>
          <p style={{ margin: "0 0 4px", fontSize: 11.5, fontWeight: 800, color: "var(--info-text)" }}>Solution</p>
          <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{r.explanation}</p>
        </div>
      )}

      {explanation ? (
        <div style={{ marginTop: 10, background: "var(--purple-tint)", border: "1px solid var(--line)", borderRadius: 12, padding: "10px 12px", fontSize: 12.5, color: "var(--ink)", lineHeight: 1.55 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, fontWeight: 800, color: "var(--purple)", fontSize: 11.5 }}><AppIcon name="sparkle" size={14} /> AI explanation</div>
          <AiText text={explanation} />
        </div>
      ) : (
        <button onClick={explain} disabled={busy} style={{ ...smallBtn, marginTop: 10, fontSize: 12, cursor: busy ? "default" : "pointer", opacity: busy ? 0.75 : 1 }}>
          {busy ? "Thinking…" : <><AppIcon name="sparkle" size={14} /> {r.explanation ? "Explain further with AI" : "Explain with AI"}</>}
        </button>
      )}
      {err && (
        <p style={{ margin: "8px 0 0", fontSize: 11.5, color: "var(--warning-text)", display: "flex", alignItems: "flex-start", gap: 6 }}>
          <AppIcon name="alert" size={14} style={{ marginTop: 1 }} /> {err}
        </p>
      )}
    </div>
  );
}

// ── Result + review ────────────────────────────────────────
export function TestResultPage({ title, result, onBack }: { title: string; result: Extract<SubmitResult, { ok: true }>; onBack: () => void }) {
  const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;

  return (
    <div style={page}>
      <ScreenHeader title="Test Series" onBack={onBack} />

      <div style={{ padding: "14px 16px 0" }}>
        <div style={{ background: gradient, borderRadius: 20, padding: "20px", color: "white", textAlign: "center", boxShadow: "0 8px 22px rgba(11,92,255,0.25)" }}>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{title}</p>
          <p style={{ margin: "8px 0 0", fontSize: 40, fontWeight: 900 }}>{result.score}<span style={{ fontSize: 20, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>/{result.total}</span></p>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 14 }}>
            {[
              { v: "AIR " + result.rank, l: "All-India Rank" },
              { v: result.percentile + "%ile", l: "Percentile" },
              { v: pct + "%", l: "Score" },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color: "var(--gold)" }}>{s.v}</p>
                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.7)" }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
          {[
            { v: result.correct, l: "Correct", c: "var(--success-text)", icon: "checkCircle" as const },
            { v: result.wrong, l: "Wrong", c: "var(--error-text)", icon: "xCircle" as const },
            { v: result.unattempted, l: "Skipped", c: "var(--text-muted)", icon: "more" as const },
          ].map((s, i) => (
            <div key={i} style={{ ...card, flex: 1, padding: "10px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <AppIcon name={s.icon} size={17} color={s.c} />
              <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 900, color: s.c }}>{s.v}</p>
              <p style={{ margin: 0, fontSize: 11, color: "var(--ink-soft)" }}>{s.l}</p>
            </div>
          ))}
        </div>
        <p style={{ margin: "0 0 8px", fontSize: 11, color: "var(--ink-mute)", textAlign: "center" }}>{result.takers} student{result.takers > 1 ? "s" : ""} have taken this test</p>

        <div style={{ margin: "4px 0 12px" }}>
          <SectionTitle title="Review answers" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {result.review.map((r, i) => (
            <ReviewCard key={r.id} r={r} index={i} showPassage={!!r.passage && r.passage !== result.review[i - 1]?.passage} />
          ))}
        </div>
      </div>
    </div>
  );
}

export type { TakeQuestion };
