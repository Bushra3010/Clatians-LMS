"use server";

import { revalidatePath } from "next/cache";
import { db } from "./db";
import { requireRole, auth } from "./auth";
import { notifyMany } from "./notify";
import { logAudit } from "./audit";

/** Student marks all their notifications as read (called when the inbox opens). */
export async function markNotificationsReadAction() {
  const user = await auth();
  if (!user) return;
  db.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0").run(user.id);
  revalidatePath("/");
}

/** Admin broadcasts an announcement to all students, or one batch. */
export async function broadcastAnnouncementAction(formData: FormData) {
  const admin = await requireRole(["admin"]);
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const courseId = String(formData.get("courseId") ?? "");
  if (!title) return;

  const recipients = courseId
    ? (db.prepare("SELECT user_id FROM enrollments WHERE course_id = ?").all(courseId) as { user_id: string }[]).map((r) => r.user_id)
    : (db.prepare("SELECT id FROM users WHERE role = 'student' AND status = 'active'").all() as { id: string }[]).map((r) => r.id);

  notifyMany(recipients, "announcement", title, body);

  logAudit(admin, "Sent announcement", `${title} → ${recipients.length} student(s)`);
  revalidatePath("/admin/announcements");
  revalidatePath("/");
}
