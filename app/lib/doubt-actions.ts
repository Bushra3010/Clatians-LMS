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
