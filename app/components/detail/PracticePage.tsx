"use client";

import { useMemo, useState } from "react";
import type { StartResult } from "../../lib/test-actions";
import type { TestListItem } from "./TestPages";
import type { ContentItem } from "./ContentListPage";
import { AppIcon } from "../AppIcon";
import { ScreenHeader, SectionTitle, IconTile, EmptyState, Pill, card, page, primaryBtn } from "../ui/kit";

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
    <div style={page}>
      <ScreenHeader title="Practice Questions" onBack={onBack} />

      <div style={{ padding: "14px 16px 0" }}>
        <p style={{ margin: "0 2px 12px", fontSize: 12.5, color: "var(--ink-soft)" }}>
          {papers.length} practice {papers.length === 1 ? "paper" : "papers"}
          {papers.length > 0 && <> · <span style={{ color: "var(--success-text)", fontWeight: 700 }}>{attempted} attempted</span></>}
        </p>

        {err && (
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--error-text)", background: "var(--error)", borderRadius: 12, padding: "10px 12px" }}>{err}</p>
        )}

        {/* Subject filter */}
        {subjects.length > 2 && (
          <div style={{ display: "flex", gap: 7, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 12 }}>
            {subjects.map((s) => (
              <button key={s} onClick={() => setSubject(s)} style={{
                padding: "8px 14px", borderRadius: 20, fontSize: 12.5, fontWeight: 700,
                cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                border: `1px solid ${subject === s ? "var(--blue)" : "var(--line)"}`,
                background: subject === s ? "var(--blue)" : "white",
                color: subject === s ? "white" : "var(--ink-soft)",
              }}>{s}</button>
            ))}
          </div>
        )}

        {/* ── Practice papers ── */}
        {papers.length === 0 ? (
          <EmptyState icon="clipboard" title="No practice papers yet" text="Practice papers published for your batch will appear here." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {shown.map((p) => {
              const pct = p.bestScore !== null && p.bestTotal ? Math.round((p.bestScore / p.bestTotal) * 100) : null;
              return (
                <div key={p.id} style={{ ...card, padding: "15px 16px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <IconTile icon="clipboard" tone="purple" size={42} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {(p.subject || pct !== null) && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, flexWrap: "wrap" }}>
                          {p.subject && <Pill tone="blue">{p.subject}</Pill>}
                          {pct !== null && <Pill tone="green">Best {pct}%</Pill>}
                        </div>
                      )}
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>{p.title}</p>
                      {p.description && (
                        <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>{p.description}</p>
                      )}
                      <p style={{ margin: "6px 0 0", fontSize: 11.5, color: "var(--ink-mute)" }}>
                        {p.questionCount} questions · {p.durationMin > 0 ? `${p.durationMin} min` : "untimed"}
                        {p.myAttempts > 0 ? ` · ${p.myAttempts} attempt${p.myAttempts > 1 ? "s" : ""}` : ""}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => start(p.id)} disabled={busy === p.id} style={{
                    ...primaryBtn, width: "100%", marginTop: 12,
                    cursor: busy === p.id ? "default" : "pointer", opacity: busy === p.id ? 0.7 : 1,
                  }}>
                    {busy === p.id ? "Loading…" : <>{p.myAttempts > 0 ? "Practise again" : "Start practice"} <AppIcon name="arrowRight" size={16} color="white" /></>}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── AI practice ── */}
        {onGenerate && (
          <button onClick={onGenerate} style={{
            ...card, width: "100%", marginTop: 12, border: "1.5px dashed var(--blue)",
            padding: "14px", cursor: "pointer", display: "flex",
            alignItems: "center", gap: 12, textAlign: "left",
          }}>
            <IconTile icon="sparkle" solid size={42} />
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>Generate your own practice set</span>
              <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-soft)", marginTop: 2 }}>Pick any topic and difficulty — AI writes the questions.</span>
            </span>
            <AppIcon name="chevronRight" size={18} color="var(--blue)" />
          </button>
        )}

        {/* ── Downloadable practice material ── */}
        {material.length > 0 && (
          <>
            <div style={{ margin: "14px 0 10px" }}>
              <SectionTitle title={`Practice material (${material.length})`} />
            </div>
            <button onClick={onOpenMaterial} style={{
              ...card, width: "100%", padding: "14px 15px", cursor: "pointer", textAlign: "left",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <IconTile icon="file" tone="teal" size={42} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>Worksheets &amp; PDFs</p>
                  <p style={{ margin: "3px 0 0", fontSize: 11.5, color: "var(--ink-soft)", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {material.map((m) => m.title).join(" · ")}
                  </p>
                </div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 13, fontWeight: 800, color: "var(--blue)", flexShrink: 0 }}>Open <AppIcon name="arrowRight" size={14} /></span>
              </div>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
