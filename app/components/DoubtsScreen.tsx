"use client";

import { useState } from "react";
import type { DoubtItem } from "../StudentApp";
import { parseServerDate } from "../lib/dates";

const subjects = ["Legal Reasoning", "English", "GK & Current Affairs", "Quantitative Techniques", "Logical Reasoning", "Exam Strategy"];

function ago(iso: string): string {
  const t = parseServerDate(iso).getTime();
  if (isNaN(t)) return "";
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface DoubtsScreenProps {
  doubts: DoubtItem[];
  onAskDoubt: (subject: string, body: string) => Promise<void>;
  onFollowUp: (doubtId: string, body: string) => Promise<{ ok: boolean; error?: string }>;
}

/** One chat bubble in a doubt thread — student on the right, faculty on the left. */
function ThreadBubble({ role, sender, body }: { role: "student" | "faculty"; sender: string | null; body: string }) {
  const isFaculty = role === "faculty";
  return (
    <div style={{ display: "flex", justifyContent: isFaculty ? "flex-start" : "flex-end" }}>
      <div style={{
        maxWidth: "85%",
        background: isFaculty ? "white" : "#3D2411",
        color: isFaculty ? "#374151" : "#F7EFE2",
        border: isFaculty ? "1px solid #E5E7EB" : "none",
        borderRadius: isFaculty ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
        padding: "9px 12px",
      }}>
        <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: isFaculty ? "#8A5A08" : "#F5C97A" }}>
          {isFaculty ? `👩‍🏫 ${sender ?? "Faculty"}` : "You"}
        </p>
        <p style={{ margin: "3px 0 0", fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{body}</p>
      </div>
    </div>
  );
}

export default function DoubtsScreen({ doubts, onAskDoubt, onFollowUp }: DoubtsScreenProps) {
  const [activeSection, setActiveSection] = useState<"mydoubts" | "ask">("mydoubts");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "answered">("all");
  const [subject, setSubject] = useState(subjects[0]);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const [followUp, setFollowUp] = useState("");
  const [followUpPending, setFollowUpPending] = useState(false);

  const sendFollowUp = async (doubtId: string) => {
    if (!followUp.trim() || followUpPending) return;
    setFollowUpPending(true);
    const res = await onFollowUp(doubtId, followUp.trim());
    setFollowUpPending(false);
    if (res.ok) setFollowUp("");
  };

  const counts = {
    all: doubts.length,
    open: doubts.filter((d) => d.status === "open").length,
    answered: doubts.filter((d) => d.status === "answered").length,
  };
  const visible = doubts.filter((d) => filter === "all" || d.status === filter);

  const submit = async () => {
    if (!question.trim() || pending) return;
    setPending(true);
    await onAskDoubt(subject, question.trim());
    setPending(false);
    setQuestion("");
    setJustSent(true);
    setActiveSection("mydoubts");
    setTimeout(() => setJustSent(false), 4000);
  };

  return (
    <div style={{ background: "#F7F3EA", paddingBottom: 90, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "white", padding: "16px 16px 0", borderBottom: "1px solid #F3F4F6" }}>
        <h2 style={{ margin: "0 0 14px", fontSize: 22, fontWeight: 800, color: "#1A1A2E" }}>Doubt Solving</h2>
        <div style={{ display: "flex", gap: 6, paddingBottom: 14 }}>
          {[
            { id: "mydoubts" as const, label: "My Doubts", icon: "❓" },
            { id: "ask" as const, label: "Ask Faculty", icon: "✍️" },
          ].map((s) => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
              flex: 1, padding: "10px 6px", borderRadius: 12, fontSize: 12.5, fontWeight: 700,
              border: "none", cursor: "pointer",
              background: activeSection === s.id ? "#3D2411" : "#F3F4F6",
              color: activeSection === s.id ? "white" : "#374151",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            }}>{s.icon} {s.label}</button>
          ))}
        </div>
      </div>

      {justSent && (
        <div style={{ margin: "14px 16px 0", background: "#DCFCE7", border: "1px solid #BBF7D0", borderRadius: 12, padding: "10px 14px", fontSize: 12.5, color: "#15803D", fontWeight: 600 }}>
          ✅ Your doubt was sent to faculty. You&apos;ll see the answer here once they reply.
        </div>
      )}

      {/* MY DOUBTS */}
      {activeSection === "mydoubts" && (
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {([["all", "All"], ["open", "Pending"], ["answered", "Answered"]] as const).map(([key, label]) => (
              <button key={key} onClick={() => setFilter(key)} style={{
                padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                border: "1px solid #E5E7EB", cursor: "pointer",
                background: filter === key ? "#3D2411" : "white",
                color: filter === key ? "white" : "#374151",
              }}>{label} ({counts[key]})</button>
            ))}
          </div>

          {visible.length === 0 && (
            <div style={{ background: "white", borderRadius: 16, padding: "26px 18px", textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 30, marginBottom: 6 }}>💬</div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1A1A2E" }}>No doubts here</p>
              <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#9CA3AF" }}>Ask your first doubt from the “Ask Faculty” tab.</p>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {visible.map((d) => {
              const answered = d.status === "answered";
              const isOpen = expanded === d.id;
              return (
                <div key={d.id} style={{ background: "white", borderRadius: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                  <div onClick={() => setExpanded(isOpen ? null : d.id)} style={{ padding: "14px 16px", cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {d.subject && <span style={{ background: "#F6ECD9", color: "#3D2411", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{d.subject}</span>}
                        <span style={{
                          background: answered ? "#DCFCE7" : "#FEF9C3",
                          color: answered ? "#15803D" : "#D97706",
                          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                        }}>{answered ? "✓ Answered" : "⏳ Pending"}</span>
                      </div>
                      <span style={{ fontSize: 11, color: "#9CA3AF" }}>{ago(d.createdAt)}</span>
                    </div>
                    <p style={{
                      margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.5,
                      display: "-webkit-box", WebkitLineClamp: isOpen ? undefined : 2,
                      WebkitBoxOrient: "vertical" as const, overflow: isOpen ? "visible" : "hidden",
                    }}>{d.body}</p>
                    {answered && !isOpen && (
                      <p style={{ margin: "6px 0 0", fontSize: 12, color: "#3D2411", fontWeight: 600 }}>Tap to view answer →</p>
                    )}
                  </div>
                  {isOpen && (
                    <div style={{ borderTop: "1px solid #F3F4F6", padding: "14px 16px", background: "#F9FAFB" }}>
                      {/* Thread: first answer, then follow-up messages in order */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {d.answer && <ThreadBubble role="faculty" sender={d.teacher} body={d.answer} />}
                        {d.messages.map((m) => (
                          <ThreadBubble key={m.id} role={m.role} sender={m.sender} body={m.body} />
                        ))}
                        {!d.answer && d.messages.length === 0 && (
                          <p style={{ margin: 0, fontSize: 12, color: "#9CA3AF", textAlign: "center" }}>⏳ Waiting for faculty to reply…</p>
                        )}
                      </div>

                      {/* Follow-up composer */}
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <input
                          value={followUp}
                          onChange={(e) => setFollowUp(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") sendFollowUp(d.id); }}
                          placeholder={answered ? "Ask a follow-up…" : "Add more detail…"}
                          style={{
                            flex: 1, background: "white", border: "1.5px solid #E5E7EB",
                            borderRadius: 12, padding: "10px 12px", fontSize: 13, color: "#374151",
                            outline: "none",
                          }}
                        />
                        <button
                          onClick={() => sendFollowUp(d.id)}
                          disabled={!followUp.trim() || followUpPending}
                          style={{
                            background: followUp.trim() && !followUpPending ? "#3D2411" : "#E5E7EB",
                            color: followUp.trim() && !followUpPending ? "white" : "#9CA3AF",
                            border: "none", borderRadius: 12, padding: "0 16px",
                            fontSize: 13, fontWeight: 700,
                            cursor: followUp.trim() && !followUpPending ? "pointer" : "default",
                          }}
                        >{followUpPending ? "…" : "Send"}</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ASK FACULTY */}
      {activeSection === "ask" && (
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ background: "white", borderRadius: 18, padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800, color: "#1A1A2E" }}>Ask your faculty</p>

            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Subject</label>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 14 }} className="no-scroll">
              {subjects.map((s) => (
                <button key={s} onClick={() => setSubject(s)} style={{
                  padding: "7px 14px", borderRadius: 20, fontSize: 11.5, fontWeight: 700,
                  border: "1px solid", borderColor: subject === s ? "#3D2411" : "#E5E7EB",
                  background: subject === s ? "#3D2411" : "white",
                  color: subject === s ? "white" : "#374151",
                  cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                }}>{s}</button>
              ))}
            </div>

            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Your question</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={`Type your ${subject} doubt in detail…`}
              rows={5}
              style={{
                width: "100%", background: "#F9FAFB", border: "1.5px solid #E5E7EB",
                borderRadius: 12, padding: "12px 14px", fontSize: 13, color: "#374151",
                outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5,
              }}
            />

            <button
              onClick={submit}
              disabled={!question.trim() || pending}
              style={{
                width: "100%", marginTop: 14,
                background: question.trim() && !pending ? "linear-gradient(135deg,#3D2411,#5C3A00)" : "#E5E7EB",
                color: question.trim() && !pending ? "white" : "#9CA3AF",
                border: "none", borderRadius: 14, padding: "14px",
                fontSize: 15, fontWeight: 800, cursor: question.trim() && !pending ? "pointer" : "default",
              }}
            >
              {pending ? "Sending…" : "Send to Faculty"}
            </button>
            <p style={{ margin: "10px 0 0", fontSize: 11, color: "#9CA3AF", textAlign: "center" }}>
              A faculty member will answer, and it&apos;ll appear under “My Doubts”.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
