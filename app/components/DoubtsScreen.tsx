"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Send, Clock } from "./icons";
import type { DoubtMessage } from "../lib/doubt-actions";
import { AppIcon } from "./AppIcon";
import { ScreenHeader, card, input, primaryBtn, IconTile, EmptyState, Pill, PageTitle, HeroCard, SectionTitle, heroStrip, goldBtn, type Tone } from "./ui/kit";
import { AttachmentPicker, AttachmentPreview, type Attachment } from "./DoubtAttachment";

export type DoubtItem = {
  id: string;
  subject: string;
  body: string;
  status: string;
  answer: string;
  teacher: string | null;
  createdAt: string;
  messages: DoubtMessage[];
  /** A photo or PDF the student attached. */
  attachmentUrl?: string;
  /** The batch it was asked in, and the topic when asked from a topic page. */
  courseId?: string | null;
  lessonId?: string | null;
};

interface DoubtsScreenProps {
  doubts: DoubtItem[];
  onAskDoubt: (subject: string, body: string, attachmentUrl?: string) => Promise<void>;
  onFollowUp: (doubtId: string, body: string) => Promise<{ ok: boolean }>;
  /** Opened as a page (from a batch or mentorship) rather than a tab. */
  onBack?: () => void;
}

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const statusBadge = (s: string) => {
  const m: Record<string, { tone: Tone; icon?: "check" | "hourglass"; label: string }> = {
    answered: { tone: "green", icon: "check", label: "Answered" },
    open: { tone: "gold", icon: "hourglass", label: "Awaiting reply" },
    closed: { tone: "grey", label: "Closed" },
  };
  const b = m[s] ?? m.open;
  return <Pill tone={b.tone}>{b.icon && <AppIcon name={b.icon} size={10} strokeWidth={2.6} />}{b.label}</Pill>;
};

export default function DoubtsScreen({ doubts, onAskDoubt, onFollowUp, onBack }: DoubtsScreenProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [replyMap, setReplyMap] = useState<Record<string, string>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);

  const ask = async () => {
    if (!subject.trim() || (!body.trim() && !attachment)) return;
    setBusy(true);
    await onAskDoubt(subject, body, attachment?.url ?? "");
    setSubject(""); setBody(""); setAttachment(null); setBusy(false);
  };

  const reply = async (id: string) => {
    const r = replyMap[id]?.trim();
    if (!r) return;
    await onFollowUp(id, r);
    setReplyMap((m) => { const n = { ...m }; delete n[id]; return n; });
  };

  const sorted = [...doubts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div style={{ background: "var(--app-bg)", paddingBottom: 80 }}>
      {onBack
        ? <ScreenHeader title="My Doubts" subtitle="Answered by your faculty & mentors" onBack={onBack} />
        : <PageTitle kicker="Ask questions · get help from mentors" title="Doubts" />}

      <div style={{ padding: "12px 16px 0" }}>
      {/* Summary — Home's blue card */}
      <HeroCard padding={16} style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 46, height: 46, borderRadius: 14, background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.26)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AppIcon name="chat" size={22} color="white" />
          </span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 18, fontWeight: 700, lineHeight: 1.25 }}>Stuck somewhere? <span style={{ color: "var(--gold)" }}>Ask us.</span></span>
            <span style={{ display: "block", fontSize: 12.5, color: "rgba(255,255,255,0.72)", marginTop: 2 }}>Mentors usually reply within a day.</span>
          </span>
        </div>
        <div style={{ ...heroStrip, display: "flex", padding: "10px 4px", marginTop: 14 }}>
          {[
            { v: doubts.length, l: "Asked" },
            { v: doubts.filter((d) => d.status === "answered").length, l: "Answered" },
            { v: doubts.filter((d) => d.status === "open").length, l: "Awaiting" },
          ].map((x, i) => (
            <div key={x.l} style={{ flex: 1, textAlign: "center", borderLeft: i ? "1px solid rgba(255,255,255,0.16)" : "none" }}>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--gold)", lineHeight: 1.2 }}>{x.v}</p>
              <p style={{ margin: "1px 0 0", fontSize: 10.5, color: "rgba(255,255,255,0.68)" }}>{x.l}</p>
            </div>
          ))}
        </div>
      </HeroCard>

      {/* Ask a new doubt */}
      <div style={{ ...card, padding: 16, marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <IconTile icon="pen" size={36} />
          <span>
            <span style={{ display: "block", fontSize: 14.5, fontWeight: 800, color: "var(--ink)" }}>Ask a new doubt</span>
            <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-soft)" }}>Add a photo or PDF if it helps</span>
          </span>
        </div>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject (e.g., Legal Reasoning)" style={{ ...input, marginBottom: 8, background: "var(--app-bg)", border: "1px solid var(--line)" }} />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type your question here…" rows={3} style={{ ...input, marginBottom: 8, resize: "vertical", background: "var(--app-bg)", border: "1px solid var(--line)" }} />
        <div style={{ marginBottom: 12 }}>
          <AttachmentPicker value={attachment} onChange={setAttachment} disabled={busy} />
        </div>
        <button onClick={ask} disabled={busy} className="press" style={{ ...goldBtn, width: "100%", color: "var(--blue-dark)", cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1 }}>
          {busy ? "Submitting…" : <>Post Doubt <Send size={16} /></>}
        </button>
      </div>

      {sorted.length > 0 && <div style={{ marginBottom: 12 }}><SectionTitle kicker="Your questions" title="Recent doubts" /></div>}

      {/* Doubts list */}
      {sorted.length === 0 ? (
        <EmptyState icon="chat" title="No doubts yet. Ask one above!" />
      ) : sorted.map((d) => (
        <div key={d.id} style={{ ...card, marginBottom: 10, overflow: "hidden" }}>
          <button onClick={() => setOpenId(openId === d.id ? null : d.id)} style={{ width: "100%", textAlign: "left", padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start", background: "none", border: "none", cursor: "pointer" }}>
            <IconTile icon="chat" size={38} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>{d.subject}</span>
                {statusBadge(d.status)}
              </div>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--ink-soft)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.body}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <Clock size={12} style={{ color: "var(--text-muted)" }} />
                <span style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{fmt(d.createdAt)}</span>
                {d.teacher && <span style={{ fontSize: 10.5, color: "var(--text-muted)" }}>· {d.teacher}</span>}
              </div>
            </div>
            <span style={{ color: "var(--text-muted)", padding: 4 }}>{openId === d.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
          </button>

          {openId === d.id && (
            <div style={{ padding: "0 16px 14px", borderTop: "1px solid var(--line)" }}>
              <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--ink)", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{d.body}</p>
              {d.attachmentUrl && <AttachmentPreview url={d.attachmentUrl} />}
              <div style={{ height: 8 }} />
              {d.answer && (
                <div style={{ background: "var(--blue-tint)", borderRadius: 12, padding: "10px 12px", marginBottom: 8 }}>
                  <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 800, color: "var(--blue)", display: "flex", alignItems: "center", gap: 4 }}><AppIcon name="checkCircle" size={12} strokeWidth={2.4} />Answer{d.teacher ? ` by ${d.teacher}` : ""}</p>
                  <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink)", lineHeight: 1.55 }}>{d.answer}</p>
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
                          background: mine ? "var(--blue)" : "var(--app-bg)",
                          border: mine ? "none" : "1px solid var(--line)",
                          borderRadius: 12,
                          borderBottomRightRadius: mine ? 4 : 12,
                          borderBottomLeftRadius: mine ? 12 : 4,
                          padding: "8px 11px",
                        }}>
                          <p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 700, color: mine ? "rgba(255,255,255,0.75)" : "var(--text-muted)" }}>
                            {mine ? "You" : m.sender ?? "Faculty"}
                          </p>
                          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: mine ? "white" : "var(--ink)", whiteSpace: "pre-wrap" }}>{m.body}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <input value={replyMap[d.id] || ""} onChange={(e) => setReplyMap((m) => ({ ...m, [d.id]: e.target.value }))} placeholder="Reply…" style={{ ...input, flex: 1, width: "auto", minWidth: 0, borderRadius: 10, padding: "8px 12px" }} />
                <button onClick={() => reply(d.id)} aria-label="Send reply" style={{ ...primaryBtn, borderRadius: 10, padding: "8px 14px", boxShadow: "none" }}><Send size={16} /></button>
              </div>
            </div>
          )}
        </div>
      ))}
      </div>
    </div>
  );
}
