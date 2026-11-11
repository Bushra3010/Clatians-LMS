"use client";

import { useEffect, useRef, useState } from "react";
import { youtubeId } from "../../lib/youtube";
import { getMyClassChatAction, sendClassQuestionAction, type ClassChatMessage } from "../../lib/class-chat-actions";
import { AppIcon } from "../AppIcon";
import { ScreenHeader } from "../ui/kit";

export { youtubeId };

export type WatchTarget = {
  title: string;
  subtitle: string;
  /** YouTube video id; when blank, `videoUrl` plays instead. */
  ytId: string;
  /** A video file to play when there is no YouTube id (the demo lecture). */
  videoUrl?: string;
  /** The class's own link (Meet, Zoom…) when it can't play inside the app. */
  externalUrl?: string;
  /** Sample class: plays the demo video with a practice chat. */
  demo?: boolean;
  notes?: string;
  isLive?: boolean;
  /** Set for a scheduled class — turns on the private teacher chat. */
  classId?: string;
  /** Attendance was recorded on join. */
  attended?: boolean;
};

const POLL_MS = 4000;

/**
 * The in-class chat box. Looks like a live chat, but it is a private line to
 * the teacher: other students never see these messages.
 */
function PrivateChat({ classId, live }: { classId: string; live: boolean }) {
  const [messages, setMessages] = useState<ClassChatMessage[]>([]);
  const [status, setStatus] = useState(live ? "live" : "");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const res = await getMyClassChatAction(classId);
      if (!alive || !res.ok) return;
      setMessages(res.messages);
      setStatus(res.status);
    };
    load();
    // Only a live class needs polling; a past class's chat is fixed.
    const t = live ? setInterval(load, POLL_MS) : undefined;
    return () => { alive = false; if (t) clearInterval(t); };
  }, [classId, live]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setErr("");
    const res = await sendClassQuestionAction(classId, text);
    setSending(false);
    if (!res.ok) { setErr(res.error ?? "Could not send."); return; }
    setDraft("");
    const fresh = await getMyClassChatAction(classId);
    if (fresh.ok) setMessages(fresh.messages);
  };

  const open = status === "live";

  return (
    <div style={{ marginTop: 14, background: "white", borderRadius: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", overflow: "hidden" }}>
      <div style={{ padding: "11px 14px", borderBottom: "1px solid var(--gold-100)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 800, color: "var(--ink-primary)" }}><AppIcon name="chat" size={15} color="var(--blue)" />Ask your teacher</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 700, color: "var(--text-muted)", background: "var(--bg-secondary)", padding: "3px 8px", borderRadius: 20 }}><AppIcon name="lock" size={10} />Private — classmates can&apos;t see</span>
      </div>

      <div ref={listRef} style={{ maxHeight: 280, minHeight: 120, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8, background: "var(--app-bg)" }}>
        {messages.length === 0 && (
          <p style={{ margin: "auto 0", textAlign: "center", fontSize: 12, color: "var(--text-disabled)", lineHeight: 1.6 }}>
            {open ? "Didn't get something? Ask here — only your teacher will see it and reply to you." : "No questions were asked in this class."}
          </p>
        )}
        {messages.map((m) => {
          const mine = m.role === "student";
          return (
            <div key={m.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "82%" }}>
              {!mine && <p style={{ margin: "0 0 2px 4px", fontSize: 10.5, fontWeight: 800, color: "var(--blue)" }}>{m.sender ?? "Teacher"} · Teacher</p>}
              <div style={{
                background: mine ? "var(--blue)" : "white", color: mine ? "white" : "var(--ink-primary)",
                border: mine ? "none" : "1px solid var(--gold-100)",
                borderRadius: mine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                padding: "8px 11px", fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap", overflowWrap: "anywhere",
              }}>{m.body}</div>
            </div>
          );
        })}
      </div>

      {open ? (
        <div style={{ padding: "10px 12px", borderTop: "1px solid var(--gold-100)" }}>
          {err && <p style={{ margin: "0 0 6px", fontSize: 12, color: "var(--error-text)" }}>{err}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder="Type your question…"
              maxLength={1000}
              style={{ flex: 1, minWidth: 0, border: "1.5px solid var(--border)", borderRadius: 12, padding: "10px 12px", fontSize: 16, fontFamily: "inherit", color: "var(--ink-primary)" }}
            />
            <button onClick={send} disabled={sending || !draft.trim()} style={{ background: "linear-gradient(135deg,var(--blue-dark),var(--blue))", color: "white", border: "none", borderRadius: 12, padding: "0 16px", fontSize: 13, fontWeight: 800, cursor: "pointer", opacity: sending || !draft.trim() ? 0.55 : 1 }}>
              {sending ? "…" : "Send"}
            </button>
          </div>
        </div>
      ) : (
        <p style={{ margin: 0, padding: "10px 14px", borderTop: "1px solid var(--gold-100)", fontSize: 11.5, color: "var(--text-disabled)", textAlign: "center" }}>
          {status === "ended" ? "Class has ended — chat is closed." : "Chat opens when the class goes live."}
        </p>
      )}
    </div>
  );
}

/** The chat in a demo class: works the same way, but stays on this device and a sample teacher replies. */
function DemoChat({ teacher }: { teacher: string }) {
  const [messages, setMessages] = useState<{ id: number; mine: boolean; body: string }[]>([
    { id: 0, mine: false, body: "Welcome to the class! Ask anything you don't follow — only I can see your questions." },
  ]);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    setMessages((m) => [...m, { id: Date.now(), mine: true, body: text }]);
    setTimeout(() => setMessages((m) => [...m, { id: Date.now() + 1, mine: false, body: "Good question! I'll explain this right after the current slide." }]), 1500);
  };

  return (
    <div style={{ marginTop: 14, background: "white", borderRadius: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", overflow: "hidden" }}>
      <div style={{ padding: "11px 14px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 800, color: "var(--ink-primary)" }}><AppIcon name="chat" size={15} color="var(--blue)" />Ask your teacher</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 700, color: "var(--text-muted)", background: "var(--surface-dim)", padding: "3px 8px", borderRadius: 20 }}><AppIcon name="lock" size={10} />Private</span>
      </div>
      <div ref={listRef} style={{ maxHeight: 260, minHeight: 120, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8, background: "var(--app-bg)" }}>
        {messages.map((m) => (
          <div key={m.id} style={{ alignSelf: m.mine ? "flex-end" : "flex-start", maxWidth: "82%" }}>
            {!m.mine && <p style={{ margin: "0 0 2px 4px", fontSize: 10.5, fontWeight: 800, color: "var(--blue)" }}>{teacher} · Teacher</p>}
            <div style={{
              background: m.mine ? "var(--blue)" : "white", color: m.mine ? "white" : "var(--ink-primary)",
              border: m.mine ? "none" : "1px solid var(--line)",
              borderRadius: m.mine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              padding: "8px 11px", fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap", overflowWrap: "anywhere",
            }}>{m.body}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: "10px 12px", borderTop: "1px solid var(--line)", display: "flex", gap: 8 }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} placeholder="Type your question…" maxLength={500}
          style={{ flex: 1, minWidth: 0, border: "1.5px solid var(--border)", borderRadius: 12, padding: "10px 12px", fontSize: 16, fontFamily: "inherit", color: "var(--ink-primary)" }} />
        <button onClick={send} disabled={!draft.trim()} style={{ background: "linear-gradient(135deg,var(--blue-dark),var(--blue))", color: "white", border: "none", borderRadius: 12, padding: "0 16px", fontSize: 13, fontWeight: 800, cursor: "pointer", opacity: draft.trim() ? 1 : 0.55 }}>Send</button>
      </div>
    </div>
  );
}

export default function ClassWatchPage({
  onBack,
  target,
}: {
  onBack: () => void;
  target: WatchTarget;
}) {
  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%", paddingBottom: 24 }}>
      <ScreenHeader title={target.isLive ? "Live Class" : "Recording"} onBack={onBack} />

      {/* 16:9 player: YouTube embed, or the video file */}
      <div style={{ padding: "14px 14px 0" }}>
        <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", borderRadius: 16, overflow: "hidden", background: "#000", boxShadow: "0 6px 20px rgba(0,0,0,0.18)" }}>
          {target.ytId ? (
            <iframe
              src={`https://www.youtube.com/embed/${target.ytId}?autoplay=1&rel=0`}
              title={target.title}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <video src={target.videoUrl} autoPlay controls playsInline loop={target.isLive} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", background: "#000" }} />
          )}
          {target.isLive && (
            <span style={{ position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 5, background: "#E03131", color: "white", fontSize: 10.5, fontWeight: 800, padding: "3px 8px", borderRadius: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "white" }} />LIVE
            </span>
          )}
        </div>
        {target.demo && (
          <p style={{ margin: "8px 2px 0", display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--text-muted)" }}>
            <AppIcon name="info" size={13} />Demo class — this is how a {target.isLive ? "live class" : "recording"} plays inside the app.
          </p>
        )}
      </div>

      <div style={{ padding: "14px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          {target.isLive && (
            <span style={{ background: "var(--error)", color: "var(--error-text)", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--error-text)", display: "inline-block" }} /> LIVE
            </span>
          )}
          {target.attended && (
            <span style={{ display: "flex", alignItems: "center", gap: 3, background: "var(--success)", color: "var(--success-text)", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}><AppIcon name="check" size={10} strokeWidth={3} />Attendance marked</span>
          )}
        </div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--ink-primary)", lineHeight: 1.3 }}>{target.title}</h2>
        <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--text-muted)" }}>{target.subtitle}</p>

        {target.externalUrl && (
          <a href={target.externalUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12, textDecoration: "none", border: "1.5px solid var(--blue)", color: "var(--blue)", borderRadius: 12, padding: "10px", fontSize: 13, fontWeight: 800 }}>
            <AppIcon name="video" size={15} />Open the class link
          </a>
        )}

        {target.classId ? <PrivateChat classId={target.classId} live={!!target.isLive} />
          : target.demo && target.isLive ? <DemoChat teacher={target.subtitle.split(" · ").pop() || "CLATians Faculty"} /> : null}

        {target.notes && (
          <div style={{ marginTop: 14, background: "white", borderRadius: 16, padding: "14px 16px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
            <p style={{ margin: "0 0 4px", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "var(--blue)" }}><AppIcon name="file" size={13} />Class notes</p>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{target.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
