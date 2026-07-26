"use server";

import { revalidatePath } from "next/cache";
import { db, newId } from "./db";
import { requireRole } from "./auth";
import { notify, notifyMany } from "./notify";
import { logAudit } from "./audit";

const STATUSES = ["scheduled", "live", "ended", "cancelled"];

type ClassRow = {
  id: string;
  teacher_id: string | null;
  join_url: string;
};

/**
 * Schedule a live class. Teachers create classes for themselves; admins may
 * assign any teacher via the `teacherId` field.
 */
export async function createClassAction(formData: FormData) {
  const user = await requireRole(["teacher", "admin"]);

  const title = String(formData.get("title") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const courseId = String(formData.get("courseId") ?? "") || null;
  const startAt = String(formData.get("startAt") ?? "").trim();
  const duration = Number(formData.get("duration") ?? 60) || 60;
  const joinUrl = String(formData.get("joinUrl") ?? "").trim();

  // Teachers can only schedule as themselves; admins pick the faculty.
  const teacherId =
    user.role === "admin"
      ? String(formData.get("teacherId") ?? "") || user.id
      : user.id;

  if (!title || !startAt) return;

  // Recurring: "weekly" creates N classes at 7-day intervals.
  const repeat = String(formData.get("repeat") ?? "none");
  const occurrences = Math.min(12, Math.max(1, Math.round(Number(formData.get("occurrences") ?? 1) || 1)));
  const count = repeat === "weekly" ? occurrences : 1;

  const base = new Date(startAt); // datetime-local value (no timezone)
  const insert = db.prepare(
    `INSERT INTO live_classes
       (id, title, subject, course_id, teacher_id, start_at, duration_min, join_url, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')`
  );
  db.transaction(() => {
    for (let i = 0; i < count; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + 7 * i);
      insert.run(newId(), title, subject, courseId, teacherId, d.toISOString(), duration, joinUrl);
    }
  })();

  // Notify the batch's students that class(es) were scheduled.
  if (courseId) {
    const students = (db.prepare("SELECT user_id FROM enrollments WHERE course_id = ?").all(courseId) as { user_id: string }[]).map((r) => r.user_id);
    const label = count > 1 ? `${count} sessions of ${title}` : `${title}${subject ? ` (${subject})` : ""}`;
    notifyMany(students, "class", "New live class scheduled", `${label} added to your timetable.`);
  }

  logAudit(user, count > 1 ? "Scheduled recurring class" : "Scheduled class", `${title}${count > 1 ? ` ×${count}` : ""}`);
  revalidatePath("/teacher/classes");
  revalidatePath("/admin/classes");
  revalidatePath("/");
}

function assertOwnerOrAdmin(classId: string, userId: string, role: string): ClassRow | null {
  const row = db
    .prepare("SELECT id, teacher_id, join_url FROM live_classes WHERE id = ?")
    .get(classId) as ClassRow | undefined;
  if (!row) return null;
  if (role !== "admin" && row.teacher_id !== userId) return null;
  return row;
}

/** Start / end / cancel a class. */
export async function setClassStatusAction(formData: FormData) {
  const user = await requireRole(["teacher", "admin"]);
  const classId = String(formData.get("classId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!STATUSES.includes(status)) return;
  if (!assertOwnerOrAdmin(classId, user.id, user.role)) return;

  const cls = db.prepare("SELECT title FROM live_classes WHERE id = ?").get(classId) as { title: string } | undefined;
  db.prepare("UPDATE live_classes SET status = ? WHERE id = ?").run(status, classId);
  logAudit(user, `Class ${status}`, cls?.title ?? classId);

  revalidatePath("/teacher/classes");
  revalidatePath("/admin/classes");
  revalidatePath("/");
}

/** Attach a recording link + notes after a class ends. */
export async function saveRecordingAction(formData: FormData) {
  const user = await requireRole(["teacher", "admin"]);
  const classId = String(formData.get("classId") ?? "");
  const recordingUrl = String(formData.get("recordingUrl") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (!assertOwnerOrAdmin(classId, user.id, user.role)) return;

  db.prepare(
    "UPDATE live_classes SET recording_url = ?, notes = ?, status = 'ended' WHERE id = ?"
  ).run(recordingUrl, notes, classId);

  revalidatePath("/teacher/classes");
  revalidatePath("/admin/classes");
  revalidatePath("/");
}

/** Delete a class (owner or admin). */
export async function deleteClassAction(formData: FormData) {
  const user = await requireRole(["teacher", "admin"]);
  const classId = String(formData.get("classId") ?? "");
  if (!assertOwnerOrAdmin(classId, user.id, user.role)) return;

  db.prepare("DELETE FROM live_classes WHERE id = ?").run(classId);

  revalidatePath("/teacher/classes");
  revalidatePath("/admin/classes");
  revalidatePath("/");
}

/**
 * Nudge a student whose attendance is low. In-app for now; a parent SMS/email
 * would fan out from the same notify() call once a provider is connected.
 */
export async function sendAttendanceReminderAction(formData: FormData) {
  await requireRole(["teacher", "admin"]);
  const userId = String(formData.get("userId") ?? "");
  const batch = String(formData.get("batch") ?? "your batch");
  const pct = String(formData.get("pct") ?? "");
  if (!userId) return;

  notify(userId, "class", "Attendance reminder",
    `Your attendance in ${batch} is ${pct}%. Please join upcoming live classes to stay on track.`);

  revalidatePath("/admin/attendance");
  revalidatePath("/teacher/attendance");
}

/**
 * A student joins a live class: record attendance. The client then opens the
 * embedded YouTube player in-app. Callable as `joinClassAction(id)`.
 */
export async function joinClassAction(classId: string) {
  const user = await requireRole(["student", "teacher", "admin"]);
  const exists = db.prepare("SELECT id FROM live_classes WHERE id = ?").get(classId);
  if (!exists) return;

  db.prepare(
    "INSERT OR IGNORE INTO class_attendance (class_id, user_id) VALUES (?, ?)"
  ).run(classId, user.id);

  revalidatePath("/");
}
