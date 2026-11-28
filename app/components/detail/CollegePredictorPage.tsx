"use client";

import { useState } from "react";
import { CATEGORIES, type Category } from "../../lib/clat-data";
import type { NLUItem } from "../../lib/resource-types";
import { AppIcon } from "../AppIcon";
import { ScreenHeader, card, page, goldBtn, heroSurface, Pill } from "../ui/kit";

type Result = { name: string; city: string; close: number; tag: "Safe" | "Borderline" };

/**
 * NLU College Predictor — the student's expected CLAT rank and category
 * against recent closing ranks. Within 80% of a closing rank is "Safe".
 */
export default function CollegePredictorPage({ onBack, nlus }: { onBack: () => void; nlus: NLUItem[] }) {
  const [rank, setRank] = useState("");
  const [cat, setCat] = useState<Category>("general");
  const [result, setResult] = useState<Result[] | null>(null);

  const predict = () => {
    const r = parseInt(rank, 10);
    if (!r || r < 1) { setResult([]); return; }
    setResult(
      nlus.filter((n) => n.closing[cat] > 0 && r <= n.closing[cat])
        .sort((a, b) => a.closing[cat] - b.closing[cat])
        .map((n) => ({ name: n.name, city: n.city, close: n.closing[cat], tag: r <= n.closing[cat] * 0.8 ? "Safe" : "Borderline" })),
    );
  };
  const safe = result?.filter((x) => x.tag === "Safe").length ?? 0;

  return (
    <div style={page}>
      <ScreenHeader title="College Predictor" onBack={onBack} />
      <div style={{ padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ ...heroSurface, padding: 18, color: "white" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 48, height: 48, borderRadius: 14, background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <AppIcon name="graduation" size={24} color="var(--blue-dark)" />
            </span>
            <span>
              <span style={{ display: "block", fontSize: 17, fontWeight: 800 }}>Which NLU can you get?</span>
              <span style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.72)", marginTop: 2 }}>Based on recent closing ranks</span>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", borderRadius: 14, padding: "4px 4px 4px 14px", marginTop: 16 }}>
            <AppIcon name="trophy" size={16} color="var(--blue)" />
            <input value={rank} onChange={(e) => setRank(e.target.value.replace(/[^0-9]/g, ""))} onKeyDown={(e) => { if (e.key === "Enter") predict(); }}
              inputMode="numeric" placeholder="Your expected CLAT rank" style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: 15, padding: "11px 0", color: "var(--ink)" }} />
          </div>

          <div className="no-scroll" style={{ display: "flex", gap: 6, overflowX: "auto", marginTop: 10 }}>
            {CATEGORIES.map((c) => {
              const on = c.value === cat;
              return (
                <button key={c.value} onClick={() => setCat(c.value)} style={{ flexShrink: 0, border: on ? "none" : "1px solid rgba(255,255,255,0.25)", borderRadius: 20, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 800, background: on ? "var(--gold)" : "rgba(255,255,255,0.08)", color: on ? "var(--blue-dark)" : "white" }}>{c.label}</button>
              );
            })}
          </div>

          <button onClick={predict} className="press" style={{ ...goldBtn, width: "100%", marginTop: 14, color: "var(--blue-dark)" }}>
            Predict my colleges <AppIcon name="arrowRight" size={16} strokeWidth={2.4} />
          </button>
        </div>

        {result !== null && (result.length === 0 ? (
          <div style={{ ...card, padding: "24px 18px", textAlign: "center" }}>
            <AppIcon name="target" size={28} color="var(--ink-mute)" />
            <p style={{ margin: "8px 0 0", fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>{rank ? "Aim a little higher" : "Enter your rank first"}</p>
            {rank && <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--ink-soft)" }}>This rank is beyond the listed NLU cut-offs for your category.</p>}
          </div>
        ) : (
          <>
            <div style={{ ...card, padding: "12px 6px", display: "flex" }}>
              {[{ v: result.length, l: "NLUs in reach" }, { v: safe, l: "Safe" }, { v: result.length - safe, l: "Borderline" }].map((x, i) => (
                <div key={x.l} style={{ flex: 1, textAlign: "center", borderLeft: i ? "1px solid var(--line)" : "none" }}>
                  <p style={{ margin: 0, fontSize: 19, fontWeight: 900, color: "var(--blue)" }}>{x.v}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--ink-soft)" }}>{x.l}</p>
                </div>
              ))}
            </div>
            <div style={{ ...card, overflow: "hidden" }}>
              {result.map((n, i) => (
                <div key={n.name} style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, borderTop: i ? "1px solid var(--line)" : "none" }}>
                  <span style={{ width: 28, height: 28, borderRadius: 9, flexShrink: 0, background: "var(--app-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "var(--ink-soft)" }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>{n.name}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--ink-mute)" }}>{n.city} · closes ~{n.close.toLocaleString("en-IN")}</p>
                  </div>
                  <Pill tone={n.tag === "Safe" ? "green" : "gold"}>{n.tag}</Pill>
                </div>
              ))}
            </div>
            <p style={{ margin: "-4px 2px 0", fontSize: 11, color: "var(--ink-mute)" }}>Indicative only — cut-offs change every year.</p>
          </>
        ))}
      </div>
    </div>
  );
}
