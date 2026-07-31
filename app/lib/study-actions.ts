"use server";

import { db, newId } from "./db";
import { requireRole } from "./auth";

export type StudyTask = { id: string; title: string; done: boolean; dueDate: string };

/** Add a personal study task. Returns the created task for optimistic UI. */
export async function addTaskAction(title: string, dueDate: string): Promise<{ ok: boolean; task?: StudyTask; error?: string }> {
  const user = await requireRole(["student", "teacher", "admin"]);
  const t = String(title ?? "").trim().slice(0, 200);
  const due = String(dueDate ?? "").trim().slice(0, 10); // YYYY-MM-DD or ""
  if (!t) return { ok: false, error: "Enter a task first." };

  const id = newId();
  await db.prepare("INSERT INTO study_tasks (id, user_id, title, due_date) VALUES (?, ?, ?, ?)").run(id, user.id, t, due);
  return { ok: true, task: { id, title: t, done: false, dueDate: due } };
}

/** Toggle a task's done state (own tasks only). */
export async function toggleTaskAction(id: string, done: boolean): Promise<{ ok: boolean }> {
  const user = await requireRole(["student", "teacher", "admin"]);
  await db.prepare("UPDATE study_tasks SET done = ? WHERE id = ? AND user_id = ?").run(done ? 1 : 0, String(id), user.id);
  return { ok: true };
}

/** Delete a task (own tasks only). */
export async function deleteTaskAction(id: string): Promise<{ ok: boolean }> {
  const user = await requireRole(["student", "teacher", "admin"]);
  await db.prepare("DELETE FROM study_tasks WHERE id = ? AND user_id = ?").run(String(id), user.id);
  return { ok: true };
}
