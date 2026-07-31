"use client";

import { useState } from "react";
import { addTaskAction, toggleTaskAction, deleteTaskAction, type StudyTask } from "../../lib/study-actions";

const gradient = "linear-gradient(135deg,#3D2411,#5C3A00)";

function dueLabel(due: string): { text: string; color: string } | null {
  if (!due) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(due + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  const days = Math.round((d.getTime() - today.getTime()) / 86400000);
  const nice = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  if (days < 0) return { text: `Overdue · ${nice}`, color: "#DC2626" };
  if (days === 0) return { text: "Due today", color: "#D97706" };
  if (days === 1) return { text: "Due tomorrow", color: "#D97706" };
  return { text: `Due ${nice}`, color: "#6B7280" };
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
        <button onClick={() => toggle(t)} aria-label={t.done ? "Mark not done" : "Mark done"} style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, cursor: "pointer", border: `2px solid ${t.done ? "#059669" : "#CBD5E1"}`, background: t.done ? "#059669" : "white", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, lineHeight: 1 }}>
          {t.done ? "✓" : ""}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13.5, color: t.done ? "#9CA3AF" : "#1A1A2E", textDecoration: t.done ? "line-through" : "none" }}>{t.title}</p>
          {d && !t.done && <p style={{ margin: "2px 0 0", fontSize: 11, fontWeight: 600, color: d.color }}>{d.text}</p>}
        </div>
        <button onClick={() => remove(t.id)} aria-label="Delete task" style={{ flexShrink: 0, background: "none", border: "none", color: "#CBD5E1", fontSize: 16, cursor: "pointer", padding: 4 }}>✕</button>
      </div>
    );
  };

  return (
    <div style={{ background: "#F7F3EA", minHeight: "100%", paddingBottom: 28 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#2B1700", fontSize: 14, fontWeight: 700, padding: "14px 16px 0" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B1700" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        Study Planner
      </button>

      <div style={{ padding: "12px 14px 0" }}>
        <div style={{ background: gradient, borderRadius: 18, padding: "16px", color: "#F7EFE2", boxShadow: "0 6px 20px rgba(61,36,17,0.28)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>📋</span>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Study Planner</p>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#D9C6A8" }}>
            {pending.length} to do{done.length > 0 ? ` · ${done.length} done` : ""}
          </p>
        </div>

        {/* Add task */}
        <form onSubmit={add} style={{ marginTop: 14, background: "white", borderRadius: 14, padding: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: 8 }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={busy} placeholder="Add a study task — e.g. Revise Article 21" style={{ border: "1.5px solid #E1D3BC", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "#231911", outline: "none" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} disabled={busy} aria-label="Due date (optional)" style={{ flex: 1, border: "1.5px solid #E1D3BC", borderRadius: 10, padding: "10px 12px", fontSize: 13.5, color: "#231911", outline: "none" }} />
            <button type="submit" disabled={busy || !title.trim()} style={{ flexShrink: 0, background: gradient, color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 800, cursor: busy || !title.trim() ? "default" : "pointer", opacity: busy || !title.trim() ? 0.6 : 1 }}>Add</button>
          </div>
        </form>

        {/* Pending */}
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {pending.length === 0 && done.length === 0 && (
            <p style={{ textAlign: "center", fontSize: 13, color: "#9CA3AF", margin: "12px 0" }}>No tasks yet — add your first study goal above.</p>
          )}
          {pending.length === 0 && done.length > 0 && (
            <p style={{ textAlign: "center", fontSize: 13, color: "#059669", fontWeight: 700, margin: "8px 0" }}>🎉 All done! Add a new task or take a break.</p>
          )}
          {pending.map(row)}
        </div>

        {/* Completed */}
        {done.length > 0 && (
          <>
            <p style={{ margin: "20px 0 8px", fontSize: 12, fontWeight: 800, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.04em" }}>Completed ({done.length})</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{done.map(row)}</div>
          </>
        )}
      </div>
    </div>
  );
}
