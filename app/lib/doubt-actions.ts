"use server";

import { revalidatePath } from "next/cache";
import { db, newId } from "./db";
import { requireRole } from "./auth";
import { notify } from "./notify";

/** A student posts a doubt to faculty. Callable as askDoubtAction(subject, body). */
export async function askDoubtAction(subject: string, body: string) {
  const user = await requireRole(["student"]);
  const text = (body ?? "").trim();
  if (!text) return;

  // Attach the doubt to the student's first enrolled batch, if any.
  const enr = await db
    .prepare("SELECT course_id FROM enrollments WHERE user_id = ? LIMIT 1")
    .get(user.id) as { course_id: string } | undefined;

  await db.prepare(
    `INSERT INTO doubts (id, student_id, course_id, subject, body, status)
     VALUES (?, ?, ?, ?, ?, 'open')`
  ).run(newId(), user.id, enr?.course_id ?? null, (subject ?? "").trim(), text);

  revalidatePath("/");
  revalidatePath("/teacher/doubts");
}

/** A teacher/admin answers a student's doubt. */
export async function answerDoubtAction(formData: FormData) {
  const user = await requireRole(["teacher", "admin"]);
  const doubtId = String(formData.get("doubtId") ?? "");
  const answer = String(formData.get("answer") ?? "").trim();
  if (!doubtId || !answer) return;

  const doubt = await db.prepare("SELECT student_id, subject FROM doubts WHERE id = ?").get(doubtId) as { student_id: string; subject: string } | undefined;

  await db.prepare(
    "UPDATE doubts SET answer = ?, status = 'answered', answered_by = ? WHERE id = ?"
  ).run(answer, user.id, doubtId);

  if (doubt) {
    await notify(doubt.student_id, "doubt", "Your doubt was answered", `${user.name} replied to your ${doubt.subject || "doubt"}.`);
  }

  revalidatePath("/teacher/doubts");
  revalidatePath("/");
}

export type DoubtMessage = {
  id: string;
  role: "student" | "faculty";
  sender: string | null;
  body: string;
  createdAt: string;
};

/**
 * Follow-up message on an existing doubt (both directions).
 * A student's follow-up reopens the doubt; a teacher's reply marks it answered.
 */
export async function postDoubtMessageAction(doubtId: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const user = await requireRole(["student", "teacher", "admin"]);
  const text = (body ?? "").trim();
  if (!doubtId || !text) return { ok: false, error: "Message can't be empty." };

  const doubt = await db.prepare("SELECT student_id, subject, answered_by FROM doubts WHERE id = ?").get(doubtId) as
    | { student_id: string; subject: string; answered_by: string | null }
    | undefined;
  if (!doubt) return { ok: false, error: "Doubt not found." };

  const isStudent = user.role === "student";
  if (isStudent && doubt.student_id !== user.id) return { ok: false, error: "Not your doubt." };

  await db.prepare(
    "INSERT INTO doubt_messages (id, doubt_id, sender_id, sender_role, body) VALUES (?, ?, ?, ?, ?)"
  ).run(newId(), doubtId, user.id, isStudent ? "student" : "faculty", text);

  if (isStudent) {
    // Reopen so the follow-up shows in the teachers' "awaiting answer" queue.
    await db.prepare("UPDATE doubts SET status = 'open' WHERE id = ?").run(doubtId);
    if (doubt.answered_by) {
      await notify(doubt.answered_by, "doubt", "Follow-up on a doubt you answered", `${user.name} asked a follow-up on their ${doubt.subject || "doubt"}.`);
    }
  } else {
    await db.prepare(
      "UPDATE doubts SET status = 'answered', answered_by = COALESCE(answered_by, ?) WHERE id = ?"
    ).run(user.id, doubtId);
    await notify(doubt.student_id, "doubt", "New reply on your doubt", `${user.name} replied to your ${doubt.subject || "doubt"}.`);
  }

  // Note: no revalidatePath("/") here — it remounts the student SPA (state
  // resets to Home mid-conversation). The client calls router.refresh() itself.
  revalidatePath("/teacher/doubts");
  return { ok: true };
}
