"use client";

import { useState, useEffect, useRef } from "react";
import type { StartResult, SubmitResult, TakeQuestion, ReviewItem } from "../../lib/test-actions";
import { explainAnswerAction } from "../../lib/ai-actions";
import AiText from "../AiText";

export type TestListItem = {
  id: string;
  title: string;
  description: string;
  type: string;
  durationMin: number;
  questionCount: number;
  myAttempts: number;
  bestScore: number | null;
  bestTotal: number | null;
};

const gradient = "linear-gradient(135deg,#3D2411,#5C3A00)";
const typeLabel: Record<string, string> = { mock: "Full Mock", sectional: "Sectional", pyq: "Previous Year" };

const Back = ({ onBack, label }: { onBack: () => void; label: string }) => (
  <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#2B1700", fontSize: 14, fontWeight: 700, padding: "14px 16px 0" }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B1700" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
    {label}
  </button>
);

// ── Test list ──────────────────────────────────────────────
export function TestSeriesPage({ onBack, tests, onStart }: { onBack: () => void; tests: TestListItem[]; onStart: (id: string) => Promise<StartResult> }) {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const start = async (id: string) => { setErr(""); setBusy(id); const r = await onStart(id); if (!r.ok) setErr(r.error); setBusy(null); };

  return (
    <div style={{ background: "#F7F3EA", minHeight: "100%", paddingBottom: 24 }}>
      <Back onBack={onBack} label="Test Series" />
      <div style={{ padding: "16px 14px 0" }}>
        {err && <p style={{ margin: "0 0 12px", fontSize: 13, color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 12px" }}>{err}</p>}
        {tests.length === 0 && (
          <div style={{ background: "white", borderRadius: 18, padding: "28px 18px", textAlign: "center", boxShadow: "0 2px 14px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 34, marginBottom: 8 }}>📝</div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1A1A2E" }}>No tests yet</p>
            <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#9CA3AF" }}>Published mock tests for your batch will appear here.</p>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {tests.map((t) => (
            <div key={t.id} style={{ background: "white", borderRadius: 18, padding: "16px", boxShadow: "0 2px 14px rgba(0,0,0,0.07)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ background: "#F6ECD9", color: "#3D2411", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>{typeLabel[t.type] ?? t.type}</span>
                {t.bestScore !== null && <span style={{ background: "#DCFCE7", color: "#15803D", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>Best {t.bestScore}/{t.bestTotal}</span>}
              </div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1A1A2E" }}>{t.title}</p>
              <p style={{ margin: "3px 0 10px", fontSize: 12, color: "#6B7280" }}>{t.questionCount} questions · {t.durationMin} min{t.myAttempts > 0 ? ` · ${t.myAttempts} attempt${t.myAttempts > 1 ? "s" : ""}` : ""}</p>
              <button onClick={() => start(t.id)} disabled={busy === t.id} style={{ width: "100%", background: gradient, color: "white", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 800, cursor: busy === t.id ? "default" : "pointer", opacity: busy === t.id ? 0.7 : 1 }}>
                {busy === t.id ? "Loading…" : t.myAttempts > 0 ? "Re-attempt →" : "Start test →"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Taking a test ──────────────────────────────────────────
export function TestTakePage({ session, onSubmit, onExit }: { session: Extract<StartResult, { ok: true }>; onSubmit: (answers: Record<string, string>) => Promise<void>; onExit: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secs, setSecs] = useState(session.durationMin * 60);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  const doSubmit = async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    await onSubmit(answers);
  };

  useEffect(() => {
    const t = setInterval(() => setSecs((s) => {
      if (s <= 1) { clearInterval(t); doSubmit(); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const answered = Object.keys(answers).length;
  const low = secs <= 60;

  return (
    <div style={{ background: "#F7F3EA", minHeight: "100%", paddingBottom: 90 }}>
      {/* Sticky timer bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 5, background: "white", borderBottom: "1px solid #F0F0F5", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#1A1A2E" }}>{session.title}</p>
          <p style={{ margin: 0, fontSize: 11, color: "#9CA3AF" }}>{answered}/{session.questions.length} answered</p>
        </div>
        <div style={{ background: low ? "#FEF2F2" : "#F6ECD9", color: low ? "#DC2626" : "#3D2411", borderRadius: 10, padding: "6px 12px", fontSize: 15, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>⏱ {mm}:{ss}</div>
      </div>

      <div style={{ padding: "14px 14px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {session.questions.map((q, i) => (
          <div key={q.id} style={{ background: "white", borderRadius: 16, padding: "14px 15px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#3D2411", flexShrink: 0 }}>Q{i + 1}.</span>
              <div>
                {q.subject && <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>{q.subject}</span>}
                <p style={{ margin: "2px 0 0", fontSize: 13.5, color: "#1A1A2E", lineHeight: 1.5 }}>{q.text}</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {(["a", "b", "c", "d"] as const).map((opt) => {
                const sel = answers[q.id] === opt;
                return (
                  <button key={opt} onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))} style={{
                    display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                    border: `1.5px solid ${sel ? "#3D2411" : "#E5E7EB"}`, background: sel ? "#F6ECD9" : "white",
                    borderRadius: 12, padding: "10px 12px", cursor: "pointer", fontSize: 13, color: "#374151",
                  }}>
                    <span style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, border: `2px solid ${sel ? "#3D2411" : "#D1D5DB"}`, background: sel ? "#3D2411" : "white", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{opt.toUpperCase()}</span>
                    {q[opt]}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Submit bar */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 390, background: "white", padding: "12px 16px", boxShadow: "0 -4px 20px rgba(0,0,0,0.12)", display: "flex", gap: 10, zIndex: 6 }}>
        <button onClick={onExit} style={{ background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 14, padding: "14px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Exit</button>
        <button onClick={doSubmit} disabled={submitting} style={{ flex: 1, background: gradient, color: "white", border: "none", borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 800, cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.7 : 1 }}>
          {submitting ? "Submitting…" : "Submit Test"}
        </button>
      </div>
    </div>
  );
}

// One reviewed question, with an on-demand "Explain with AI" panel.
function ReviewCard({ r, index }: { r: ReviewItem; index: number }) {
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
    <div style={{ background: "white", borderRadius: 14, padding: "13px 14px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
      <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>Q{index + 1}. {r.text}</p>
      {(["a", "b", "c", "d"] as const).map((opt) => {
        const isCorrect = r.correct === opt;
        const isChosen = r.chosen === opt;
        const bg = isCorrect ? "#DCFCE7" : isChosen ? "#FEF2F2" : "transparent";
        const col = isCorrect ? "#15803D" : isChosen ? "#DC2626" : "#6B7280";
        return (
          <div key={opt} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, background: bg, fontSize: 12.5, color: col, fontWeight: isCorrect || isChosen ? 700 : 400 }}>
            <span style={{ fontWeight: 800 }}>{opt.toUpperCase()}.</span>
            <span style={{ flex: 1 }}>{optText(opt)}</span>
            {isCorrect && <span style={{ fontSize: 11 }}>✓ correct</span>}
            {isChosen && !isCorrect && <span style={{ fontSize: 11 }}>your answer</span>}
          </div>
        );
      })}
      {!r.chosen && <p style={{ margin: "6px 0 0", fontSize: 11, color: "#9CA3AF" }}>Not attempted</p>}

      {explanation ? (
        <div style={{ marginTop: 10, background: "#FBF7EF", border: "1px solid #EFE2CC", borderRadius: 12, padding: "10px 12px", fontSize: 12.5, color: "#3A2A17", lineHeight: 1.55 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, fontWeight: 800, color: "#6B4A28", fontSize: 11.5 }}>✨ AI explanation</div>
          <AiText text={explanation} />
        </div>
      ) : (
        <button onClick={explain} disabled={busy} style={{ marginTop: 10, background: busy ? "#EDE3D3" : "#F6ECD9", color: "#6B4A28", border: "1px solid #E7D6BA", borderRadius: 10, padding: "8px 12px", fontSize: 12, fontWeight: 800, cursor: busy ? "default" : "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
          {busy ? "Thinking…" : "✨ Explain with AI"}
        </button>
      )}
      {err && <p style={{ margin: "8px 0 0", fontSize: 11.5, color: "#B45309" }}>⚠️ {err}</p>}
    </div>
  );
}

// ── Result + review ────────────────────────────────────────
export function TestResultPage({ title, result, onBack }: { title: string; result: Extract<SubmitResult, { ok: true }>; onBack: () => void }) {
  const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;

  return (
    <div style={{ background: "#F7F3EA", minHeight: "100%", paddingBottom: 24 }}>
      <Back onBack={onBack} label="Test Series" />

      <div style={{ padding: "14px 14px 0" }}>
        <div style={{ background: gradient, borderRadius: 20, padding: "20px", color: "white", textAlign: "center", boxShadow: "0 8px 24px rgba(61,36,17,0.3)" }}>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{title}</p>
          <p style={{ margin: "8px 0 0", fontSize: 40, fontWeight: 900 }}>{result.score}<span style={{ fontSize: 20, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>/{result.total}</span></p>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 14 }}>
            {[
              { v: "AIR " + result.rank, l: "All-India Rank" },
              { v: result.percentile + "%ile", l: "Percentile" },
              { v: pct + "%", l: "Score" },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color: "#F5A623" }}>{s.v}</p>
                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.7)" }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
          {[
            { v: result.correct, l: "Correct", c: "#059669", bg: "#DCFCE7" },
            { v: result.wrong, l: "Wrong", c: "#DC2626", bg: "#FEF2F2" },
            { v: result.unattempted, l: "Skipped", c: "#6B7280", bg: "#F3F4F6" },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, background: s.bg, borderRadius: 12, padding: "10px", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: s.c }}>{s.v}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#6B7280" }}>{s.l}</p>
            </div>
          ))}
        </div>
        <p style={{ margin: "0 0 8px", fontSize: 11, color: "#9CA3AF", textAlign: "center" }}>{result.takers} student{result.takers > 1 ? "s" : ""} have taken this test</p>

        <h3 style={{ margin: "12px 0", fontSize: 15, fontWeight: 800, color: "#1A1A2E" }}>Review answers</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {result.review.map((r, i) => (
            <ReviewCard key={r.id} r={r} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export type { TakeQuestion };
