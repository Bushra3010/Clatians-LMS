"use client";

import { useState } from "react";
import { CATEGORIES, type Category } from "../../lib/clat-data";
import type { VocabItem, CAItem, NLUItem } from "../../lib/resource-types";
import { generateVocabAction } from "../../lib/ai-actions";
import { AppIcon, type IconName } from "../AppIcon";
import { ScreenHeader, IconTile, EmptyState, Pill, card as cardStyle, page, primaryBtn, outlineBtn, goldBtn, input, gradient } from "../ui/kit";

const TABS: readonly (readonly [Tab, string, IconName])[] = [["predictor", "Predictor", "graduation"], ["quiz", "CA Quiz", "newspaper"], ["vocab", "Vocab", "book"]];

type Tab = "predictor" | "quiz" | "vocab";

export default function ClatToolsPage({ onBack, vocab, caq, nlus, savedVocabKeys, onToggleSave, initialTab = "predictor" }: { onBack: () => void; vocab: VocabItem[]; caq: CAItem[]; nlus: NLUItem[]; savedVocabKeys: string[]; onToggleSave: (word: string, meaning: string) => void; initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <div style={page}>
      <ScreenHeader title="CLAT Tools" onBack={onBack} />

      <div style={{ padding: "14px 16px 0" }}>
        <div style={{ ...cardStyle, display: "flex", gap: 6, padding: 5, borderRadius: 16 }}>
          {TABS.map(([id, l, icon]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, padding: "9px 4px", borderRadius: 11, fontSize: 12.5, fontWeight: 800, border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              background: tab === id ? gradient : "transparent", color: tab === id ? "white" : "var(--ink-soft)",
            }}><AppIcon name={icon} size={15} />{l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "14px 16px 0" }}>
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
      <div style={{ ...cardStyle, padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <IconTile icon="graduation" size={38} />
          <p style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: "var(--ink)" }}>NLU College Predictor</p>
        </div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}>Your expected CLAT rank</label>
        <input value={rank} onChange={(e) => setRank(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="e.g. 850" style={{ ...input, marginBottom: 12 }} />
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}>Category</label>
        <select value={cat} onChange={(e) => setCat(e.target.value as Category)} style={{ ...input, marginBottom: 14 }}>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <button onClick={predict} style={{ ...primaryBtn, width: "100%", fontSize: 15 }}>Predict my colleges</button>
      </div>

      {result !== null && (
        <div style={{ marginTop: 14 }}>
          {result.length === 0 ? (
            <EmptyState icon="target" title="Aim a bit higher" text="This rank is beyond the listed NLU cut-offs for your category. Keep practising — or explore private law schools." />
          ) : (
            <>
              <p style={{ margin: "0 2px 10px", fontSize: 13, color: "var(--ink-soft)" }}>You have a strong shot at <strong style={{ color: "var(--ink)" }}>{result.length}</strong> NLUs:</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {result.map((n) => (
                  <div key={n.name} style={{ ...cardStyle, padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                    <IconTile icon="landmark" tone={n.tag === "Safe" ? "green" : "gold"} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>{n.name}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--ink-mute)" }}>{n.city} · closes ~{n.close.toLocaleString("en-IN")}</p>
                    </div>
                    <Pill tone={n.tag === "Safe" ? "green" : "gold"}>{n.tag}</Pill>
                  </div>
                ))}
              </div>
              <p style={{ margin: "10px 2px 0", fontSize: 11, color: "var(--ink-mute)" }}>Indicative, based on recent closing ranks. Actual cut-offs vary year to year.</p>
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
    return <EmptyState icon="newspaper" title="No quiz questions published yet." />;
  }

  const score = CA_QUIZ.reduce((s, q, i) => s + (answers[i] === q.correct ? 1 : 0), 0);

  if (submitted) {
    return (
      <div>
        <div style={{ background: gradient, borderRadius: 20, padding: "20px", color: "white", textAlign: "center", boxShadow: "0 8px 22px rgba(11,92,255,0.25)" }}>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>Daily Current Affairs Quiz</p>
          <p style={{ margin: "6px 0 0", fontSize: 38, fontWeight: 900 }}>{score}<span style={{ fontSize: 18, color: "rgba(255,255,255,0.7)" }}>/{CA_QUIZ.length}</span></p>
        </div>
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          {CA_QUIZ.map((q, i) => {
            const chosen = answers[i];
            return (
              <div key={i} style={{ ...cardStyle, padding: "13px 14px" }}>
                <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Q{i + 1}. {q.q}</p>
                {q.options.map((o, oi) => {
                  const isCorrect = oi === q.correct, isChosen = oi === chosen;
                  return (
                    <div key={oi} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, marginBottom: 3, fontSize: 12.5, background: isCorrect ? "var(--success)" : isChosen ? "var(--error)" : "transparent", color: isCorrect ? "var(--success-text)" : isChosen ? "var(--error-text)" : "var(--text-muted)", fontWeight: isCorrect || isChosen ? 700 : 400 }}>
                      <span>{String.fromCharCode(65 + oi)}.</span><span style={{ flex: 1 }}>{o}</span>
                      {isCorrect && <AppIcon name="check" size={14} strokeWidth={2.6} />}
                    </div>
                  );
                })}
                <p style={{ margin: "6px 0 0", fontSize: 11.5, color: "var(--ink-soft)", lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <AppIcon name="bulb" size={14} color="var(--gold-dark)" style={{ marginTop: 1 }} />
                  <span>{q.explain}</span>
                </p>
              </div>
            );
          })}
        </div>
        <button onClick={() => { setAnswers({}); setSubmitted(false); }} style={{ ...outlineBtn, width: "100%", marginTop: 14, fontSize: 14 }}><AppIcon name="refresh" size={15} /> Try again</button>
      </div>
    );
  }

  return (
    <div>
      <p style={{ margin: "0 2px 12px", fontSize: 13, color: "var(--ink-soft)" }}>Today&apos;s quiz · {CA_QUIZ.length} questions · <strong style={{ color: "var(--ink)" }}>{Object.keys(answers).length}</strong> answered</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {CA_QUIZ.map((q, i) => (
          <div key={i} style={{ ...cardStyle, padding: "14px" }}>
            <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Q{i + 1}. {q.q}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {q.options.map((o, oi) => {
                const sel = answers[i] === oi;
                return (
                  <button key={oi} onClick={() => setAnswers((a) => ({ ...a, [i]: oi }))} style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "left", border: `1.5px solid ${sel ? "var(--blue)" : "var(--line-strong)"}`, background: sel ? "var(--blue-tint)" : "white", borderRadius: 12, padding: "10px 12px", cursor: "pointer", fontSize: 13, color: "var(--text-secondary)" }}>
                    <span style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, border: `2px solid ${sel ? "var(--blue)" : "var(--line-strong)"}`, background: sel ? "var(--blue)" : "white", color: sel ? "white" : "var(--ink-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{String.fromCharCode(65 + oi)}</span>
                    {o}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length === 0} style={{ ...primaryBtn, width: "100%", marginTop: 14, fontSize: 15, ...(Object.keys(answers).length ? {} : { background: "var(--surface-dim)", color: "var(--ink-mute)", boxShadow: "none", cursor: "default" }) }}>Submit quiz</button>
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
    <div style={{ background: gradient, borderRadius: 20, padding: "16px", color: "white", marginBottom: 14, boxShadow: "0 8px 22px rgba(11,92,255,0.25)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 34, height: 34, borderRadius: 11, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <AppIcon name="sparkle" size={17} color="white" />
        </span>
        <p style={{ margin: 0, fontSize: 14.5, fontWeight: 800 }}>AI Vocabulary Builder</p>
      </div>
      <p style={{ margin: "6px 0 10px", fontSize: 11.5, color: "rgba(255,255,255,0.8)" }}>Generate fresh CLAT word cards — leave the theme blank for a mix.</p>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          disabled={busy}
          placeholder="Optional theme — e.g. legal terms, hard adjectives"
          style={{ ...input, flex: 1, minWidth: 0, width: "auto", border: "none", borderRadius: 12, padding: "10px 12px", fontSize: 14 }}
        />
        <button onClick={generate} disabled={busy} style={{ ...goldBtn, flexShrink: 0, borderRadius: 12, padding: "10px 14px", fontSize: 13, cursor: busy ? "default" : "pointer", opacity: busy ? 0.8 : 1 }}>
          {busy ? "Generating…" : <><AppIcon name="sparkle" size={15} /> Generate</>}
        </button>
      </div>
      {err && (
        <p style={{ margin: "8px 0 0", fontSize: 11.5, color: "var(--gold-100)", display: "flex", alignItems: "flex-start", gap: 6 }}>
          <AppIcon name="alert" size={14} style={{ marginTop: 1 }} /> {err}
        </p>
      )}
    </div>
  );

  if (VOCAB.length === 0) {
    return (
      <div>
        {generator}
        <EmptyState icon="book" title="No vocabulary words yet — generate some with AI above to start a deck." />
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
      <p style={{ margin: "0 2px 12px", fontSize: 13, color: "var(--ink-soft)" }}>Word {i + 1} of {VOCAB.length} · <strong style={{ color: "var(--success-text)" }}>{learnedCount} learned</strong></p>

      <div onClick={() => setFlipped((f) => !f)} style={{ ...(flipped ? cardStyle : { background: gradient, boxShadow: "0 8px 22px rgba(11,92,255,0.25)" }), color: flipped ? "var(--ink)" : "white", borderRadius: 20, padding: "32px 22px", minHeight: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", cursor: "pointer" }}>
        {!flipped ? (
          <>
            <p style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>{card.word}</p>
            <p style={{ margin: "12px 0 0", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Tap to reveal meaning</p>
          </>
        ) : (
          <>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{card.meaning}</p>
            <p style={{ margin: "12px 0 0", fontSize: 13, color: "var(--ink-soft)", fontStyle: "italic" }}>“{card.example}”</p>
          </>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button onClick={() => go(-1)} style={{ ...outlineBtn, flex: 1, padding: "12px 8px", fontSize: 14 }}><AppIcon name="arrowRight" size={15} style={{ transform: "rotate(180deg)" }} /> Prev</button>
        <button onClick={() => onToggleSave(card.word, card.meaning)} style={{ ...primaryBtn, flex: 1, padding: "12px 8px", fontSize: 13, boxShadow: "none", background: isKnown ? "var(--success)" : "var(--blue-tint)", color: isKnown ? "var(--success-text)" : "var(--blue)" }}>{isKnown ? <><AppIcon name="check" size={15} strokeWidth={2.6} /> Learned</> : "Mark learned"}</button>
        <button onClick={() => go(1)} style={{ ...primaryBtn, flex: 1, padding: "12px 8px", fontSize: 14 }}>Next <AppIcon name="arrowRight" size={15} color="white" /></button>
      </div>
    </div>
  );
}
