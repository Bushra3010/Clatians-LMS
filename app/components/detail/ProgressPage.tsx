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
  practice: { sessions: number; questions: number; accuracy: number | null };
};

const barColor = (p: number) => (p < 40 ? "#DC2626" : p < 70 ? "#D97706" : "#059669");

// AI study coach — turns the student's test data into a personalised plan.
// Always shown; when there's no test data yet it explains how to unlock it.
function AiStudyPlan({ hasData }: { hasData: boolean }) {
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

        {!hasData ? (
          <div style={{ marginTop: 12, background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 14px", fontSize: 12.5, lineHeight: 1.5, color: "rgba(255,255,255,0.85)" }}>
            📝 Take at least one mock test to unlock your personalised study plan. Once you&apos;ve submitted a test, come back here and I&apos;ll analyse your weak areas.
          </div>
        ) : plan ? (
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

const escHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

export default function ProgressPage({ onBack, progress, student }: { onBack: () => void; progress: StudentProgress; student: { name: string; batch: string; attendancePct: number | null } }) {
  const overall = progress.contentTotal > 0 ? Math.round((progress.contentDone / progress.contentTotal) * 100) : 0;

  const downloadReport = () => {
    const w = window.open("", "_blank", "width=820,height=1000");
    if (!w) { alert("Please allow pop-ups to download your report."); return; }
    const generated = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    const stat = (label: string, value: string) => `<div class="stat"><div class="sv">${escHtml(value)}</div><div class="sl">${escHtml(label)}</div></div>`;
    const subjectRows = progress.subjects.length
      ? progress.subjects.map((s) => `<tr><td>${escHtml(s.subject)}</td><td>${s.correct}/${s.total}</td><td class="pct" style="color:${s.pct < 40 ? "#DC2626" : s.pct < 70 ? "#D97706" : "#059669"}">${s.pct}%</td></tr>`).join("")
      : `<tr><td colspan="3" style="color:#9A8A73">Attempt a test to see subject-wise accuracy.</td></tr>`;

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Progress Report — ${escHtml(student.name)}</title>
<style>
  *{box-sizing:border-box} body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#231911;margin:0;padding:40px;background:#fff}
  .wrap{max-width:680px;margin:0 auto}
  .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #3D2411;padding-bottom:16px}
  .brand{font-size:22px;font-weight:800;color:#3D2411}
  .brand span{font-size:12px;font-weight:500;color:#8A6A45;display:block;margin-top:2px}
  .doc{text-align:right;font-size:12px;color:#6B5842}
  .doc b{display:block;font-size:15px;color:#231911}
  .who{margin:20px 0}
  .who .n{font-size:18px;font-weight:800}
  .who .b{font-size:12.5px;color:#6B5842;margin-top:2px}
  h2{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#9A8A73;margin:26px 0 10px}
  .stats{display:flex;gap:12px}
  .stat{flex:1;border:1px solid #E7DCC9;border-radius:10px;padding:12px;text-align:center}
  .sv{font-size:22px;font-weight:800;color:#3D2411}
  .sl{font-size:11px;color:#8A6A45;margin-top:3px}
  table{width:100%;border-collapse:collapse}
  th{text-align:left;font-size:11px;text-transform:uppercase;color:#9A8A73;border-bottom:1px solid #E7DCC9;padding:8px 6px}
  td{padding:10px 6px;border-bottom:1px solid #F0EADD;font-size:13.5px}
  td.pct{text-align:right;font-weight:800} th:last-child{text-align:right}
  .foot{margin-top:34px;font-size:11px;color:#9A8A73;border-top:1px solid #E7DCC9;padding-top:14px}
  @media print{body{padding:0}}
</style></head><body><div class="wrap">
  <div class="head">
    <div><div class="brand">⚖️ CLATians LMS<span>CLAT Coaching &amp; Test Prep</span></div></div>
    <div class="doc">PROGRESS REPORT<b>${escHtml(generated)}</b></div>
  </div>
  <div class="who">
    <div class="n">${escHtml(student.name)}</div>
    <div class="b">${escHtml(student.batch || "No batch")}</div>
  </div>

  <h2>Overview</h2>
  <div class="stats">
    ${stat("Course completion", overall + "%")}
    ${stat("Attendance", student.attendancePct == null ? "—" : student.attendancePct + "%")}
    ${stat("Tests taken", String(progress.testsTaken))}
  </div>

  <h2>Test performance</h2>
  <div class="stats">
    ${stat("Average", progress.testAvgPct == null ? "—" : progress.testAvgPct + "%")}
    ${stat("Best", progress.testBestPct == null ? "—" : progress.testBestPct + "%")}
    ${stat("AI practice", progress.practice.accuracy == null ? "—" : progress.practice.accuracy + "%")}
  </div>

  <h2>Subject accuracy</h2>
  <table><thead><tr><th>Section</th><th>Correct</th><th>Accuracy</th></tr></thead><tbody>${subjectRows}</tbody></table>

  <div class="foot">Computer-generated progress report from CLATians LMS. Figures reflect activity up to ${escHtml(generated)}.</div>
</div><script>window.onload=function(){setTimeout(function(){window.print()},150)}<\/script></body></html>`;
    w.document.write(html);
    w.document.close();
  };

  return (
    <div style={{ background: "#F7F3EA", minHeight: "100%", paddingBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 0" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#2B1700", fontSize: 14, fontWeight: 700 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B1700" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          My Progress
        </button>
        <button onClick={downloadReport} style={{ background: "#F6ECD9", color: "#6B4A28", border: "1px solid #E7D6BA", borderRadius: 10, padding: "8px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
          📄 Download report
        </button>
      </div>

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

      {/* AI practice activity */}
      {progress.practice.sessions > 0 && (
        <div style={{ padding: "18px 14px 0" }}>
          <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "#1A1A2E" }}>✨ AI Practice</h3>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { v: String(progress.practice.sessions), l: "Sessions" },
              { v: String(progress.practice.questions), l: "Questions" },
              { v: progress.practice.accuracy === null ? "—" : `${progress.practice.accuracy}%`, l: "Accuracy" },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, background: "white", borderRadius: 14, padding: "14px 10px", textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#3D2411" }}>{s.v}</p>
                <p style={{ margin: "2px 0 0", fontSize: 10.5, color: "#9CA3AF" }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* AI study coach — always visible; unlocks once there is test data */}
      <AiStudyPlan hasData={progress.subjects.length > 0} />
    </div>
  );
}
