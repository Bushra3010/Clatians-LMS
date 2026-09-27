"use client";

import { useMemo, useState } from "react";
import type { StartResult } from "../../lib/test-actions";
import type { TestListItem } from "./TestPages";
import type { ContentItem } from "./ContentListPage";

const gradient = "linear-gradient(135deg,var(--blue-dark),var(--blue))";

/**
 * Practice Questions.
 *
 * Two kinds of practice sit here, because both are things a student "practises":
 *  - Practice papers — real question sets that run on the test engine, untimed
 *    by default, with the author's written solution shown in review.
 *  - Practice material — PDFs and worksheets uploaded as content, which the
 *    student opens and marks done.
 */
export default function PracticePage({
  onBack,
  papers,
  material,
  onStart,
  onOpenMaterial,
  onGenerate,
}: {
  onBack: () => void;
  papers: TestListItem[];
  material: ContentItem[];
  onStart: (id: string) => Promise<StartResult>;
  onOpenMaterial: () => void;
  onGenerate?: () => void;
}) {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [subject, setSubject] = useState("All");

  const start = async (id: string) => {
    setErr("");
    setBusy(id);
    const r = await onStart(id);
    if (!r.ok) setErr(r.error);
    setBusy(null);
  };

  // Practice papers are named per subject; the tag comes from the paper itself.
  const subjects = useMemo(() => {
    const seen = new Set<string>();
    for (const p of papers) if (p.subject) seen.add(p.subject);
    return ["All", ...[...seen].sort()];
  }, [papers]);

  const shown = subject === "All" ? papers : papers.filter((p) => p.subject === subject);

  const attempted = papers.filter((p) => p.myAttempts > 0).length;

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%", paddingBottom: 28 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "var(--ink-primary)", fontSize: 14, fontWeight: 700, padding: "14px 16px 0" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-primary)" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        Practice Questions
      </button>

      <div style={{ padding: "12px 14px 0" }}>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-muted)" }}>
          {papers.length} practice {papers.length === 1 ? "paper" : "papers"}
          {papers.length > 0 && <> · <span style={{ color: "var(--green)", fontWeight: 700 }}>{attempted} attempted</span></>}
        </p>

        {err && (
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--error-text)", background: "var(--error)", border: "1px solid var(--success-border)", borderRadius: 10, padding: "10px 12px" }}>{err}</p>
        )}

        {/* Subject filter */}
        {subjects.length > 2 && (
          <div style={{ display: "flex", gap: 7, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 12 }}>
            {subjects.map((s) => (
              <button key={s} onClick={() => setSubject(s)} style={{
                padding: "8px 13px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                border: "none", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                background: subject === s ? "var(--blue)" : "var(--bg-secondary)",
                color: subject === s ? "white" : "var(--text-secondary)",
              }}>{s}</button>
            ))}
          </div>
        )}

        {/* ── Practice papers ── */}
        {papers.length === 0 ? (
          <div style={{ background: "white", borderRadius: 18, padding: "28px 18px", textAlign: "center", boxShadow: "0 2px 14px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 34, marginBottom: 8 }}>📝</div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--ink-primary)" }}>No practice papers yet</p>
            <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--text-disabled)" }}>
              Practice papers published for your batch will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {shown.map((p) => {
              const pct = p.bestScore !== null && p.bestTotal ? Math.round((p.bestScore / p.bestTotal) * 100) : null;
              return (
                <div key={p.id} style={{ background: "white", borderRadius: 16, padding: "16px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                    {p.subject && (
                      <span style={{ background: "var(--info-border)", color: "var(--blue)", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>{p.subject}</span>
                    )}
                    {pct !== null && (
                      <span style={{ background: "var(--success)", color: "var(--success-text)", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>Best {pct}%</span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--ink-primary)" }}>{p.title}</p>
                  {p.description && (
                    <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5 }}>{p.description}</p>
                  )}
                  <p style={{ margin: "6px 0 10px", fontSize: 12, color: "var(--text-disabled)" }}>
                    {p.questionCount} questions · {p.durationMin > 0 ? `${p.durationMin} min` : "untimed"}
                    {p.myAttempts > 0 ? ` · ${p.myAttempts} attempt${p.myAttempts > 1 ? "s" : ""}` : ""}
                  </p>
                  <button onClick={() => start(p.id)} disabled={busy === p.id} style={{
                    width: "100%", background: gradient, color: "white", border: "none", borderRadius: 12,
                    padding: "12px", fontSize: 14, fontWeight: 800,
                    cursor: busy === p.id ? "default" : "pointer", opacity: busy === p.id ? 0.7 : 1,
                  }}>
                    {busy === p.id ? "Loading…" : p.myAttempts > 0 ? "Practise again →" : "Start practice →"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── AI practice ── */}
        {onGenerate && (
          <button onClick={onGenerate} style={{
            width: "100%", marginTop: 12, background: "white", border: "1px dashed var(--blue)",
            borderRadius: 16, padding: "14px", cursor: "pointer", display: "flex",
            alignItems: "center", gap: 12, textAlign: "left",
          }}>
            <span style={{ fontSize: 22 }}>⚡</span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--ink-primary)" }}>Generate your own practice set</span>
              <span style={{ display: "block", fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>Pick any topic and difficulty — AI writes the questions.</span>
            </span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--blue)" }}>→</span>
          </button>
        )}

        {/* ── Downloadable practice material ── */}
        {material.length > 0 && (
          <>
            <h3 style={{ margin: "22px 0 10px", fontSize: 14, fontWeight: 800, color: "var(--ink-primary)" }}>
              Practice material ({material.length})
            </h3>
            <button onClick={onOpenMaterial} style={{
              width: "100%", background: "white", border: "1px solid var(--gold-100)", borderRadius: 16,
              padding: "14px 15px", cursor: "pointer", textAlign: "left", boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>📄</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: "var(--ink-primary)" }}>Worksheets &amp; PDFs</p>
                  <p style={{ margin: "3px 0 0", fontSize: 11.5, color: "var(--text-muted)", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {material.map((m) => m.title).join(" · ")}
                  </p>
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--blue)", flexShrink: 0 }}>Open →</span>
              </div>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
