"use server";

import { revalidatePath } from "next/cache";
import { db, newId } from "@/app/lib/db";
import { requireRole } from "@/app/lib/auth";
import { saveUpload } from "@/app/lib/upload";
import { isOurFileUrl } from "@/app/lib/storage";
import { CLAT_SUBJECTS } from "@/app/lib/subjects";

const CONTENT_TYPES = ["video", "notes", "practice", "current-affairs"];
/** Free Resources files material under its CLAT section, so one is recorded here. */
const SUBJECTS = CLAT_SUBJECTS.map((s) => s.name);

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
  const picked = String(formData.get("subject") ?? "").trim();
  // Anything unrecognised is left blank, and the app falls back to the title.
  const subject = SUBJECTS.includes(picked) ? picked : "";
  // Free-text topic inside the section; Free Resources lists a subject topic-wise.
  const topic = String(formData.get("topic") ?? "").trim().slice(0, 120);

  if (!title || !CONTENT_TYPES.includes(type)) return;

  // An uploaded file becomes the content — its public URL overrides the pasted
  // link. Normally the browser has already uploaded it straight to storage and
  // sends just the URL; a raw file only arrives when storage isn't configured.
  const fileUrl = String(formData.get("fileUrl") ?? "").trim();
  const file = formData.get("file");
  if (fileUrl && isOurFileUrl(fileUrl)) {
    body = fileUrl;
  } else if (file instanceof File && file.size > 0) {
    const url = await saveUpload(file);
    if (url) body = url;
  }

  await db.prepare(
    `INSERT INTO content (id, title, type, body, subject, topic, status, author_id, course_id)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
  ).run(newId(), title, type, body, subject, topic, user.id, courseId);

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

  await db.prepare("DELETE FROM content WHERE id = ? AND author_id = ?").run(contentId, user.id);

  revalidatePath("/teacher/content");
  revalidatePath("/teacher");
  revalidatePath("/admin/content");
  revalidatePath("/admin");
}
