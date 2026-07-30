"use client";

import { useState } from "react";
import { CATEGORIES, type Category } from "../../lib/clat-data";
import type { VocabItem, CAItem, NLUItem } from "../../lib/resource-types";
import { generateVocabAction } from "../../lib/ai-actions";

const gradient = "linear-gradient(135deg,#3D2411,#5C3A00)";
const input: React.CSSProperties = { width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 12, background: "#F9FAFB", padding: "12px 14px", fontSize: 15, outline: "none", color: "#1A1A2E" };

type Tab = "predictor" | "quiz" | "vocab";

export default function ClatToolsPage({ onBack, vocab, caq, nlus, savedVocabKeys, onToggleSave }: { onBack: () => void; vocab: VocabItem[]; caq: CAItem[]; nlus: NLUItem[]; savedVocabKeys: string[]; onToggleSave: (word: string, meaning: string) => void }) {
  const [tab, setTab] = useState<Tab>("predictor");

  return (
    <div style={{ background: "#F7F3EA", minHeight: "100%", paddingBottom: 24 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#2B1700", fontSize: 14, fontWeight: 700, padding: "14px 16px 0" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B1700" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        CLAT Tools
      </button>

      <div style={{ padding: "14px 14px 0" }}>
        <div style={{ display: "flex", gap: 6, background: "white", padding: 5, borderRadius: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
          {([["predictor", "🎓 Predictor"], ["quiz", "🗞 CA Quiz"], ["vocab", "📖 Vocab"]] as const).map(([id, l]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, padding: "9px 4px", borderRadius: 10, fontSize: 12, fontWeight: 800, border: "none", cursor: "pointer",
              background: tab === id ? "#3D2411" : "transparent", color: tab === id ? "white" : "#6B7280",
            }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 14px 0" }}>
        {tab === "predictor" && <Predictor nlus={nlus} />}
        {tab === "quiz" && <Quiz caq={caq} />}
        {tab === "vocab" && <VocabCards vocab={vocab} savedWords={savedVocabKeys} onToggleSave={onToggleSave} />}
      </div>
    </div>
  );
}

// ── NLU College Predictor ──────────────────────────────────
function Predictor({ nlus }: { nlus: NLUItem[] }) {
  const [rank, setRank] = useState("");
  const [cat, setCat] = useState<Category>("general");
  const [result, setResult] = useState<{ name: string; city: string; close: number; tag: string }[] | null>(null);

  const predict = () => {
    const r = parseInt(rank, 10);
    if (!r || r < 1) { setResult([]); return; }
    setResult(
      nlus.filter((n) => r <= n.closing[cat])
        .sort((a, b) => a.closing[cat] - b.closing[cat])
        .map((n) => ({ name: n.name, city: n.city, close: n.closing[cat], tag: r <= n.closing[cat] * 0.8 ? "Safe" : "Borderline" }))
    );
  };

  return (
    <div>
      <div style={{ background: "white", borderRadius: 18, padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800, color: "#1A1A2E" }}>NLU College Predictor</p>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Your expected CLAT rank</label>
        <input value={rank} onChange={(e) => setRank(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="e.g. 850" style={{ ...input, marginBottom: 12 }} />
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Category</label>
        <select value={cat} onChange={(e) => setCat(e.target.value as Category)} style={{ ...input, marginBottom: 14 }}>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <button onClick={predict} style={{ width: "100%", background: gradient, color: "white", border: "none", borderRadius: 12, padding: "13px", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>Predict my colleges</button>
      </div>

      {result !== null && (
        <div style={{ marginTop: 14 }}>
          {result.length === 0 ? (
            <div style={{ background: "white", borderRadius: 16, padding: "20px", textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: 30, marginBottom: 6 }}>💪</div>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#1A1A2E" }}>Aim a bit higher</p>
              <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#9CA3AF" }}>This rank is beyond the listed NLU cut-offs for your category. Keep practising — or explore private law schools.</p>
            </div>
          ) : (
            <>
              <p style={{ margin: "0 0 10px", fontSize: 13, color: "#6B7280" }}>You have a strong shot at <strong style={{ color: "#1A1A2E" }}>{result.length}</strong> NLUs:</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {result.map((n) => (
                  <div key={n.name} style={{ background: "white", borderRadius: 14, padding: "13px 14px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: "#1A1A2E" }}>{n.name}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9CA3AF" }}>{n.city} · closes ~{n.close.toLocaleString("en-IN")}</p>
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 800, padding: "3px 10px", borderRadius: 20, background: n.tag === "Safe" ? "#DCFCE7" : "#FEF3E2", color: n.tag === "Safe" ? "#15803D" : "#B45309" }}>{n.tag}</span>
                  </div>
                ))}
              </div>
              <p style={{ margin: "10px 0 0", fontSize: 10.5, color: "#9CA3AF" }}>Indicative, based on recent closing ranks. Actual cut-offs vary year to year.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Daily CA Quiz ──────────────────────────────────────────
function Quiz({ caq }: { caq: CAItem[] }) {
  const CA_QUIZ = caq;
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  if (CA_QUIZ.length === 0) {
    return <p style={{ margin: "8px 0", fontSize: 13, color: "#9CA3AF" }}>No quiz questions published yet.</p>;
  }

  const score = CA_QUIZ.reduce((s, q, i) => s + (answers[i] === q.correct ? 1 : 0), 0);

  if (submitted) {
    return (
      <div>
        <div style={{ background: gradient, borderRadius: 18, padding: "20px", color: "white", textAlign: "center", boxShadow: "0 8px 24px rgba(61,36,17,0.3)" }}>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>Daily Current Affairs Quiz</p>
          <p style={{ margin: "6px 0 0", fontSize: 38, fontWeight: 900 }}>{score}<span style={{ fontSize: 18, color: "rgba(255,255,255,0.7)" }}>/{CA_QUIZ.length}</span></p>
        </div>
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          {CA_QUIZ.map((q, i) => {
            const chosen = answers[i];
            return (
              <div key={i} style={{ background: "white", borderRadius: 14, padding: "13px 14px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>Q{i + 1}. {q.q}</p>
                {q.options.map((o, oi) => {
                  const isCorrect = oi === q.correct, isChosen = oi === chosen;
                  return (
                    <div key={oi} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, marginBottom: 3, fontSize: 12.5, background: isCorrect ? "#DCFCE7" : isChosen ? "#FEF2F2" : "transparent", color: isCorrect ? "#15803D" : isChosen ? "#DC2626" : "#6B7280", fontWeight: isCorrect || isChosen ? 700 : 400 }}>
                      <span>{String.fromCharCode(65 + oi)}.</span><span style={{ flex: 1 }}>{o}</span>
                      {isCorrect && <span style={{ fontSize: 11 }}>✓</span>}
                    </div>
                  );
                })}
                <p style={{ margin: "6px 0 0", fontSize: 11.5, color: "#6B7280", lineHeight: 1.5 }}>💡 {q.explain}</p>
              </div>
            );
          })}
        </div>
        <button onClick={() => { setAnswers({}); setSubmitted(false); }} style={{ width: "100%", marginTop: 14, background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Try again</button>
      </div>
    );
  }

  return (
    <div>
      <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6B7280" }}>Today&apos;s quiz · {CA_QUIZ.length} questions · <strong style={{ color: "#1A1A2E" }}>{Object.keys(answers).length}</strong> answered</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {CA_QUIZ.map((q, i) => (
          <div key={i} style={{ background: "white", borderRadius: 14, padding: "14px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
            <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>Q{i + 1}. {q.q}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {q.options.map((o, oi) => {
                const sel = answers[i] === oi;
                return (
                  <button key={oi} onClick={() => setAnswers((a) => ({ ...a, [i]: oi }))} style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "left", border: `1.5px solid ${sel ? "#3D2411" : "#E5E7EB"}`, background: sel ? "#F6ECD9" : "white", borderRadius: 12, padding: "10px 12px", cursor: "pointer", fontSize: 13, color: "#374151" }}>
                    <span style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, border: `2px solid ${sel ? "#3D2411" : "#D1D5DB"}`, background: sel ? "#3D2411" : "white", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{String.fromCharCode(65 + oi)}</span>
                    {o}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length === 0} style={{ width: "100%", marginTop: 14, background: Object.keys(answers).length ? gradient : "#E5E7EB", color: Object.keys(answers).length ? "white" : "#9CA3AF", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 800, cursor: Object.keys(answers).length ? "pointer" : "default" }}>Submit quiz</button>
    </div>
  );
}

// ── Vocabulary flashcards ──────────────────────────────────
function VocabCards({ vocab, savedWords, onToggleSave }: { vocab: VocabItem[]; savedWords: string[]; onToggleSave: (word: string, meaning: string) => void }) {
  const [aiWords, setAiWords] = useState<VocabItem[]>([]);
  const [theme, setTheme] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Published words first, then any freshly AI-generated ones (de-duplicated).
  const seen = new Set<string>();
  const VOCAB = [...vocab, ...aiWords].filter((v) => {
    const k = v.word.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const generate = async () => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await generateVocabAction({ theme: theme.trim(), count: 6 });
      if (res.ok && res.words && res.words.length > 0) {
        setAiWords((prev) => [...res.words!, ...prev]);
        setI(0);
        setFlipped(false);
      } else {
        setErr(res.error ?? "Couldn't generate words right now.");
      }
    } catch {
      setErr("Couldn't generate words right now.");
    } finally {
      setBusy(false);
    }
  };

  const generator = (
    <div style={{ background: gradient, borderRadius: 18, padding: "14px", color: "#F7EFE2", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 17 }}>✨</span>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>AI Vocabulary Builder</p>
      </div>
      <p style={{ margin: "3px 0 10px", fontSize: 11.5, color: "#D9C6A8" }}>Generate fresh CLAT word cards — leave the theme blank for a mix.</p>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          disabled={busy}
          placeholder="Optional theme — e.g. legal terms, hard adjectives"
          style={{ flex: 1, border: "none", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#231911", outline: "none" }}
        />
        <button onClick={generate} disabled={busy} style={{ flexShrink: 0, background: "#F5A623", color: "#3D2411", border: "none", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 800, cursor: busy ? "default" : "pointer", opacity: busy ? 0.8 : 1 }}>
          {busy ? "Generating…" : "✨ Generate"}
        </button>
      </div>
      {err && <p style={{ margin: "8px 0 0", fontSize: 11.5, color: "#FCD9A6" }}>⚠️ {err}</p>}
    </div>
  );

  if (VOCAB.length === 0) {
    return (
      <div>
        {generator}
        <p style={{ margin: "8px 0", fontSize: 13, color: "#9CA3AF" }}>No vocabulary words yet — generate some with AI above to start a deck.</p>
      </div>
    );
  }

  const card = VOCAB[Math.min(i, VOCAB.length - 1)];
  const isKnown = savedWords.includes(card.word);
  const learnedCount = VOCAB.filter((v) => savedWords.includes(v.word)).length;

  const go = (d: number) => { setFlipped(false); setI((prev) => (prev + d + VOCAB.length) % VOCAB.length); };

  return (
    <div>
      {generator}
      <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6B7280" }}>Word {i + 1} of {VOCAB.length} · <strong style={{ color: "#15803D" }}>{learnedCount} learned</strong></p>

      <div onClick={() => setFlipped((f) => !f)} style={{ background: flipped ? "white" : gradient, color: flipped ? "#1A1A2E" : "white", borderRadius: 20, padding: "32px 22px", minHeight: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", cursor: "pointer", boxShadow: "0 6px 20px rgba(0,0,0,0.12)" }}>
        {!flipped ? (
          <>
            <p style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>{card.word}</p>
            <p style={{ margin: "12px 0 0", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Tap to reveal meaning</p>
          </>
        ) : (
          <>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{card.meaning}</p>
            <p style={{ margin: "12px 0 0", fontSize: 13, color: "#6B7280", fontStyle: "italic" }}>“{card.example}”</p>
          </>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button onClick={() => go(-1)} style={{ flex: 1, background: "white", color: "#374151", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>← Prev</button>
        <button onClick={() => onToggleSave(card.word, card.meaning)} style={{ flex: 1, background: isKnown ? "#DCFCE7" : "#F6ECD9", color: isKnown ? "#15803D" : "#3D2411", border: "none", borderRadius: 12, padding: "12px", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>{isKnown ? "✓ Learned" : "Mark learned"}</button>
        <button onClick={() => go(1)} style={{ flex: 1, background: gradient, color: "white", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Next →</button>
      </div>
    </div>
  );
}
