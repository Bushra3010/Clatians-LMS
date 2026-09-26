"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Send, Clock } from "./icons";
import type { DoubtMessage } from "../lib/doubt-actions";

export type DoubtItem = {
  id: string;
  subject: string;
  body: string;
  status: string;
  answer: string;
  teacher: string | null;
  createdAt: string;
  messages: DoubtMessage[];
};

interface DoubtsScreenProps {
  doubts: DoubtItem[];
  onAskDoubt: (subject: string, body: string) => Promise<void>;
  onFollowUp: (doubtId: string, body: string) => Promise<{ ok: boolean }>;
}

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const statusBadge = (s: string) => {
  const m: Record<string, { bg: string; c: string; label: string }> = {
    answered: { bg: "var(--success)", c: "var(--success-text)", label: "✓ Answered" },
    open: { bg: "var(--warning)", c: "var(--warning-text)", label: "⏳ Awaiting reply" },
    closed: { bg: "var(--surface-dim)", c: "var(--text-muted)", label: "Closed" },
  };
  const b = m[s] ?? m.open;
  return <span style={{ background: b.bg, color: b.c, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{b.label}</span>;
};

export default function DoubtsScreen({ doubts, onAskDoubt, onFollowUp }: DoubtsScreenProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [replyMap, setReplyMap] = useState<Record<string, string>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const ask = async () => {
    if (!subject.trim() || !body.trim()) return;
    setBusy(true);
    await onAskDoubt(subject, body);
    setSubject(""); setBody(""); setBusy(false);
  };

  const reply = async (id: string) => {
    const r = replyMap[id]?.trim();
    if (!r) return;
    await onFollowUp(id, r);
    setReplyMap((m) => { const n = { ...m }; delete n[id]; return n; });
  };

  const sorted = [...doubts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div style={{ background: "var(--app-bg)", padding: "16px 16px 80px" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>Doubts</h2>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text-muted)" }}>Ask questions · get help from mentors</p>

      {/* Ask a new doubt */}
      <div style={{ background: "var(--surface)", borderRadius: 18, padding: 16, marginBottom: 16, border: "1px solid var(--border)", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Ask a new doubt</p>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject (e.g., Legal Reasoning)" style={{ width: "100%", borderRadius: 12, border: "1px solid var(--border)", padding: "10px 14px", fontSize: 14, marginBottom: 8, outline: "none", color: "var(--text-primary)", background: "var(--surface-input)" }} />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type your question here…" rows={3} style={{ width: "100%", borderRadius: 12, border: "1px solid var(--border)", padding: "10px 14px", fontSize: 14, marginBottom: 8, outline: "none", resize: "vertical", color: "var(--text-primary)", background: "var(--surface-input)" }} />
        <button onClick={ask} disabled={busy} style={{ width: "100%", background: "var(--blue)", color: "white", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 700, cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1 }}>
          {busy ? "Submitting…" : "Post Doubt"}
        </button>
      </div>

      {/* Doubts list */}
      {sorted.length === 0 ? (
        <div style={{ background: "var(--surface)", borderRadius: 18, padding: "28px 18px", textAlign: "center", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 32, marginBottom: 6 }}>💬</div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>No doubts yet. Ask one above!</p>
        </div>
      ) : sorted.map((d) => (
        <div key={d.id} style={{ background: "var(--surface)", borderRadius: 18, border: "1px solid var(--border)", marginBottom: 10, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
          <button onClick={() => setOpenId(openId === d.id ? null : d.id)} style={{ width: "100%", textAlign: "left", padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start", background: "none", border: "none", cursor: "pointer" }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: "var(--blue-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18 }}>💬</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{d.subject}</span>
                {statusBadge(d.status)}
              </div>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.body}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <Clock size={12} style={{ color: "var(--text-disabled)" }} />
                <span style={{ fontSize: 10, color: "var(--text-disabled)" }}>{fmt(d.createdAt)}</span>
                {d.teacher && <span style={{ fontSize: 10, color: "var(--text-disabled)" }}>· {d.teacher}</span>}
              </div>
            </div>
            <span style={{ color: "var(--text-muted)", padding: 4 }}>{openId === d.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
          </button>

          {openId === d.id && (
            <div style={{ padding: "0 16px 14px", borderTop: "1px solid var(--border)" }}>
              {d.answer && (
                <div style={{ background: "var(--info-bg)", border: "1px solid var(--info-border)", borderRadius: 12, padding: "10px 12px", marginBottom: 8 }}>
                  <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "var(--info-text)" }}>Answer{d.teacher ? ` by ${d.teacher}` : ""}</p>
                  <p style={{ margin: 0, fontSize: 12.5, color: "#1E3A8A" }}>{d.answer}</p>
                </div>
              )}
              {/* Thread */}
              {d.messages.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                  {d.messages.map((m) => {
                    const mine = m.role !== "faculty";
                    return (
                      <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                        <div style={{
                          maxWidth: "85%",
                          background: mine ? "var(--blue)" : "var(--surface-dim)",
                          border: mine ? "none" : "1px solid var(--border)",
                          borderRadius: 12,
                          borderBottomRightRadius: mine ? 4 : 12,
                          borderBottomLeftRadius: mine ? 12 : 4,
                          padding: "8px 11px",
                        }}>
                          <p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 700, color: mine ? "rgba(255,255,255,0.75)" : "var(--text-disabled)" }}>
                            {mine ? "You" : m.sender ?? "Faculty"}
                          </p>
                          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: mine ? "white" : "var(--text-primary)", whiteSpace: "pre-wrap" }}>{m.body}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <input value={replyMap[d.id] || ""} onChange={(e) => setReplyMap((m) => ({ ...m, [d.id]: e.target.value }))} placeholder="Reply…" style={{ flex: 1, borderRadius: 10, border: "1px solid var(--border)", padding: "8px 12px", fontSize: 13, outline: "none", background: "var(--surface-input)" }} />
                <button onClick={() => reply(d.id)} style={{ background: "var(--blue)", color: "white", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}><Send size={16} /></button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
