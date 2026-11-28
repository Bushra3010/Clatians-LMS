"use client";

import { useEffect, useRef, useState } from "react";
import { generatePracticeAction, savePracticeResultAction } from "../../lib/ai-actions";
import type { PracticeMCQ } from "../../lib/ai"; // type-only — safe for clients (erased at build)
import { AppIcon, subjectIconName } from "../AppIcon";
import { ScreenHeader, card, page, goldBtn, primaryBtn, gradient, heroSurface } from "../ui/kit";

/**
 * AI Test — a timed, CLAT-style paper the AI writes on the spot.
 * Full mock mixes all five sections in exam order; a sectional test sticks to
 * one. One minute per question, +1 / −0.25 marking, auto-submit at zero.
 */

const SECTIONS = ["English", "GK & Current Affairs", "Legal Reasoning", "Logical Reasoning", "Quantitative"];
const SHORT: Record<string, string> = { "English": "English", "GK & Current Affairs": "GK", "Legal Reasoning": "Legal", "Logical Reasoning": "Logical", "Quantitative": "Quant" };
const LENGTHS = [10, 20, 30];
const LEVELS = [{ key: "easy", label: "Easy" }, { key: "medium", label: "Medium" }, { key: "hard", label: "Hard" }];
const LETTERS = ["a", "b", "c", "d"] as const;
const NEG = 0.25;

type Q = PracticeMCQ & { section: string };
type Phase = "setup" | "test" | "result";

/** Split `total` questions across sections into AI calls of 3–10 each. */
function plan(sections: string[], total: number): { section: string; count: number }[] {
  const per = Math.ceil(total / sections.length);
  const out: { section: string; count: number }[] = [];
  for (const s of sections) {
    let left = per;
    while (left > 0) {
      const n = Math.min(10, Math.max(3, left));
      out.push({ section: s, count: n });
      left -= n;
    }
  }
  return out;
}

/** Keep `total` questions, taking evenly from each section and keeping exam order. */
function trim(qs: Q[], sections: string[], total: number): Q[] {
  const by = sections.map((s) => qs.filter((q) => q.section === s));
  const picked: Q[][] = by.map(() => []);
  let added = 0;
  for (let round = 0; added < total; round++) {
    let progressed = false;
    by.forEach((list, i) => {
      if (added < total && list[round]) { picked[i].push(list[round]); added++; progressed = true; }
    });
    if (!progressed) break;
  }
  return picked.flat();
}

const mmss = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

function Pills<T extends string | number>({ items, value, onChange }: { items: { key: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div style={{ display: "flex", gap: 6, background: "var(--app-bg)", borderRadius: 14, padding: 4 }}>
      {items.map((it) => {
        const on = it.key === value;
        return (
          <button key={String(it.key)} type="button" onClick={() => onChange(it.key)} style={{
            flex: 1, border: "none", borderRadius: 11, padding: "9px 4px", cursor: "pointer", fontSize: 13, fontWeight: on ? 800 : 600,
            background: on ? "white" : "transparent", color: on ? "var(--blue)" : "var(--ink-soft)", boxShadow: on ? "0 2px 8px rgba(15,23,41,0.10)" : "none",
          }}>{it.label}</button>
        );
      })}
    </div>
  );
}

const label: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 800, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 2px 8px" };

export default function AiTestPage({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<"full" | "section">("full");
  const [section, setSection] = useState(SECTIONS[2]);
  const [length, setLength] = useState(20);
  const [difficulty, setDifficulty] = useState("medium");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [qs, setQs] = useState<Q[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [current, setCurrent] = useState(0);
  const [palette, setPalette] = useState(false);
  const [endsAt, setEndsAt] = useState(0);
  const [left, setLeft] = useState(0);
  const [taken, setTaken] = useState(0);
  const [openReview, setOpenReview] = useState<number | null>(null);
  const submitted = useRef(false);

  const sections = mode === "full" ? SECTIONS : [section];

  const start = async () => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const calls = plan(sections, length);
      const results = await Promise.all(calls.map((c) =>
        generatePracticeAction({ topic: `Mixed CLAT-pattern ${c.section} questions`, subject: c.section, difficulty, count: c.count })
          .then((r) => ({ c, r }))));
      const failed = results.find((x) => !x.r.ok);
      const all: Q[] = results.flatMap(({ c, r }) => (r.ok && r.questions ? r.questions.map((q) => ({ ...q, section: c.section })) : []));
      if (all.length === 0) {
        setErr(failed?.r.error ?? "Couldn't build the test right now.");
        return;
      }
      const paper = trim(all, sections, length);
      setQs(paper);
      setAnswers({});
      setCurrent(0);
      submitted.current = false;
      const secs = paper.length * 60;
      setEndsAt(Date.now() + secs * 1000);
      setLeft(secs);
      setPhase("test");
    } catch {
      setErr("Couldn't build the test right now.");
    } finally {
      setBusy(false);
    }
  };

  const score = qs.reduce((n, q, i) => n + (answers[i] === undefined ? 0 : answers[i] === q.correct ? 1 : -NEG), 0);
  const correct = qs.filter((q, i) => answers[i] === q.correct).length;
  const attempted = Object.keys(answers).length;

  const submit = () => {
    if (submitted.current) return;
    submitted.current = true;
    setTaken(Math.min(qs.length * 60, qs.length * 60 - Math.max(0, Math.round((endsAt - Date.now()) / 1000))));
    setPhase("result");
    setPalette(false);
    savePracticeResultAction({ topic: "AI Test", subject: mode === "full" ? "Full mock" : section, difficulty, total: qs.length, correct }).catch(() => {});
  };

  // The clock: tick every second; hand the paper in at zero.
  useEffect(() => {
    if (phase !== "test") return;
    const t = setInterval(() => {
      const s = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) submit();
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, endsAt]);

  // ── Setup ──
  if (phase === "setup") {
    return (
      <div style={page}>
        <ScreenHeader title="AI Test" onBack={onBack} />
        <div style={{ padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ ...heroSurface, padding: 16, color: "white", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 46, height: 46, borderRadius: 14, background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <AppIcon name="clipboard" size={22} color="var(--blue-dark)" />
            </span>
            <span>
              <span style={{ display: "block", fontSize: 16, fontWeight: 800 }}>A fresh paper, every time</span>
              <span style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.72)", marginTop: 2 }}>Timed · +1 / −0.25 · CLAT pattern</span>
            </span>
          </div>

          <div>
            <span style={label}>Test type</span>
            <Pills items={[{ key: "full", label: "Full mock" }, { key: "section", label: "One section" }]} value={mode} onChange={setMode} />
            {mode === "section" && (
              <div className="no-scroll" style={{ display: "flex", gap: 8, overflowX: "auto", marginTop: 10 }}>
                {SECTIONS.map((s) => {
                  const on = s === section;
                  return (
                    <button key={s} onClick={() => setSection(s)} className="press" style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 72, padding: "11px 4px 9px", borderRadius: 16, cursor: "pointer", border: on ? "1.5px solid var(--blue)" : "1px solid var(--line)", background: on ? "var(--blue-tint)" : "white" }}>
                      <span style={{ width: 32, height: 32, borderRadius: 10, background: on ? gradient : "var(--app-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <AppIcon name={subjectIconName(s)} size={16} color={on ? "white" : "var(--ink-soft)"} />
                      </span>
                      <span style={{ fontSize: 11.5, fontWeight: on ? 800 : 600, color: on ? "var(--blue)" : "var(--ink)" }}>{SHORT[s]}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <span style={label}>Questions</span>
              <Pills items={LENGTHS.map((n) => ({ key: n, label: String(n) }))} value={length} onChange={setLength} />
            </div>
            <div>
              <span style={label}>Level</span>
              <Pills items={LEVELS} value={difficulty} onChange={setDifficulty} />
            </div>
          </div>

          <div style={{ ...card, padding: "12px 14px", display: "flex" }}>
            {[{ v: `${length}`, l: "Questions" }, { v: `${length} min`, l: "Time" }, { v: mode === "full" ? "5" : "1", l: mode === "full" ? "Sections" : "Section" }].map((x, i) => (
              <div key={x.l} style={{ flex: 1, textAlign: "center", borderLeft: i ? "1px solid var(--line)" : "none" }}>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color: "var(--ink)" }}>{x.v}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--ink-soft)" }}>{x.l}</p>
              </div>
            ))}
          </div>

          {err && (
            <p style={{ margin: 0, fontSize: 12.5, color: "var(--error-text)", background: "var(--error)", borderRadius: 12, padding: "10px 12px", display: "flex", gap: 6 }}>
              <AppIcon name="alert" size={14} style={{ marginTop: 1 }} /> {err}
            </p>
          )}

          <button onClick={start} disabled={busy} className="press" style={{ ...goldBtn, width: "100%", padding: 15, fontSize: 15, color: "var(--blue-dark)", cursor: busy ? "default" : "pointer" }}>
            {busy ? <><span className="ai-spin" /> Writing your paper…</> : <><AppIcon name="play" size={15} color="var(--blue-dark)" fill="var(--blue-dark)" /> Start test</>}
          </button>
          <p style={{ margin: "-8px 0 0", fontSize: 11, color: "var(--ink-mute)", textAlign: "center" }}>The timer starts as soon as the paper is ready.</p>
        </div>
        <style>{`.ai-spin{width:16px;height:16px;border-radius:50%;border:2.5px solid rgba(23,37,84,.25);border-top-color:var(--blue-dark);display:inline-block;animation:aispin .8s linear infinite}@keyframes aispin{to{transform:rotate(360deg)}}@media (prefers-reduced-motion: reduce){.ai-spin{animation:none}}`}</style>
      </div>
    );
  }

  // ── The exam ──
  if (phase === "test") {
    const q = qs[current];
    const chosen = answers[current];
    const low = left <= 60;
    return (
      <div style={page}>
        {/* Exam bar: timer, progress, palette */}
        <div style={{ position: "sticky", top: "var(--top-h, 0px)", zIndex: 5, background: "white", borderBottom: "1px solid var(--line)", padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 12, background: low ? "var(--error)" : "var(--blue-tint)", color: low ? "var(--error-text)" : "var(--blue)", fontSize: 15, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>
              <AppIcon name="clock" size={15} />{mmss(left)}
            </span>
            <span style={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: "var(--ink-soft)" }}>{attempted}/{qs.length} answered</span>
            <button onClick={() => setPalette((p) => !p)} aria-label="All questions" style={{ border: "1px solid var(--line)", background: palette ? "var(--blue-tint)" : "white", borderRadius: 12, padding: "7px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 800, color: "var(--ink)" }}>
              <AppIcon name="list" size={15} />{current + 1}/{qs.length}
            </button>
          </div>
          {palette && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(36px, 1fr))", gap: 6, marginTop: 12 }}>
              {qs.map((_, i) => (
                <button key={i} onClick={() => { setCurrent(i); setPalette(false); }} style={{
                  height: 36, borderRadius: 10, cursor: "pointer", fontSize: 12.5, fontWeight: 800,
                  border: i === current ? "2px solid var(--blue)" : "1px solid var(--line)",
                  background: answers[i] ? gradient : "white", color: answers[i] ? "white" : "var(--ink-soft)",
                }}>{i + 1}</button>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
          <span style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 800, color: "var(--blue)", background: "var(--blue-tint)", padding: "4px 10px", borderRadius: 20 }}>
            <AppIcon name={subjectIconName(q.section)} size={12} />{q.section}
          </span>
          <div style={{ ...card, padding: 18 }}>
            <p style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: "var(--ink)", lineHeight: 1.55 }}><span style={{ color: "var(--blue)" }}>Q{current + 1}.</span> {q.text}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {LETTERS.map((opt) => {
              const sel = chosen === opt;
              return (
                <button key={opt} onClick={() => setAnswers((a) => {
                  // Tapping the chosen option again clears it — no penalty for a skip.
                  const n = { ...a };
                  if (n[current] === opt) delete n[current]; else n[current] = opt;
                  return n;
                })} className="press" style={{
                  display: "flex", alignItems: "center", gap: 12, textAlign: "left", cursor: "pointer",
                  border: `1.5px solid ${sel ? "var(--blue)" : "var(--line)"}`, background: sel ? "var(--blue-tint)" : "white",
                  borderRadius: 16, padding: "13px 14px", fontSize: 14, color: "var(--ink)", fontWeight: sel ? 700 : 500,
                }}>
                  <span style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, background: sel ? gradient : "var(--app-bg)", color: sel ? "white" : "var(--ink-soft)" }}>{opt.toUpperCase()}</span>
                  <span style={{ flex: 1, lineHeight: 1.45 }}>{q[opt]}</span>
                </button>
              );
            })}
          </div>
          <p style={{ margin: 0, fontSize: 11, color: "var(--ink-mute)", textAlign: "center" }}>Tap your answer again to clear it.</p>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0} aria-label="Previous" style={{ width: 52, borderRadius: 14, border: "1px solid var(--line)", background: "white", cursor: current === 0 ? "default" : "pointer", opacity: current === 0 ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AppIcon name="chevronRight" size={18} color="var(--ink)" style={{ transform: "rotate(180deg)" }} />
            </button>
            {current < qs.length - 1 ? (
              <button onClick={() => setCurrent((c) => c + 1)} className="press" style={{ ...primaryBtn, flex: 1, padding: 14, fontSize: 15 }}>
                Next <AppIcon name="arrowRight" size={16} color="white" />
              </button>
            ) : (
              <button onClick={() => { if (attempted === qs.length || window.confirm(`${qs.length - attempted} questions are unanswered. Submit anyway?`)) submit(); }} className="press" style={{ ...goldBtn, flex: 1, padding: 14, fontSize: 15, color: "var(--blue-dark)" }}>
                Submit test
              </button>
            )}
          </div>
          {current < qs.length - 1 && (
            <button onClick={() => { if (window.confirm(`Submit now? ${qs.length - attempted} questions are unanswered.`)) submit(); }} style={{ border: "none", background: "none", color: "var(--ink-soft)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", padding: 4 }}>
              Submit early
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Result ──
  const pct = qs.length ? Math.round((correct / qs.length) * 100) : 0;
  const wrong = attempted - correct;
  const bySection = [...new Set(qs.map((q) => q.section))].map((s) => {
    const idx = qs.map((q, i) => (q.section === s ? i : -1)).filter((i) => i >= 0);
    const c = idx.filter((i) => answers[i] === qs[i].correct).length;
    return { s, total: idx.length, correct: c };
  });
  return (
    <div style={page}>
      <ScreenHeader title="Test result" subtitle={mode === "full" ? "AI full mock" : section} onBack={() => setPhase("setup")} />
      <div style={{ padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ ...heroSurface, padding: "20px 16px", color: "white", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255,255,255,0.75)" }}>Your score</p>
          <p style={{ margin: "4px 0 0", fontSize: 40, fontWeight: 900, color: "var(--gold)", lineHeight: 1.1 }}>
            {Number.isInteger(score) ? score : score.toFixed(2)}<span style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", fontWeight: 700 }}> / {qs.length}</span>
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.72)" }}>{pct}% accuracy · {mmss(taken)} taken</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 14 }}>
            {[{ v: correct, l: "Correct", c: "#86EFAC" }, { v: wrong, l: "Wrong", c: "#FCA5A5" }, { v: qs.length - attempted, l: "Skipped", c: "rgba(255,255,255,0.75)" }].map((x) => (
              <span key={x.l} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "7px 12px", minWidth: 70 }}>
                <span style={{ display: "block", fontSize: 16, fontWeight: 900, color: x.c }}>{x.v}</span>
                <span style={{ display: "block", fontSize: 10.5, color: "rgba(255,255,255,0.7)" }}>{x.l}</span>
              </span>
            ))}
          </div>
        </div>

        {bySection.length > 1 && (
          <div style={{ ...card, padding: 16 }}>
            <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>Section-wise</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {bySection.map((x) => {
                const p = x.total ? Math.round((x.correct / x.total) * 100) : 0;
                const col = p < 40 ? "var(--error-text)" : p < 70 ? "var(--warning-text)" : "var(--green)";
                return (
                  <div key={x.s}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 5 }}>
                      <span>{x.s}</span><span style={{ color: col }}>{x.correct}/{x.total}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 20, background: "var(--surface-dim)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${p}%`, background: col, borderRadius: 20 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p style={{ margin: "4px 2px 0", fontSize: 12, fontWeight: 800, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Review answers</p>
        <div style={{ ...card, overflow: "hidden" }}>
          {qs.map((q, i) => {
            const ch = answers[i];
            const right = ch === q.correct;
            const open = openReview === i;
            return (
              <div key={i} style={{ borderTop: i ? "1px solid var(--line)" : "none" }}>
                <button onClick={() => setOpenReview(open ? null : i)} style={{ width: "100%", border: "none", background: "white", cursor: "pointer", textAlign: "left", padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: !ch ? "var(--surface-dim)" : right ? "var(--success)" : "var(--error)" }}>
                    <AppIcon name={!ch ? "more" : right ? "check" : "close"} size={13} strokeWidth={3} color={!ch ? "var(--ink-mute)" : right ? "var(--success-text)" : "var(--error-text)"} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: "var(--ink)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: open ? 99 : 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>Q{i + 1}. {q.text}</span>
                  <AppIcon name="chevronDown" size={16} color="var(--ink-mute)" style={{ transform: open ? "rotate(180deg)" : "none", flexShrink: 0 }} />
                </button>
                {open && (
                  <div style={{ padding: "0 14px 14px 50px", display: "flex", flexDirection: "column", gap: 6 }}>
                    {LETTERS.filter((o) => o === q.correct || o === ch).map((o) => (
                      <span key={o} style={{ fontSize: 12.5, fontWeight: 700, borderRadius: 10, padding: "7px 10px", background: o === q.correct ? "var(--success)" : "var(--error)", color: o === q.correct ? "var(--success-text)" : "var(--error-text)" }}>
                        {o === q.correct ? "Correct" : "Your answer"}: {o.toUpperCase()}. {q[o]}
                      </span>
                    ))}
                    {q.explanation && <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.55 }}>{q.explanation}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={() => setPhase("setup")} className="press" style={{ ...primaryBtn, width: "100%", padding: 14, fontSize: 14.5 }}>
          <AppIcon name="refresh" size={16} color="white" /> Take another test
        </button>
        <button onClick={onBack} style={{ border: "none", background: "none", color: "var(--ink-soft)", fontSize: 13, fontWeight: 700, cursor: "pointer", padding: 4 }}>Back to AI Prep</button>
      </div>
    </div>
  );
}
