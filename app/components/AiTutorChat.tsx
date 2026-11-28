"use client";

import { useEffect, useRef, useState } from "react";
import { askTutorAction } from "@/app/lib/ai-actions";
import { AppIcon, type IconName } from "./AppIcon";
import { gradient, card, heroBg } from "./ui/kit";

export type ChatTurn = { role: "user" | "assistant"; content: string };


type Starter = { icon: IconName; title: string; prompt: string };

const STUDENT_STARTERS: Starter[] = [
  { icon: "scale", title: "Legal Reasoning", prompt: "Explain the principle–facts method in Legal Reasoning with one worked example" },
  { icon: "puzzle", title: "Quiz me", prompt: "Give me one CLAT-style Legal Reasoning question and quiz me on it" },
  { icon: "book", title: "Reading Comprehension", prompt: "How do I finish 5 RC passages in 45 minutes?" },
  { icon: "newspaper", title: "Current Affairs", prompt: "Summarise this week's important current affairs for CLAT" },
];
const TEACHER_STARTERS: Starter[] = [
  { icon: "clipboard", title: "Make MCQs", prompt: "Generate 5 CLAT Legal Reasoning MCQs on Article 21 (with answers + explanations)" },
  { icon: "file", title: "Write a passage", prompt: "Write a 250-word legal-reasoning passage with a principle and 3 questions" },
  { icon: "list", title: "Revision notes", prompt: "Draft crisp revision notes on the Preamble for CLAT students" },
  { icon: "newspaper", title: "CA questions", prompt: "Create 5 Current Affairs MCQs from recent Supreme Court judgments" },
];

/** The tutor's face: a gold bolt in the brand blue. */
function TutorAvatar({ size = 32 }: { size?: number }) {
  return (
    <span style={{ width: size, height: size, borderRadius: "50%", background: gradient, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 3px 10px rgba(11,92,255,0.25)" }}>
      <AppIcon name="bolt" size={Math.round(size * 0.5)} color="var(--gold)" fill="var(--gold)" />
    </span>
  );
}

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
  const starters = role === "student" ? STUDENT_STARTERS : TEACHER_STARTERS;
  const [copied, setCopied] = useState<number | null>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const first = name.split(" ")[0] || "there";

  const copy = async (i: number, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(i); setTimeout(() => setCopied(null), 1500); } catch { /* clipboard blocked */ }
  };
  // Grow the message box with its text, up to ~5 lines.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 130)}px`;
  }, [input]);

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

  const canSend = configured && !busy && !!input.trim();

  return (
    <div style={{ height: "100dvh", background: "var(--app-bg)", display: "flex", flexDirection: "column", fontFamily: "var(--font-body)", color: "var(--ink)", maxWidth: 760, margin: "0 auto", boxShadow: "var(--shadow-float)" }}>
      {/* Header — the app's blue, with the tutor's face and status */}
      <header style={{ background: heroBg, color: "white", padding: "12px 14px 14px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0, position: "relative", overflow: "hidden" }}>
        <span style={{ position: "absolute", right: -40, top: -60, width: 170, height: 170, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,166,35,0.28), transparent 70%)", pointerEvents: "none" }} />
        <a href={backHref} aria-label="Back" style={{ position: "relative", textDecoration: "none", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "rgba(255,255,255,0.14)", flexShrink: 0 }}>
          <AppIcon name="chevronRight" size={19} color="white" strokeWidth={2.5} style={{ transform: "rotate(180deg)" }} />
        </a>
        <span style={{ position: "relative" }}>
          <span style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(255,255,255,0.35)" }}>
            <AppIcon name="bolt" size={21} color="var(--blue-dark)" fill="var(--blue-dark)" />
          </span>
          <span style={{ position: "absolute", right: 0, bottom: 1, width: 11, height: 11, borderRadius: "50%", background: configured ? "#22C55E" : "#9CA3AF", border: "2px solid var(--blue-dark)" }} />
        </span>
        <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, letterSpacing: "-.01em" }}>CLAT AI <span style={{ color: "var(--gold)" }}>Tutor</span></h1>
          <p style={{ margin: "1px 0 0", fontSize: 11.5, color: "rgba(255,255,255,0.75)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {busy ? "Typing…" : configured ? "Online · replies in seconds" : "Offline"}
          </p>
        </div>
        <button
          onClick={() => { setThreadId(null); setMessages([]); setInput(""); }}
          style={{ position: "relative", background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.22)", color: "white", borderRadius: 12, padding: "8px 11px", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0 }}
        >
          <AppIcon name="plus" size={13} strokeWidth={2.6} />
          New chat
        </button>
      </header>

      {!configured && (
        <div style={{ background: "var(--warning)", color: "var(--warning-text)", padding: "10px 16px", fontSize: 13, borderBottom: "1px solid var(--warning-border)", display: "flex", alignItems: "flex-start", gap: 8 }}>
          <AppIcon name="alert" size={16} style={{ marginTop: 1 }} />
          <span>The AI Tutor isn&apos;t switched on. An admin needs to set <code>GEMINI_API_KEY</code> in the app environment.</span>
        </div>
      )}

      {/* Conversation */}
      <div ref={scrollRef} className="no-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px 14px 10px" }}>
        {messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ ...card, padding: "20px 16px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <TutorAvatar size={58} />
              <h2 style={{ margin: "12px 0 4px", fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>Hi {first}, I&apos;m your CLAT tutor</h2>
              <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: 13, lineHeight: 1.5, maxWidth: 380 }}>
                {role === "student"
                  ? "Ask me to explain a concept, solve a question step by step, or quiz you — any time."
                  : "Ask a question, or have me write CLAT-pattern MCQs, passages and notes."}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: 12 }}>
                {["Step-by-step answers", "CLAT pattern", "24×7"].map((t) => (
                  <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "var(--blue)", background: "var(--blue-tint)", padding: "4px 9px", borderRadius: 20 }}>
                    <AppIcon name="check" size={11} strokeWidth={3} />{t}
                  </span>
                ))}
              </div>
            </div>

            {(
              <>
                <p style={{ margin: "4px 2px 0", fontSize: 12, fontWeight: 800, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Start with</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                  {starters.map((c) => (
                    <button key={c.title} onClick={() => send(c.prompt)} disabled={!configured} className={configured ? "press" : undefined} style={{ ...card, textAlign: "left", padding: 12, cursor: configured ? "pointer" : "default", opacity: configured ? 1 : 0.55, display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
                      <span style={{ width: 34, height: 34, borderRadius: 10, background: "var(--blue-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <AppIcon name={c.icon} size={17} color="var(--blue)" />
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>{c.title}</span>
                      <span style={{ fontSize: 11.5, color: "var(--ink-soft)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.prompt}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {messages.map((m, i) => m.role === "user" ? (
          <div key={i} style={{ display: "flex", justifyContent: "flex-end", margin: "12px 0" }}>
            <div style={{ maxWidth: "84%", background: gradient, color: "white", borderRadius: "18px 18px 4px 18px", padding: "10px 14px", fontSize: 14.5, lineHeight: 1.5, boxShadow: "0 4px 12px rgba(11,92,255,0.2)", whiteSpace: "pre-wrap" }}>
              {m.content}
            </div>
          </div>
        ) : (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, margin: "12px 0" }}>
            <TutorAvatar size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ background: "white", border: "1px solid var(--line)", borderRadius: "4px 18px 18px 18px", padding: "10px 14px", fontSize: 14.5, lineHeight: 1.6, boxShadow: "var(--shadow-md)" }}>
                {renderContent(m.content)}
              </div>
              <button onClick={() => copy(i, m.content)} style={{ marginTop: 4, background: "none", border: "none", padding: "2px 4px", cursor: "pointer", fontSize: 11.5, fontWeight: 700, color: copied === i ? "var(--success-text)" : "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <AppIcon name={copied === i ? "check" : "copy"} size={12} />{copied === i ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        ))}

        {busy && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0" }}>
            <TutorAvatar size={30} />
            <div style={{ background: "white", border: "1px solid var(--line)", borderRadius: "4px 18px 18px 18px", padding: "11px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <span className="typing" style={{ display: "inline-flex", gap: 4 }}><i /><i /><i /></span>
              <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Thinking…</span>
            </div>
          </div>
        )}
      </div>

      {/* Composer — a floating pill */}
      <div style={{ flexShrink: 0, padding: "8px 12px calc(10px + env(safe-area-inset-bottom))", background: "linear-gradient(to top, var(--app-bg) 70%, transparent)" }}>
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          style={{ display: "flex", alignItems: "flex-end", gap: 8, background: "white", border: "1px solid var(--line)", borderRadius: 24, padding: 6, paddingLeft: 14, boxShadow: "0 8px 24px rgba(15,23,41,0.10)" }}
        >
          <textarea
            ref={boxRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder={configured ? "Ask anything about CLAT…" : "AI Tutor is not configured"}
            disabled={!configured || busy}
            rows={1}
            style={{ flex: 1, minWidth: 0, resize: "none", border: "none", outline: "none", background: "transparent", fontSize: 14.5, lineHeight: 1.45, padding: "9px 0", color: "var(--ink)", fontFamily: "inherit", maxHeight: 130 }}
          />
          <button
            type="submit"
            disabled={!canSend}
            style={{ flex: "none", width: 40, height: 40, borderRadius: "50%", border: "none", background: canSend ? gradient : "var(--surface-dim)", color: canSend ? "white" : "var(--text-disabled)", cursor: canSend ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}
            aria-label="Send"
          >
            <AppIcon name="arrowRight" size={19} strokeWidth={2.6} style={{ transform: "rotate(-90deg)" }} />
          </button>
        </form>
        <p style={{ margin: "6px 0 0", fontSize: 10.5, color: "var(--text-muted)", textAlign: "center" }}>
          AI can make mistakes — verify important legal facts and current affairs.
        </p>
      </div>

      <style>{`
        .typing i { width:6px; height:6px; border-radius:50%; background:var(--blue); display:inline-block; animation: blink 1.2s infinite both; }
        .typing i:nth-child(2){ animation-delay:.2s } .typing i:nth-child(3){ animation-delay:.4s }
        @keyframes blink { 0%,80%,100%{ opacity:.25 } 40%{ opacity:1 } }
        @media (prefers-reduced-motion: reduce){ .typing i { animation: none } }
      `}</style>
    </div>
  );
}
