"use client";

import { useState } from "react";
import { generatePracticeAction, type PracticeMCQ } from "../../lib/ai-actions";

const ESPRESSO = "#3D2411";
const gradient = "linear-gradient(135deg,#3D2411,#5C3A00)";
const SUBJECTS = ["Legal Reasoning", "English", "GK & Current Affairs", "Logical Reasoning", "Quantitative"];

type Phase = "setup" | "quiz" | "result";

export default function AiPracticePage({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("Legal Reasoning");
  const [difficulty, setDifficulty] = useState("medium");
  const [count, setCount] = useState(5);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [questions, setQuestions] = useState<PracticeMCQ[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const generate = async () => {
    if (busy || !topic.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await generatePracticeAction({ topic: topic.trim(), subject, difficulty, count });
      if (res.ok && res.questions && res.questions.length > 0) {
        setQuestions(res.questions);
        setAnswers({});
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
    setErr(null);
  };

  const score = questions.reduce((n, q, i) => n + (answers[i] === q.correct ? 1 : 0), 0);
  const answeredCount = Object.keys(answers).length;

  return (
    <div style={{ background: "#F7F3EA", minHeight: "100%", paddingBottom: 28 }}>
      <button onClick={phase === "setup" ? onBack : reset} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#2B1700", fontSize: 14, fontWeight: 700, padding: "14px 16px 0" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B1700" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        {phase === "setup" ? "AI Practice" : "New practice"}
      </button>

      {/* ── Setup ── */}
      {phase === "setup" && (
        <div style={{ padding: "14px 14px 0" }}>
          <div style={{ background: gradient, borderRadius: 20, padding: "18px", color: "#F7EFE2", boxShadow: "0 8px 24px rgba(61,36,17,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>✨</span>
              <p style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>AI Practice</p>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#D9C6A8" }}>Pick any topic and get an instant CLAT-style quiz with explanations.</p>
          </div>

          <div style={{ marginTop: 14, background: "white", borderRadius: 18, padding: "16px", boxShadow: "0 2px 14px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ display: "block" }}>
              <span style={labelCls}>Topic</span>
              <input value={topic} onChange={(e) => setTopic(e.target.value)} disabled={busy} placeholder="e.g. Article 21, Law of Torts, Parajumbles" style={fieldCls} />
            </label>
            <label style={{ display: "block" }}>
              <span style={labelCls}>Section</span>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} disabled={busy} style={fieldCls}>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <label style={{ flex: 1 }}>
                <span style={labelCls}>Difficulty</span>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} disabled={busy} style={fieldCls}>
                  <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                </select>
              </label>
              <label style={{ flex: 1 }}>
                <span style={labelCls}>Questions</span>
                <select value={count} onChange={(e) => setCount(Number(e.target.value))} disabled={busy} style={fieldCls}>
                  {[3, 5, 10].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            </div>
            <button onClick={generate} disabled={busy || !topic.trim()} style={{ background: gradient, color: "white", border: "none", borderRadius: 12, padding: "13px", fontSize: 14.5, fontWeight: 800, cursor: busy || !topic.trim() ? "default" : "pointer", opacity: busy || !topic.trim() ? 0.7 : 1 }}>
              {busy ? "Generating your quiz…" : "✨ Start practice"}
            </button>
            {err && <p style={{ margin: 0, fontSize: 12, color: "#B45309" }}>⚠️ {err}</p>}
            <p style={{ margin: 0, fontSize: 10.5, color: "#9CA3AF" }}>AI can make mistakes — treat this as practice, not a final source of truth.</p>
          </div>
        </div>
      )}

      {/* ── Quiz + Result share the question list ── */}
      {(phase === "quiz" || phase === "result") && (
        <div style={{ padding: "14px 14px 0" }}>
          {phase === "result" && (
            <div style={{ background: gradient, borderRadius: 20, padding: "18px", color: "white", textAlign: "center", boxShadow: "0 8px 24px rgba(61,36,17,0.3)", marginBottom: 14 }}>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>Your score</p>
              <p style={{ margin: "6px 0 0", fontSize: 40, fontWeight: 900 }}>{score}<span style={{ fontSize: 20, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>/{questions.length}</span></p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#F5C97A" }}>{Math.round((score / questions.length) * 100)}% · {topic}</p>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {questions.map((q, i) => {
              const chosen = answers[i];
              const showResult = phase === "result";
              return (
                <div key={i} style={{ background: "white", borderRadius: 16, padding: "14px 15px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: ESPRESSO, flexShrink: 0 }}>Q{i + 1}.</span>
                    <div>
                      {q.subject && <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>{q.subject}</span>}
                      <p style={{ margin: "2px 0 0", fontSize: 13.5, color: "#1A1A2E", lineHeight: 1.5 }}>{q.text}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {(["a", "b", "c", "d"] as const).map((opt) => {
                      const sel = chosen === opt;
                      const isCorrect = q.correct === opt;
                      let border = "#E5E7EB", bg = "white", col = "#374151";
                      if (showResult) {
                        if (isCorrect) { border = "#059669"; bg = "#DCFCE7"; col = "#15803D"; }
                        else if (sel) { border = "#DC2626"; bg = "#FEF2F2"; col = "#DC2626"; }
                      } else if (sel) { border = ESPRESSO; bg = "#F6ECD9"; }
                      return (
                        <button
                          key={opt}
                          onClick={() => { if (phase === "quiz") setAnswers((a) => ({ ...a, [i]: opt })); }}
                          disabled={showResult}
                          style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "left", border: `1.5px solid ${border}`, background: bg, borderRadius: 12, padding: "10px 12px", cursor: showResult ? "default" : "pointer", fontSize: 13, color: col, fontWeight: (showResult && (isCorrect || sel)) ? 700 : 400 }}
                        >
                          <span style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, border: `2px solid ${sel || (showResult && isCorrect) ? border : "#D1D5DB"}`, background: sel || (showResult && isCorrect) ? border : "white", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{opt.toUpperCase()}</span>
                          <span style={{ flex: 1 }}>{q[opt]}</span>
                          {showResult && isCorrect && <span style={{ fontSize: 11 }}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                  {showResult && q.explanation && (
                    <div style={{ marginTop: 10, background: "#FBF7EF", border: "1px solid #EFE2CC", borderRadius: 12, padding: "10px 12px", fontSize: 12.5, color: "#3A2A17", lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 800, color: "#6B4A28" }}>Why: </span>{q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {phase === "quiz" ? (
            <button onClick={() => setPhase("result")} style={{ marginTop: 14, width: "100%", background: gradient, color: "white", border: "none", borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
              Check answers{answeredCount < questions.length ? ` (${answeredCount}/${questions.length} answered)` : ""}
            </button>
          ) : (
            <button onClick={reset} style={{ marginTop: 14, width: "100%", background: "white", color: ESPRESSO, border: `1.5px solid ${ESPRESSO}`, borderRadius: 14, padding: "13px", fontSize: 14.5, fontWeight: 800, cursor: "pointer" }}>
              ✨ Practise another topic
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const labelCls = { display: "block", fontSize: 12, fontWeight: 700, color: "#6B7280", marginBottom: 5 } as const;
const fieldCls = { width: "100%", border: "1.5px solid #E1D3BC", borderRadius: 12, padding: "11px 12px", fontSize: 14, background: "white", color: "#231911", outlineColor: "#C8860A", boxSizing: "border-box" } as const;
