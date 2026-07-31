"use server";

import { db, newId } from "./db";
import { requireRole } from "./auth";

const NOW_SQL = "to_char((now() at time zone 'utc'), 'YYYY-MM-DD HH24:MI:SS')";

export type Note = { id: string; title: string; body: string };

/** Create a personal note. Returns the note for optimistic UI. */
export async function addNoteAction(title: string, body: string): Promise<{ ok: boolean; note?: Note; error?: string }> {
  const user = await requireRole(["student", "teacher", "admin"]);
  const t = String(title ?? "").trim().slice(0, 200);
  const b = String(body ?? "").trim().slice(0, 8000);
  if (!t && !b) return { ok: false, error: "Write something first." };

  const id = newId();
  await db.prepare("INSERT INTO notes (id, user_id, title, body) VALUES (?, ?, ?, ?)").run(id, user.id, t || "Untitled note", b);
  return { ok: true, note: { id, title: t || "Untitled note", body: b } };
}

/** Update a note (own notes only). */
export async function updateNoteAction(id: string, title: string, body: string): Promise<{ ok: boolean }> {
  const user = await requireRole(["student", "teacher", "admin"]);
  const t = String(title ?? "").trim().slice(0, 200);
  const b = String(body ?? "").trim().slice(0, 8000);
  await db.prepare(`UPDATE notes SET title = ?, body = ?, updated_at = ${NOW_SQL} WHERE id = ? AND user_id = ?`).run(t || "Untitled note", b, String(id), user.id);
  return { ok: true };
}

/** Delete a note (own notes only). */
export async function deleteNoteAction(id: string): Promise<{ ok: boolean }> {
  const user = await requireRole(["student", "teacher", "admin"]);
  await db.prepare("DELETE FROM notes WHERE id = ? AND user_id = ?").run(String(id), user.id);
  return { ok: true };
}
