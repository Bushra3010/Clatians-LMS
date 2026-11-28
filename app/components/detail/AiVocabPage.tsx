"use client";

import { useState } from "react";
import { generateVocabAction } from "../../lib/ai-actions";
import type { VocabItem } from "../../lib/resource-types";
import { AppIcon } from "../AppIcon";
import { ScreenHeader, card, page, goldBtn, gradient, heroSurface } from "../ui/kit";

const THEMES = ["Legal terms", "Hard adjectives", "Formal verbs", "Idioms"];

/**
 * AI Vocab Builder — a flashcard deck: the words the team has published, plus
 * any the AI makes on a theme. Tap the card to flip; "Learned" saves the word.
 */
export default function AiVocabPage({ onBack, vocab, learned, onToggleLearned }: {
  onBack: () => void;
  vocab: VocabItem[];
  learned: string[];
  onToggleLearned: (word: string, meaning: string) => void;
}) {
  const [aiWords, setAiWords] = useState<VocabItem[]>([]);
  const [theme, setTheme] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Fresh AI words first, then the published deck (de-duplicated).
  const seen = new Set<string>();
  const deck = [...aiWords, ...vocab].filter((v) => {
    const k = v.word.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const learnedCount = deck.filter((v) => learned.includes(v.word)).length;

  const generate = async (t = theme) => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await generateVocabAction({ theme: t.trim(), count: 6 });
      if (res.ok && res.words && res.words.length > 0) {
        setAiWords((prev) => [...res.words!, ...prev]);
        setI(0);
        setFlipped(false);
      } else setErr(res.error ?? "Couldn't make words right now.");
    } catch {
      setErr("Couldn't make words right now.");
    } finally {
      setBusy(false);
    }
  };

  const word = deck.length ? deck[Math.min(i, deck.length - 1)] : null;
  const isLearned = !!word && learned.includes(word.word);
  const go = (d: number) => { setFlipped(false); setI((p) => (p + d + deck.length) % deck.length); };

  return (
    <div style={page}>
      <ScreenHeader title="Vocab Builder" onBack={onBack} />
      <div style={{ padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Make new words */}
        <div style={{ ...card, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--app-bg)", borderRadius: 14, padding: "4px 4px 4px 12px" }}>
            <AppIcon name="sparkle" size={16} color="var(--blue)" />
            <input value={theme} onChange={(e) => setTheme(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") generate(); }} disabled={busy}
              placeholder="Any theme, or leave blank" style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: 14, padding: "10px 0", color: "var(--ink)" }} />
            <button onClick={() => generate()} disabled={busy} className="press" style={{ ...goldBtn, flexShrink: 0, borderRadius: 11, padding: "9px 14px", fontSize: 13, color: "var(--blue-dark)", cursor: busy ? "default" : "pointer" }}>
              {busy ? "Making…" : "Generate"}
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {THEMES.map((t) => (
              <button key={t} disabled={busy} onClick={() => { setTheme(t); generate(t); }} style={{ border: "1px solid var(--line)", borderRadius: 20, padding: "5px 11px", background: "white", color: "var(--ink-soft)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{t}</button>
            ))}
          </div>
          {err && <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--error-text)", display: "flex", gap: 6 }}><AppIcon name="alert" size={14} />{err}</p>}
        </div>

        {!word ? (
          <div style={{ ...card, padding: "28px 18px", textAlign: "center" }}>
            <AppIcon name="language" size={30} color="var(--ink-mute)" />
            <p style={{ margin: "8px 0 0", fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>No words yet</p>
            <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--ink-soft)" }}>Generate a set above to start your deck.</p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, fontWeight: 700, color: "var(--ink-soft)", margin: "0 2px" }}>
              <span>Word {i + 1} of {deck.length}</span>
              <span style={{ color: "var(--success-text)" }}>{learnedCount} learned</span>
            </div>

            {/* The card — tap to flip */}
            <button onClick={() => setFlipped((f) => !f)} style={{
              ...(flipped ? { ...card, color: "var(--ink)" } : { ...heroSurface, color: "white" }),
              border: flipped ? "1px solid var(--line)" : "none", width: "100%", cursor: "pointer",
              borderRadius: 24, padding: "34px 22px", minHeight: 210, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center",
            }}>
              {!flipped ? (
                <>
                  <span style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.01em" }}>{word.word}</span>
                  <span style={{ marginTop: 14, fontSize: 12, color: "rgba(255,255,255,0.7)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <AppIcon name="refresh" size={12} color="rgba(255,255,255,0.7)" /> Tap to see meaning
                  </span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{word.word}</span>
                  <span style={{ marginTop: 8, fontSize: 17, fontWeight: 800, lineHeight: 1.4 }}>{word.meaning}</span>
                  {word.example && <span style={{ marginTop: 12, fontSize: 13, color: "var(--ink-soft)", fontStyle: "italic", lineHeight: 1.5 }}>&ldquo;{word.example}&rdquo;</span>}
                </>
              )}
            </button>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => go(-1)} aria-label="Previous word" style={{ width: 52, borderRadius: 14, border: "1px solid var(--line)", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AppIcon name="chevronRight" size={18} color="var(--ink)" style={{ transform: "rotate(180deg)" }} />
              </button>
              <button onClick={() => onToggleLearned(word.word, word.meaning)} className="press" style={{
                flex: 1, borderRadius: 14, padding: 13, fontSize: 14, fontWeight: 800, cursor: "pointer",
                border: isLearned ? "1.5px solid var(--success-border)" : "1.5px solid var(--blue)",
                background: isLearned ? "var(--success)" : "white", color: isLearned ? "var(--success-text)" : "var(--blue)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                <AppIcon name={isLearned ? "checkCircle" : "check"} size={16} />{isLearned ? "Learned" : "Mark learned"}
              </button>
              <button onClick={() => go(1)} aria-label="Next word" style={{ width: 52, borderRadius: 14, border: "none", background: gradient, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AppIcon name="chevronRight" size={18} color="white" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
