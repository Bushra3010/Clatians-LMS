"use server";

import { revalidatePath } from "next/cache";
import { db, newId } from "@/app/lib/db";
import { requireRole } from "@/app/lib/auth";
import { saveUpload } from "@/app/lib/upload";

const CONTENT_TYPES = ["video", "notes", "practice", "current-affairs"];

/**
 * Teacher submits content. It enters the shared content table as `pending`,
 * which is exactly what the admin Content Approval queue reads.
 */
export async function createContentAction(formData: FormData) {
  const user = await requireRole(["teacher", "admin"]);

  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  let body = String(formData.get("body") ?? "").trim();
  const courseId = String(formData.get("courseId") ?? "") || null;

  if (!title || !CONTENT_TYPES.includes(type)) return;

  // An uploaded file becomes the content — its public URL overrides the pasted link.
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const url = await saveUpload(file);
    if (url) body = url;
  }

  db.prepare(
    `INSERT INTO content (id, title, type, body, status, author_id, course_id)
     VALUES (?, ?, ?, ?, 'pending', ?, ?)`
  ).run(newId(), title, type, body, user.id, courseId);

  revalidatePath("/teacher/content");
  revalidatePath("/teacher");
  // Surface it to the admin side immediately.
  revalidatePath("/admin/content");
  revalidatePath("/admin");
}

/** Teachers may withdraw their own submissions (any status). */
export async function deleteContentAction(formData: FormData) {
  const user = await requireRole(["teacher", "admin"]);
  const contentId = String(formData.get("contentId") ?? "");
  if (!contentId) return;

  db.prepare("DELETE FROM content WHERE id = ? AND author_id = ?").run(contentId, user.id);

  revalidatePath("/teacher/content");
  revalidatePath("/teacher");
  revalidatePath("/admin/content");
  revalidatePath("/admin");
}
