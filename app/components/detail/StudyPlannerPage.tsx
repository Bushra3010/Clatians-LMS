"use client";

import { useState } from "react";
import { addTaskAction, toggleTaskAction, deleteTaskAction, type StudyTask } from "../../lib/study-actions";

const gradient = "linear-gradient(135deg,var(--blue-dark),var(--blue))";

function dueLabel(due: string): { text: string; color: string } | null {
  if (!due) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(due + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  const days = Math.round((d.getTime() - today.getTime()) / 86400000);
  const nice = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  if (days < 0) return { text: `Overdue · ${nice}`, color: "var(--error-text)" };
  if (days === 0) return { text: "Due today", color: "var(--warning-text)" };
  if (days === 1) return { text: "Due tomorrow", color: "var(--warning-text)" };
  return { text: `Due ${nice}`, color: "var(--text-muted)" };
}

export default function StudyPlannerPage({ onBack, initialTasks }: { onBack: () => void; initialTasks: StudyTask[] }) {
  const [tasks, setTasks] = useState<StudyTask[]>(initialTasks);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [busy, setBusy] = useState(false);

  const pending = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !title.trim()) return;
    setBusy(true);
    try {
      const res = await addTaskAction(title.trim(), due);
      if (res.ok && res.task) {
        setTasks((t) => [res.task!, ...t]);
        setTitle(""); setDue("");
      }
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (t: StudyTask) => {
    setTasks((list) => list.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)));
    try { await toggleTaskAction(t.id, !t.done); } catch { /* revert on failure */ setTasks((list) => list.map((x) => (x.id === t.id ? { ...x, done: t.done } : x))); }
  };

  const remove = async (id: string) => {
    const prev = tasks;
    setTasks((list) => list.filter((x) => x.id !== id));
    try { await deleteTaskAction(id); } catch { setTasks(prev); }
  };

  const row = (t: StudyTask) => {
    const d = dueLabel(t.dueDate);
    return (
      <div key={t.id} style={{ background: "white", borderRadius: 12, padding: "11px 12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: 11 }}>
        <button onClick={() => toggle(t)} aria-label={t.done ? "Mark not done" : "Mark done"} style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, cursor: "pointer", border: `2px solid ${t.done ? "var(--green)" : "var(--border)"}`, background: t.done ? "var(--green)" : "white", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, lineHeight: 1 }}>
          {t.done ? "✓" : ""}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13.5, color: t.done ? "var(--text-disabled)" : "var(--ink-primary)", textDecoration: t.done ? "line-through" : "none" }}>{t.title}</p>
          {d && !t.done && <p style={{ margin: "2px 0 0", fontSize: 11, fontWeight: 600, color: d.color }}>{d.text}</p>}
        </div>
        <button onClick={() => remove(t.id)} aria-label="Delete task" style={{ flexShrink: 0, background: "none", border: "none", color: "var(--text-disabled)", fontSize: 16, cursor: "pointer", padding: 4 }}>✕</button>
      </div>
    );
  };

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%", paddingBottom: 28 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "var(--ink-primary)", fontSize: 14, fontWeight: 700, padding: "14px 16px 0" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-primary)" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        Study Planner
      </button>

      <div style={{ padding: "12px 14px 0" }}>
        <div style={{ background: gradient, borderRadius: 20, padding: "18px 16px", color: "white", boxShadow: "0 8px 24px rgba(61,36,17,0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>📋</span>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Study Planner</p>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.78)" }}>
            {pending.length} to do{done.length > 0 ? ` · ${done.length} done` : ""}
          </p>
        </div>

        {/* Add task */}
        <form onSubmit={add} style={{ marginTop: 14, background: "white", borderRadius: 16, padding: "14px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: 10 }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={busy} placeholder="Add a study task — e.g. Revise Article 21" style={{ border: "1.5px solid var(--border)", borderRadius: 12, padding: "11px 13px", fontSize: 14, color: "var(--ink-primary)", outline: "none" }} />
          <div style={{ display: "flex", gap: 10 }}>
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} disabled={busy} aria-label="Due date (optional)" style={{ flex: 1, border: "1.5px solid var(--border)", borderRadius: 12, padding: "10px 12px", fontSize: 13.5, color: "var(--ink-primary)", outline: "none" }} />
            <button type="submit" disabled={busy || !title.trim()} style={{ flexShrink: 0, background: gradient, color: "white", border: "none", borderRadius: 12, padding: "11px 20px", fontSize: 14, fontWeight: 800, cursor: busy || !title.trim() ? "default" : "pointer", opacity: busy || !title.trim() ? 0.6 : 1 }}>Add</button>
          </div>
        </form>

        {/* Pending */}
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {pending.length === 0 && done.length === 0 && (
            <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-disabled)", margin: "16px 0" }}>No tasks yet — add your first study goal above.</p>
          )}
          {pending.length === 0 && done.length > 0 && (
            <p style={{ textAlign: "center", fontSize: 13, color: "var(--green)", fontWeight: 700, margin: "8px 0" }}>🎉 All done! Add a new task or take a break.</p>
          )}
          {pending.map(row)}
        </div>

        {/* Completed */}
        {done.length > 0 && (
          <>
            <p style={{ margin: "20px 0 8px", fontSize: 12, fontWeight: 800, color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Completed ({done.length})</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{done.map(row)}</div>
          </>
        )}
      </div>
    </div>
  );
}
