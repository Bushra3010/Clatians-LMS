"use client";

import { useState } from "react";
import { aiCoachAction } from "../../lib/ai-actions";
import AiText from "../AiText";

export type StudentProgress = {
  contentTotal: number;
  contentDone: number;
  batches: { name: string; total: number; done: number }[];
  testsTaken: number;
  testAvgPct: number | null;
  testBestPct: number | null;
  subjects: { subject: string; correct: number; total: number; pct: number }[];
};

const barColor = (p: number) => (p < 40 ? "#DC2626" : p < 70 ? "#D97706" : "#059669");

// AI study coach — turns the student's test data into a personalised plan.
function AiStudyPlan() {
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await aiCoachAction();
      if (res.ok && res.text) setPlan(res.text);
      else setErr(res.error ?? "Couldn't build a plan right now.");
    } catch {
      setErr("Couldn't build a plan right now.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: "18px 14px 0" }}>
      <div style={{ background: "linear-gradient(135deg,#3D2411,#5C3A00)", borderRadius: 18, padding: "16px", color: "#F7EFE2", boxShadow: "0 6px 20px rgba(61,36,17,0.28)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>✨</span>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>AI Study Coach</p>
        </div>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.78)" }}>
          A personalised plan based on your mock-test performance.
        </p>

        {plan ? (
          <div style={{ marginTop: 12, background: "#FBF7EF", color: "#2E2013", borderRadius: 12, padding: "12px 14px", fontSize: 12.5, lineHeight: 1.55 }}>
            <AiText text={plan} />
            <button onClick={run} disabled={busy} style={{ marginTop: 8, background: "none", border: "none", color: "#8A5A08", fontSize: 11.5, fontWeight: 800, cursor: busy ? "default" : "pointer", padding: 0 }}>
              {busy ? "Refreshing…" : "↻ Regenerate"}
            </button>
          </div>
        ) : (
          <button onClick={run} disabled={busy} style={{ marginTop: 12, width: "100%", background: "#F5A623", color: "#3D2411", border: "none", borderRadius: 12, padding: "12px", fontSize: 13.5, fontWeight: 800, cursor: busy ? "default" : "pointer", opacity: busy ? 0.8 : 1 }}>
            {busy ? "Analysing your results…" : "✨ Get my study plan"}
          </button>
        )}
        {err && <p style={{ margin: "10px 0 0", fontSize: 11.5, color: "#FCD9A6" }}>⚠️ {err}</p>}
      </div>
    </div>
  );
}

export default function ProgressPage({ onBack, progress }: { onBack: () => void; progress: StudentProgress }) {
  const overall = progress.contentTotal > 0 ? Math.round((progress.contentDone / progress.contentTotal) * 100) : 0;

  return (
    <div style={{ background: "#F7F3EA", minHeight: "100%", paddingBottom: 24 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#2B1700", fontSize: 14, fontWeight: 700, padding: "14px 16px 0" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B1700" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        My Progress
      </button>

      {/* Overall completion */}
      <div style={{ padding: "14px 14px 0" }}>
        <div style={{ background: "linear-gradient(135deg,#3D2411,#5C3A00)", borderRadius: 20, padding: "20px", color: "white", boxShadow: "0 8px 24px rgba(61,36,17,0.3)" }}>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>Course completion</p>
          <p style={{ margin: "6px 0 10px", fontSize: 40, fontWeight: 900 }}>{overall}%</p>
          <div style={{ height: 8, borderRadius: 20, background: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${overall}%`, background: "#F5A623", borderRadius: 20 }} />
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 11.5, color: "rgba(255,255,255,0.7)" }}>{progress.contentDone} of {progress.contentTotal} study items completed</p>
        </div>
      </div>

      {/* Per-batch progress */}
      {progress.batches.length > 0 && (
        <div style={{ padding: "18px 14px 0" }}>
          <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "#1A1A2E" }}>By batch</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {progress.batches.map((b) => {
              const p = b.total > 0 ? Math.round((b.done / b.total) * 100) : 0;
              return (
                <div key={b.name} style={{ background: "white", borderRadius: 14, padding: "13px 14px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>{b.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#3D2411" }}>{b.done}/{b.total}</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 20, background: "#F3F4F6", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${p}%`, background: "linear-gradient(90deg,#3D2411,#8A5A08)", borderRadius: 20 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Test performance */}
      <div style={{ padding: "18px 14px 0" }}>
        <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "#1A1A2E" }}>Test performance</h3>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { v: String(progress.testsTaken), l: "Tests taken" },
            { v: progress.testAvgPct === null ? "—" : `${progress.testAvgPct}%`, l: "Average" },
            { v: progress.testBestPct === null ? "—" : `${progress.testBestPct}%`, l: "Best" },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, background: "white", borderRadius: 14, padding: "14px 10px", textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#3D2411" }}>{s.v}</p>
              <p style={{ margin: "2px 0 0", fontSize: 10.5, color: "#9CA3AF" }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Weak areas */}
      <div style={{ padding: "18px 14px 0" }}>
        <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "#1A1A2E" }}>Subject accuracy</h3>
        {progress.subjects.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: "#9CA3AF" }}>Attempt a test to see your subject-wise strengths and weak areas.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {progress.subjects.map((s) => (
              <div key={s.subject} style={{ background: "white", borderRadius: 14, padding: "13px 14px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>{s.subject}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: barColor(s.pct) }}>{s.pct}%</span>
                </div>
                <div style={{ height: 7, borderRadius: 20, background: "#F3F4F6", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${s.pct}%`, background: barColor(s.pct), borderRadius: 20 }} />
                </div>
                <p style={{ margin: "5px 0 0", fontSize: 10.5, color: "#9CA3AF" }}>{s.correct}/{s.total} correct</p>
              </div>
            ))}
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9CA3AF" }}>💡 Focus on the red/amber subjects to improve fastest.</p>
          </div>
        )}
      </div>

      {/* AI study coach — only once there is test data to analyse */}
      {progress.subjects.length > 0 && <AiStudyPlan />}
    </div>
  );
}
