"use client";

import { useState } from "react";
import { aiCoachAction } from "../../lib/ai-actions";
import AiText from "../AiText";
import { AppIcon } from "../AppIcon";
import { card, gradient, goldBtn, smallBtn, page, body, ScreenHeader, SectionTitle, IconTile, EmptyState } from "../ui/kit";

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

const barColor = (p: number) => (p < 40 ? "var(--error-text)" : p < 70 ? "var(--warning-text)" : "var(--green)");

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
    <div style={{ background: gradient, borderRadius: 18, padding: "16px", color: "white", boxShadow: "0 8px 22px rgba(11,92,255,0.22)", marginTop: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <AppIcon name="bolt" size={18} color="var(--gold)" />
        </span>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>AI Study Coach</p>
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 12, color: "rgba(255,255,255,0.78)" }}>
        A personalised plan based on your mock-test performance.
      </p>

      {!hasData ? (
        <div style={{ marginTop: 12, background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px", fontSize: 12.5, lineHeight: 1.5, color: "rgba(255,255,255,0.88)", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <AppIcon name="pen" size={16} color="white" style={{ marginTop: 2 }} />
          <span>Take at least one mock test to unlock your personalised study plan. Once you&apos;ve submitted a test, come back here and I&apos;ll analyse your weak areas.</span>
        </div>
      ) : plan ? (
        <div style={{ marginTop: 12, background: "white", color: "var(--ink)", borderRadius: 12, padding: "12px 14px", fontSize: 12.5, lineHeight: 1.55 }}>
          <AiText text={plan} />
          <button onClick={run} disabled={busy} style={{ marginTop: 8, background: "none", border: "none", color: "var(--blue)", fontSize: 12, fontWeight: 800, cursor: busy ? "default" : "pointer", padding: 0, display: "inline-flex", alignItems: "center", gap: 5 }}>
            {!busy && <AppIcon name="refresh" size={14} color="var(--blue)" strokeWidth={2.4} />}
            {busy ? "Refreshing…" : "Regenerate"}
          </button>
        </div>
      ) : (
        <button onClick={run} disabled={busy} style={{ ...goldBtn, marginTop: 12, width: "100%", cursor: busy ? "default" : "pointer", opacity: busy ? 0.8 : 1 }}>
          {!busy && <AppIcon name="bolt" size={16} color="var(--ink)" strokeWidth={2.4} />}
          {busy ? "Analysing your results…" : "Get my study plan"}
        </button>
      )}
      {err && (
        <p style={{ margin: "10px 0 0", fontSize: 11.5, color: "var(--gold-tint)", display: "flex", alignItems: "center", gap: 6 }}>
          <AppIcon name="alert" size={14} color="var(--gold)" />
          {err}
        </p>
      )}
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
      ? progress.subjects.map((s) => `<tr><td>${escHtml(s.subject)}</td><td>${s.correct}/${s.total}</td><td class="pct" style="color:${s.pct < 40 ? "var(--error-text)" : s.pct < 70 ? "var(--warning-text)" : "var(--green)"}">${s.pct}%</td></tr>`).join("")
      : `<tr><td colspan="3" style="color:#98a1b5">Attempt a test to see subject-wise accuracy.</td></tr>`;

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Progress Report — ${escHtml(student.name)}</title>
<style>
  *{box-sizing:border-box} body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1A1A2E;margin:0;padding:40px;background:#fff}
  .wrap{max-width:680px;margin:0 auto}
  .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid var(--blue-dark);padding-bottom:16px}
  .brand{font-size:22px;font-weight:800;color:var(--blue-dark)}
  .brand span{font-size:12px;font-weight:500;color:var(--blue-dark);display:block;margin-top:2px}
  .doc{text-align:right;font-size:12px;color:#5B7299}
  .doc b{display:block;font-size:15px;color:#1A1A2E}
  .who{margin:20px 0}
  .who .n{font-size:18px;font-weight:800}
  .who .b{font-size:12.5px;color:#5B7299;margin-top:2px}
  h2{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin:26px 0 10px}
  .stats{display:flex;gap:12px}
  .stat{flex:1;border:1px solid var(--info-border);border-radius:10px;padding:12px;text-align:center}
  .sv{font-size:22px;font-weight:800;color:var(--blue-dark)}
  .sl{font-size:11px;color:var(--blue-dark);margin-top:3px}
  table{width:100%;border-collapse:collapse}
  th{text-align:left;font-size:11px;text-transform:uppercase;color:var(--text-muted);border-bottom:1px solid var(--info-border);padding:8px 6px}
  td{padding:10px 6px;border-bottom:1px solid var(--surface-dim);font-size:13.5px}
  td.pct{text-align:right;font-weight:800} th:last-child{text-align:right}
  .foot{margin-top:34px;font-size:11px;color:var(--text-muted);border-top:1px solid var(--info-border);padding-top:14px}
  @media print{body{padding:0}}
</style></head><body><div class="wrap">
  <div class="head">
    <div><div class="brand">CLATians LMS<span>CLAT Coaching &amp; Test Prep</span></div></div>
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

  const stats = (items: { v: string; l: string }[]) => (
    <div style={{ display: "flex", gap: 8 }}>
      {items.map((s, i) => (
        <div key={i} style={{ ...card, flex: 1, padding: "14px 10px", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "var(--blue)" }}>{s.v}</p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--ink-soft)" }}>{s.l}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div style={page}>
      <ScreenHeader title="My Progress" onBack={onBack} right={
        <button onClick={downloadReport} style={smallBtn}>
          <AppIcon name="download" size={15} color="var(--blue)" strokeWidth={2.4} />
          Download report
        </button>
      } />

      <div style={body}>
        {/* Overall completion */}
        <div style={{ background: gradient, borderRadius: 20, padding: "20px", color: "white", boxShadow: "0 8px 22px rgba(11,92,255,0.22)" }}>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>Course completion</p>
          <p style={{ margin: "6px 0 10px", fontSize: 40, fontWeight: 900 }}>{overall}%</p>
          <div style={{ height: 8, borderRadius: 20, background: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${overall}%`, background: "var(--gold)", borderRadius: 20 }} />
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 11.5, color: "rgba(255,255,255,0.7)" }}>{progress.contentDone} of {progress.contentTotal} study items completed</p>
        </div>

        {/* Per-batch progress */}
        {progress.batches.length > 0 && (
          <>
            <SectionTitle title="By batch" />
            {progress.batches.map((b) => {
              const p = b.total > 0 ? Math.round((b.done / b.total) * 100) : 0;
              return (
                <div key={b.name} style={{ ...card, padding: "13px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{b.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--blue)" }}>{b.done}/{b.total}</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 20, background: "var(--blue-tint)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${p}%`, background: gradient, borderRadius: 20 }} />
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Test performance */}
        <SectionTitle title="Test performance" />
        {stats([
          { v: String(progress.testsTaken), l: "Tests taken" },
          { v: progress.testAvgPct === null ? "—" : `${progress.testAvgPct}%`, l: "Average" },
          { v: progress.testBestPct === null ? "—" : `${progress.testBestPct}%`, l: "Best" },
        ])}

        {/* AI practice activity */}
        {progress.practice.sessions > 0 && (
          <>
            <SectionTitle title="AI Practice" right={<IconTile icon="bolt" tone="gold" size={30} />} />
            {stats([
              { v: String(progress.practice.sessions), l: "Sessions" },
              { v: String(progress.practice.questions), l: "Questions" },
              { v: progress.practice.accuracy === null ? "—" : `${progress.practice.accuracy}%`, l: "Accuracy" },
            ])}
          </>
        )}

        {/* Weak areas */}
        <SectionTitle title="Subject accuracy" />
        {progress.subjects.length === 0 ? (
          <EmptyState icon="chart" title="Subject accuracy" text="Attempt a test to see your subject-wise strengths and weak areas." />
        ) : (
          <>
            {progress.subjects.map((s) => (
              <div key={s.subject} style={{ ...card, padding: "13px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{s.subject}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: barColor(s.pct) }}>{s.pct}%</span>
                </div>
                <div style={{ height: 7, borderRadius: 20, background: "var(--surface-dim)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${s.pct}%`, background: barColor(s.pct), borderRadius: 20 }} />
                </div>
                <p style={{ margin: "5px 0 0", fontSize: 11, color: "var(--ink-soft)" }}>{s.correct}/{s.total} correct</p>
              </div>
            ))}
            <p style={{ margin: "0 2px", fontSize: 11.5, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 6 }}>
              <AppIcon name="bulb" size={14} color="var(--gold-dark)" />
              Focus on the red/amber subjects to improve fastest.
            </p>
          </>
        )}

      {/* AI study coach — always visible; unlocks once there is test data */}
        <AiStudyPlan hasData={progress.subjects.length > 0} />
      </div>
    </div>
  );
}
