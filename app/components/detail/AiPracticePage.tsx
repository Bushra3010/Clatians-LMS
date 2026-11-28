"use client";

import { useState } from "react";
import { generatePracticeAction, savePracticeResultAction } from "../../lib/ai-actions";
import type { PracticeMCQ } from "../../lib/ai"; // type-only — safe for clients (erased at build)

import { AppIcon, subjectIconName } from "../AppIcon";
import { heroSurface, ScreenHeader, card, page, primaryBtn, goldBtn, gradient } from "../ui/kit";

/** Sections, with a few topics to tap instead of typing. */
const SECTIONS: { name: string; short: string; topics: string[] }[] = [
  { name: "Legal Reasoning", short: "Legal", topics: ["Law of Torts", "Article 21", "Contract Law", "Criminal Law"] },
  { name: "English", short: "English", topics: ["Reading Comprehension", "Vocabulary", "Inference", "Parajumbles"] },
  { name: "GK & Current Affairs", short: "GK", topics: ["Supreme Court rulings", "International bodies", "Indian Polity", "Awards & summits"] },
  { name: "Logical Reasoning", short: "Logical", topics: ["Assumptions", "Syllogisms", "Strengthen / weaken", "Arrangements"] },
  { name: "Quantitative", short: "Quant", topics: ["Percentages", "Ratios", "Profit & loss", "Data interpretation"] },
];
const LEVELS = [{ key: "easy", label: "Easy" }, { key: "medium", label: "Medium" }, { key: "hard", label: "Hard" }];
const COUNTS = [3, 5, 10];
const LETTERS = ["a", "b", "c", "d"] as const;

type Phase = "setup" | "quiz" | "result";

/** A row of tap-to-pick pills. */
function Pills<T extends string | number>({ items, value, onChange, disabled }: { items: { key: T; label: string }[]; value: T; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 6, background: "var(--app-bg)", borderRadius: 14, padding: 4 }}>
      {items.map((it) => {
        const on = it.key === value;
        return (
          <button key={String(it.key)} type="button" disabled={disabled} onClick={() => onChange(it.key)} style={{
            flex: 1, border: "none", borderRadius: 11, padding: "9px 4px", cursor: disabled ? "default" : "pointer",
            fontSize: 13, fontWeight: on ? 800 : 600,
            background: on ? "white" : "transparent", color: on ? "var(--blue)" : "var(--ink-soft)",
            boxShadow: on ? "0 2px 8px rgba(15,23,41,0.10)" : "none",
          }}>{it.label}</button>
        );
      })}
    </div>
  );
}

const label: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 800, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 2px 8px" };

export default function AiPracticePage({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState(SECTIONS[0].name);
  const [difficulty, setDifficulty] = useState("medium");
  const [count, setCount] = useState(5);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [questions, setQuestions] = useState<PracticeMCQ[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [current, setCurrent] = useState(0);
  const [saved, setSaved] = useState(false);
  const [openReview, setOpenReview] = useState<number | null>(null);

  const section = SECTIONS.find((s) => s.name === subject) ?? SECTIONS[0];

  const generate = async () => {
    if (busy || !topic.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await generatePracticeAction({ topic: topic.trim(), subject, difficulty, count });
      if (res.ok && res.questions && res.questions.length > 0) {
        setQuestions(res.questions);
        setAnswers({});
        setCurrent(0);
        setPhase("quiz");
      } else {
        setErr(res.error ?? "Couldn't generate a quiz right now.");
      }
    } catch {
      setErr("Couldn't generate a quiz right now.");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setPhase("setup");
    setQuestions([]);
    setAnswers({});
    setCurrent(0);
    setErr(null);
    setSaved(false);
    setOpenReview(null);
  };

  const score = questions.reduce((n, q, i) => n + (answers[i] === q.correct ? 1 : 0), 0);
  const answeredCount = Object.keys(answers).length;

  const finish = () => {
    setPhase("result");
    // Persist the result so it counts toward the student's streak & points.
    savePracticeResultAction({ topic, subject, difficulty, total: questions.length, correct: score })
      .then((r) => setSaved(r.ok))
      .catch(() => setSaved(false));
  };

  // ── Setup ──
  if (phase === "setup") {
    const ready = !!topic.trim() && !busy;
    return (
      <div style={page}>
        <ScreenHeader title="AI Practice" onBack={onBack} />
        <div style={{ padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <span style={label}>Section</span>
            <div className="no-scroll" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
              {SECTIONS.map((s) => {
                const on = s.name === subject;
                return (
                  <button key={s.name} disabled={busy} onClick={() => { setSubject(s.name); setTopic(""); }} className="press" style={{
                    flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 72, padding: "12px 4px 10px",
                    borderRadius: 16, cursor: "pointer", border: on ? "1.5px solid var(--blue)" : "1px solid var(--line)",
                    background: on ? "var(--blue-tint)" : "white",
                  }}>
                    <span style={{ width: 34, height: 34, borderRadius: 11, background: on ? gradient : "var(--app-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <AppIcon name={subjectIconName(s.name)} size={17} color={on ? "white" : "var(--ink-soft)"} />
                    </span>
                    <span style={{ fontSize: 11.5, fontWeight: on ? 800 : 600, color: on ? "var(--blue)" : "var(--ink)" }}>{s.short}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span style={label}>Topic</span>
            <div style={{ ...card, display: "flex", alignItems: "center", gap: 10, padding: "4px 6px 4px 14px" }}>
              <AppIcon name="search" size={17} color="var(--ink-mute)" />
              <input value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") generate(); }} disabled={busy}
                placeholder="Type any topic" style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: 14.5, padding: "11px 0", color: "var(--ink)" }} />
              {topic && <button onClick={() => setTopic("")} aria-label="Clear" style={{ border: "none", background: "none", padding: 6, cursor: "pointer", display: "flex" }}><AppIcon name="close" size={15} color="var(--ink-mute)" /></button>}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {section.topics.map((t) => (
                <button key={t} disabled={busy} onClick={() => setTopic(t)} style={{
                  border: topic === t ? "1.5px solid var(--blue)" : "1px solid var(--line)", borderRadius: 20, padding: "6px 12px", cursor: "pointer",
                  background: topic === t ? "var(--blue-tint)" : "white", color: topic === t ? "var(--blue)" : "var(--ink-soft)", fontSize: 12, fontWeight: 700,
                }}>{t}</button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <span style={label}>Level</span>
              <Pills items={LEVELS} value={difficulty} onChange={setDifficulty} disabled={busy} />
            </div>
            <div>
              <span style={label}>Questions</span>
              <Pills items={COUNTS.map((n) => ({ key: n, label: String(n) }))} value={count} onChange={setCount} disabled={busy} />
            </div>
          </div>

          {err && (
            <p style={{ margin: 0, fontSize: 12.5, color: "var(--error-text)", background: "var(--error)", borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "flex-start", gap: 6 }}>
              <AppIcon name="alert" size={14} style={{ marginTop: 1 }} /> {err}
            </p>
          )}

          <button onClick={generate} disabled={!ready} className="press" style={{ ...goldBtn, width: "100%", padding: 15, fontSize: 15, color: "var(--blue-dark)", cursor: ready ? "pointer" : "default", opacity: ready || busy ? 1 : 0.55 }}>
            {busy ? <><span className="ai-spin" /> Building your quiz…</> : <><AppIcon name="bolt" size={17} color="var(--blue-dark)" /> Generate quiz</>}
          </button>
          <p style={{ margin: "-8px 0 0", fontSize: 11, color: "var(--ink-mute)", textAlign: "center" }}>AI-made practice — double-check important facts.</p>
        </div>
        <style>{`.ai-spin{width:16px;height:16px;border-radius:50%;border:2.5px solid rgba(23,37,84,.25);border-top-color:var(--blue-dark);display:inline-block;animation:aispin .8s linear infinite}@keyframes aispin{to{transform:rotate(360deg)}}@media (prefers-reduced-motion: reduce){.ai-spin{animation:none}}`}</style>
      </div>
    );
  }

  // ── Quiz: one question at a time ──
  if (phase === "quiz") {
    const q = questions[current];
    const chosen = answers[current];
    const last = current === questions.length - 1;
    return (
      <div style={page}>
        <ScreenHeader title={topic} subtitle={`${subject} · ${difficulty}`} onBack={reset} />
        <div style={{ padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}>
              <span>Question {current + 1} of {questions.length}</span>
              <span>{answeredCount} answered</span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {questions.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)} aria-label={`Question ${i + 1}`} style={{ flex: 1, height: 6, border: "none", padding: 0, borderRadius: 3, cursor: "pointer", background: i === current ? "var(--blue)" : answers[i] ? "var(--blue-light, #93B4FF)" : "var(--line)" }} />
              ))}
            </div>
          </div>

          <div style={{ ...card, padding: 18 }}>
            <p style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: "var(--ink)", lineHeight: 1.55 }}>{q.text}</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {LETTERS.map((opt) => {
              const sel = chosen === opt;
              return (
                <button key={opt} onClick={() => setAnswers((a) => ({ ...a, [current]: opt }))} className="press" style={{
                  display: "flex", alignItems: "center", gap: 12, textAlign: "left", cursor: "pointer",
                  border: `1.5px solid ${sel ? "var(--blue)" : "var(--line)"}`, background: sel ? "var(--blue-tint)" : "white",
                  borderRadius: 16, padding: "13px 14px", fontSize: 14, color: "var(--ink)", fontWeight: sel ? 700 : 500,
                  boxShadow: sel ? "0 4px 12px rgba(11,92,255,0.12)" : "none",
                }}>
                  <span style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, background: sel ? gradient : "var(--app-bg)", color: sel ? "white" : "var(--ink-soft)" }}>{opt.toUpperCase()}</span>
                  <span style={{ flex: 1, lineHeight: 1.45 }}>{q[opt]}</span>
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0} style={{ flex: "0 0 auto", width: 52, borderRadius: 14, border: "1px solid var(--line)", background: "white", cursor: current === 0 ? "default" : "pointer", opacity: current === 0 ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Previous">
              <AppIcon name="chevronRight" size={18} color="var(--ink)" style={{ transform: "rotate(180deg)" }} />
            </button>
            {last ? (
              <button onClick={finish} className="press" style={{ ...goldBtn, flex: 1, padding: 14, fontSize: 15, color: "var(--blue-dark)" }}>
                Submit{answeredCount < questions.length ? ` (${answeredCount}/${questions.length})` : ""}
              </button>
            ) : (
              <button onClick={() => setCurrent((c) => c + 1)} className="press" style={{ ...primaryBtn, flex: 1, padding: 14, fontSize: 15 }}>
                Next <AppIcon name="arrowRight" size={16} color="white" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Result ──
  const pct = Math.round((score / questions.length) * 100);
  const wrong = answeredCount - score;
  const skipped = questions.length - answeredCount;
  const R = 46, C = 2 * Math.PI * R;
  return (
    <div style={page}>
      <ScreenHeader title="Your result" subtitle={topic} onBack={reset} />
      <div style={{ padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ ...heroSurface, padding: "22px 16px 18px", color: "white", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="10" />
            <circle cx="60" cy="60" r={R} fill="none" stroke="var(--gold)" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} transform="rotate(-90 60 60)" />
            <text x="60" y="58" textAnchor="middle" fill="white" fontSize="26" fontWeight="900">{score}/{questions.length}</text>
            <text x="60" y="78" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="12">{pct}%</text>
          </svg>
          <p style={{ margin: "8px 0 0", fontSize: 16, fontWeight: 800 }}>{pct >= 80 ? "Excellent work!" : pct >= 50 ? "Good effort" : "Keep practising"}</p>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {[{ v: score, l: "Correct", c: "#86EFAC" }, { v: wrong, l: "Wrong", c: "#FCA5A5" }, { v: skipped, l: "Skipped", c: "rgba(255,255,255,0.7)" }].map((x) => (
              <span key={x.l} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "7px 12px", textAlign: "center", minWidth: 70 }}>
                <span style={{ display: "block", fontSize: 16, fontWeight: 900, color: x.c }}>{x.v}</span>
                <span style={{ display: "block", fontSize: 10.5, color: "rgba(255,255,255,0.7)" }}>{x.l}</span>
              </span>
            ))}
          </div>
          {saved && (
            <p style={{ margin: "12px 0 0", fontSize: 11.5, color: "rgba(255,255,255,0.75)", display: "inline-flex", alignItems: "center", gap: 5 }}>
              <AppIcon name="checkCircle" size={13} color="#86EFAC" /> Added to your streak & points
            </p>
          )}
        </div>

        <p style={{ margin: "4px 2px 0", fontSize: 12, fontWeight: 800, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Review answers</p>
        <div style={{ ...card, overflow: "hidden" }}>
          {questions.map((q, i) => {
            const chosen = answers[i];
            const right = chosen === q.correct;
            const open = openReview === i;
            return (
              <div key={i} style={{ borderTop: i ? "1px solid var(--line)" : "none" }}>
                <button onClick={() => setOpenReview(open ? null : i)} style={{ width: "100%", border: "none", background: "white", cursor: "pointer", textAlign: "left", padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: !chosen ? "var(--surface-dim)" : right ? "var(--success)" : "var(--error)" }}>
                    <AppIcon name={!chosen ? "more" : right ? "check" : "close"} size={13} strokeWidth={3} color={!chosen ? "var(--ink-mute)" : right ? "var(--success-text)" : "var(--error-text)"} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: "var(--ink)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: open ? 99 : 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>Q{i + 1}. {q.text}</span>
                  <AppIcon name="chevronDown" size={16} color="var(--ink-mute)" style={{ transform: open ? "rotate(180deg)" : "none", flexShrink: 0 }} />
                </button>
                {open && (
                  <div style={{ padding: "0 14px 14px 50px", display: "flex", flexDirection: "column", gap: 6 }}>
                    {LETTERS.map((opt) => {
                      const isCorrect = q.correct === opt;
                      const sel = chosen === opt;
                      if (!isCorrect && !sel) return null;
                      return (
                        <span key={opt} style={{ fontSize: 12.5, fontWeight: 700, borderRadius: 10, padding: "7px 10px", background: isCorrect ? "var(--success)" : "var(--error)", color: isCorrect ? "var(--success-text)" : "var(--error-text)" }}>
                          {isCorrect ? "Correct" : "Your answer"}: {opt.toUpperCase()}. {q[opt]}
                        </span>
                      );
                    })}
                    {q.explanation && <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.55 }}>{q.explanation}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={reset} className="press" style={{ ...primaryBtn, width: "100%", padding: 14, fontSize: 14.5 }}>
          <AppIcon name="bolt" size={16} color="white" /> Practise another topic
        </button>
      </div>
    </div>
  );
}
