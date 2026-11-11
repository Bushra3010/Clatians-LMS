"use client";

import { useState } from "react";
import { addTaskAction, toggleTaskAction, deleteTaskAction, type StudyTask } from "../../lib/study-actions";
import { AppIcon } from "../AppIcon";
import { card, gradient, primaryBtn, input, page, body, ScreenHeader, SectionTitle, IconTile, EmptyState } from "../ui/kit";

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
  return { text: `Due ${nice}`, color: "var(--ink-soft)" };
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
      <div key={t.id} style={{ ...card, borderRadius: 14, padding: "11px 12px", display: "flex", alignItems: "center", gap: 11 }}>
        <button onClick={() => toggle(t)} aria-label={t.done ? "Mark not done" : "Mark done"} style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, cursor: "pointer", border: `2px solid ${t.done ? "var(--green)" : "var(--line-strong)"}`, background: t.done ? "var(--green)" : "white", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
          {t.done && <AppIcon name="check" size={13} color="white" strokeWidth={3} />}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13.5, color: t.done ? "var(--text-muted)" : "var(--ink)", textDecoration: t.done ? "line-through" : "none" }}>{t.title}</p>
          {d && !t.done && <p style={{ margin: "2px 0 0", fontSize: 11, fontWeight: 600, color: d.color }}>{d.text}</p>}
        </div>
        <button onClick={() => remove(t.id)} aria-label="Delete task" style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
          <AppIcon name="close" size={16} color="var(--text-muted)" />
        </button>
      </div>
    );
  };

  return (
    <div style={page}>
      <ScreenHeader title="Study Planner" onBack={onBack} />

      <div style={body}>
        <div style={{ background: gradient, borderRadius: 20, padding: "18px 16px", color: "white", boxShadow: "0 8px 22px rgba(11,92,255,0.22)", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 42, height: 42, borderRadius: 13, background: "rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AppIcon name="clipboard" size={20} color="white" />
          </span>
          <div>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Your study goals</p>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(255,255,255,0.78)" }}>
              {pending.length} to do{done.length > 0 ? ` · ${done.length} done` : ""}
            </p>
          </div>
        </div>

        {/* Add task */}
        <form onSubmit={add} style={{ ...card, padding: "14px", display: "flex", flexDirection: "column", gap: 10 }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={busy} placeholder="Add a study task — e.g. Revise Article 21" style={input} />
          <div style={{ display: "flex", gap: 10 }}>
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} disabled={busy} aria-label="Due date (optional)" style={{ ...input, flex: 1, width: "auto", minWidth: 0 }} />
            <button type="submit" disabled={busy || !title.trim()} style={{ ...primaryBtn, flexShrink: 0, padding: "11px 20px", cursor: busy || !title.trim() ? "default" : "pointer", opacity: busy || !title.trim() ? 0.6 : 1 }}>
              <AppIcon name="plus" size={16} color="white" strokeWidth={2.6} />
              Add
            </button>
          </div>
        </form>

        {/* Pending */}
        {pending.length === 0 && done.length === 0 && (
          <EmptyState icon="clipboard" title="No tasks yet" text="Add your first study goal above." />
        )}
        {pending.length === 0 && done.length > 0 && (
          <div style={{ ...card, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <IconTile icon="checkCircle" tone="green" size={34} />
            <p style={{ margin: 0, fontSize: 13, color: "var(--success-text)", fontWeight: 700 }}>All done! Add a new task or take a break.</p>
          </div>
        )}
        {pending.map(row)}

        {/* Completed */}
        {done.length > 0 && (
          <>
            <SectionTitle title={`Completed (${done.length})`} />
            {done.map(row)}
          </>
        )}
      </div>
    </div>
  );
}
