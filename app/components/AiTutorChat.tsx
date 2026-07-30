"use client";

import { useEffect, useRef, useState } from "react";
import { askTutorAction } from "@/app/lib/ai-actions";

export type ChatTurn = { role: "user" | "assistant"; content: string };

const ESPRESSO = "#3D2411";
const GOLD = "#C8860A";
const PAPER = "#FAF7F2";

const STUDENT_CHIPS = [
  "Explain the principle–facts method in Legal Reasoning",
  "Give me one CLAT-style Legal Reasoning question and quiz me",
  "How do I finish 5 RC passages in 45 minutes?",
  "Summarise this week's important current affairs for CLAT",
];
const TEACHER_CHIPS = [
  "Generate 5 CLAT Legal Reasoning MCQs on Article 21 (with answers + explanations)",
  "Write a 250-word legal-reasoning passage with a principle and 3 questions",
  "Draft crisp revision notes on the Preamble for CLAT students",
  "Create 5 Current Affairs MCQs from recent Supreme Court judgments",
];

/** Very small, safe formatter: paragraphs, • bullets, and **bold**. No HTML injection. */
function renderContent(text: string) {
  return text.split(/\n{2,}/).map((para, i) => {
    const lines = para.split("\n");
    const isList = lines.every((l) => /^\s*([-*•]|\d+[.)])\s+/.test(l)) && lines.length > 0;
    if (isList) {
      return (
        <ul key={i} style={{ margin: "6px 0", paddingLeft: 20 }}>
          {lines.map((l, j) => (
            <li key={j} style={{ margin: "3px 0" }}>{inline(l.replace(/^\s*([-*•]|\d+[.)])\s+/, ""))}</li>
          ))}
        </ul>
      );
    }
    return <p key={i} style={{ margin: "6px 0", whiteSpace: "pre-wrap" }}>{inline(para)}</p>;
  });
}
function inline(s: string) {
  // bold **text**
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>
  );
}

export default function AiTutorChat({
  role,
  name,
  backHref,
  configured,
  initialThreadId,
  initialMessages,
}: {
  role: "student" | "teacher" | "admin";
  name: string;
  backHref: string;
  configured: boolean;
  initialThreadId: string | null;
  initialMessages: ChatTurn[];
}) {
  const [threadId, setThreadId] = useState<string | null>(initialThreadId);
  const [messages, setMessages] = useState<ChatTurn[]>(initialMessages);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chips = role === "student" ? STUDENT_CHIPS : TEACHER_CHIPS;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    setBusy(true);
    try {
      const res = await askTutorAction(threadId, q);
      if (res.threadId) setThreadId(res.threadId);
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry — something went wrong. Please try again." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100dvh", background: PAPER, display: "flex", flexDirection: "column", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", color: "#1F1710" }}>
      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: ESPRESSO, color: "#F5ECDD", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 12px rgba(61,36,17,.25)" }}>
        <a href={backHref} aria-label="Back" style={{ color: "#F5ECDD", textDecoration: "none", fontSize: 22, lineHeight: 1, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, background: "rgba(255,255,255,.08)" }}>‹</a>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>✨</span>
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, letterSpacing: "-.01em" }}>CLAT AI Tutor</h1>
          </div>
          <p style={{ margin: "1px 0 0", fontSize: 11.5, color: "#D9C6A8" }}>
            {role === "student" ? "Your personal CLAT mentor — ask anything" : "Ask, or generate mocks & notes for your students"}
          </p>
        </div>
        <button
          onClick={() => { setThreadId(null); setMessages([]); setInput(""); }}
          style={{ background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.18)", color: "#F5ECDD", borderRadius: 9, padding: "7px 11px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        >
          New chat
        </button>
      </header>

      {!configured && (
        <div style={{ background: "#FEF3C7", color: "#92400E", padding: "10px 16px", fontSize: 13, borderBottom: "1px solid #FDE68A" }}>
          ⚠️ The AI Tutor isn't switched on. An admin needs to set <code>GEMINI_API_KEY</code> in the app environment.
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "18px 16px 8px", maxWidth: 760, width: "100%", margin: "0 auto" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "36px 8px 24px" }}>
            <div style={{ fontSize: 40 }}>⚖️</div>
            <h2 style={{ margin: "8px 0 4px", fontSize: 20, fontWeight: 800, color: ESPRESSO }}>Hi {name.split(" ")[0]} — how can I help?</h2>
            <p style={{ margin: 0, color: "#7A6A55", fontSize: 13.5, maxWidth: 460, marginInline: "auto" }}>
              {role === "student"
                ? "Ask me to explain a concept, walk through a legal-reasoning question, or quiz you."
                : "Ask a question, or have me generate CLAT-pattern MCQs, passages, and notes."}
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", margin: "10px 0" }}>
            <div style={{
              maxWidth: "88%",
              background: m.role === "user" ? ESPRESSO : "white",
              color: m.role === "user" ? "#F7EFE2" : "#231911",
              border: m.role === "user" ? "none" : "1px solid #EDE3D3",
              borderRadius: 16,
              borderBottomRightRadius: m.role === "user" ? 4 : 16,
              borderBottomLeftRadius: m.role === "user" ? 16 : 4,
              padding: "11px 14px",
              fontSize: 14.5,
              lineHeight: 1.55,
              boxShadow: m.role === "user" ? "0 2px 8px rgba(61,36,17,.18)" : "0 1px 6px rgba(61,36,17,.06)",
            }}>
              {m.role === "assistant" ? renderContent(m.content) : <span style={{ whiteSpace: "pre-wrap" }}>{m.content}</span>}
            </div>
          </div>
        ))}

        {busy && (
          <div style={{ display: "flex", justifyContent: "flex-start", margin: "10px 0" }}>
            <div style={{ background: "white", border: "1px solid #EDE3D3", borderRadius: 16, borderBottomLeftRadius: 4, padding: "12px 16px" }}>
              <span className="typing" style={{ display: "inline-flex", gap: 4 }}>
                <i /><i /><i />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick chips (only before any conversation) */}
      {messages.length === 0 && configured && (
        <div style={{ maxWidth: 760, width: "100%", margin: "0 auto", padding: "0 16px 6px", display: "flex", flexWrap: "wrap", gap: 8 }}>
          {chips.map((c) => (
            <button key={c} onClick={() => send(c)} style={{ textAlign: "left", background: "white", border: "1px solid #E6DAC6", color: "#4A3826", borderRadius: 12, padding: "9px 12px", fontSize: 12.5, fontWeight: 500, cursor: "pointer", flex: "1 1 220px" }}>
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <div style={{ position: "sticky", bottom: 0, background: PAPER, borderTop: "1px solid #ECE0CE", padding: "10px 16px calc(10px + env(safe-area-inset-bottom))" }}>
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          style={{ maxWidth: 760, margin: "0 auto", display: "flex", alignItems: "flex-end", gap: 8 }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder={configured ? "Ask the CLAT AI Tutor…" : "AI Tutor is not configured"}
            disabled={!configured || busy}
            rows={1}
            style={{ flex: 1, resize: "none", maxHeight: 140, minHeight: 44, border: "1.5px solid #E1D3BC", borderRadius: 14, padding: "11px 14px", fontSize: 14.5, fontFamily: "inherit", background: "white", color: "#231911", outlineColor: GOLD }}
          />
          <button
            type="submit"
            disabled={!configured || busy || !input.trim()}
            style={{ flex: "none", width: 46, height: 46, borderRadius: 14, border: "none", background: !configured || busy || !input.trim() ? "#C9B999" : ESPRESSO, color: "#F7EFE2", fontSize: 18, cursor: !configured || busy || !input.trim() ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            aria-label="Send"
          >
            ↑
          </button>
        </form>
        <p style={{ maxWidth: 760, margin: "6px auto 0", fontSize: 10.5, color: "#9A8A73", textAlign: "center" }}>
          AI can make mistakes — verify important legal facts and current affairs.
        </p>
      </div>

      <style>{`
        .typing i { width:6px; height:6px; border-radius:50%; background:#C9B48A; display:inline-block; animation: blink 1.2s infinite both; }
        .typing i:nth-child(2){ animation-delay:.2s } .typing i:nth-child(3){ animation-delay:.4s }
        @keyframes blink { 0%,80%,100%{ opacity:.25 } 40%{ opacity:1 } }
        @media (prefers-reduced-motion: reduce){ .typing i { animation: none } }
      `}</style>
    </div>
  );
}
