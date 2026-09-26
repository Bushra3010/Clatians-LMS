"use server";

import { revalidatePath } from "next/cache";
import { db, newId } from "@/app/lib/db";
import {
  requireAdmin,
  findUserByEmail,
  hashPassword,
  type Role,
} from "@/app/lib/auth";
import { notify } from "@/app/lib/notify";
import { logAudit } from "@/app/lib/audit";
import { isOurFileUrl } from "@/app/lib/storage";
import { awardReferralIfDue } from "@/app/lib/referral-server";
import { syncCatalog } from "@/app/lib/catalog/sync";

// ────────────────────────────────────────────────────────────
// User management
// ────────────────────────────────────────────────────────────
export async function createUserAction(formData: FormData) {
  const admin = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "student") as Role;
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) return;
  if (!["student", "teacher", "admin"].includes(role)) return;
  if (await findUserByEmail(email)) return; // email already exists — ignored silently

  await db.prepare(
    "INSERT INTO users (id, name, email, password, role, status) VALUES (?, ?, ?, ?, ?, 'active')"
  ).run(newId(), name, email, hashPassword(password), role);

  await logAudit(admin, "Created user", `${name} (${role})`);
  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

/**
 * Convert an admissions lead into a student account. Creates the user (unless
 * the email already exists), optionally enrolls them in a batch, and marks the
 * lead 'enrolled'. The admin sets the login password to share with the student.
 */
export async function convertLeadAction(formData: FormData) {
  const admin = await requireAdmin();
  const leadId = String(formData.get("leadId") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const courseId = String(formData.get("courseId") ?? "") || null;
  if (!leadId || !email || password.length < 6) return;

  const lead = await db.prepare("SELECT name FROM leads WHERE id = ?").get(leadId) as { name: string } | undefined;
  if (!lead) return;

  if (!(await findUserByEmail(email))) {
    await db.prepare(
      "INSERT INTO users (id, name, email, password, role, status) VALUES (?, ?, ?, ?, 'student', 'active')"
    ).run(newId(), lead.name, email, hashPassword(password));
  }

  const student = await findUserByEmail(email);
  if (student && courseId) {
    await db.prepare(
      "INSERT INTO enrollments (user_id, course_id) VALUES (?, ?) ON CONFLICT DO NOTHING"
    ).run(student.id, courseId);
  }

  await db.prepare("UPDATE leads SET status='enrolled' WHERE id = ?").run(leadId);
  await awardReferralIfDue(leadId); // referrer earns credit exactly once
  await logAudit(admin, "Converted lead to student", `${lead.name} (${email})`);
  revalidatePath("/admin/leads");
  revalidatePath("/admin/users");
  revalidatePath("/admin");
  revalidatePath("/");
}

/**
 * Create (or link) a parent/guardian account for a student. If the email
 * already belongs to a parent account, it's simply linked to this student too
 * (one parent can follow several children).
 */
export async function createParentAction(formData: FormData) {
  const admin = await requireAdmin();
  const studentId = String(formData.get("studentId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!studentId || !email) return;

  const student = await db.prepare("SELECT id, name FROM users WHERE id = ? AND role = 'student'").get(studentId) as { id: string; name: string } | undefined;
  if (!student) return;

  let parent = await findUserByEmail(email);
  if (!parent) {
    if (!name || password.length < 6) return; // creating anew needs name + password
    await db.prepare(
      "INSERT INTO users (id, name, email, password, role, status) VALUES (?, ?, ?, ?, 'parent', 'active')"
    ).run(newId(), name, email, hashPassword(password));
    parent = await findUserByEmail(email);
  }
  if (!parent || parent.role !== "parent") return; // never link a non-parent account

  await db.prepare(
    "INSERT INTO guardian_links (guardian_id, student_id) VALUES (?, ?) ON CONFLICT DO NOTHING"
  ).run(parent.id, studentId);

  await notify(parent.id, "info", "Guardian access ready", `You can now follow ${student.name}'s progress, attendance and fees on the parent portal.`);
  await logAudit(admin, "Linked parent to student", `${parent.name} → ${student.name}`);
  revalidatePath("/admin/users");
}

/** Edit a user's name and role. An admin can't demote their own account. */
export async function editUserAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "") as Role;
  if (!userId || !name || !["student", "teacher", "admin"].includes(role)) return;
  if (userId === admin.id && role !== "admin") return; // don't lock yourself out

  await db.prepare("UPDATE users SET name = ?, role = ? WHERE id = ?").run(name, role, userId);
  await logAudit(admin, "Edited user", `${name} → ${role}`);
  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

/** Reset a user's password. Signs them out everywhere (unless it's yourself). */
export async function resetUserPasswordAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!userId || password.length < 6) return;

  const target = await db.prepare("SELECT name FROM users WHERE id = ?").get(userId) as { name: string } | undefined;
  if (!target) return;

  await db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashPassword(password), userId);
  if (userId !== admin.id) {
    await db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId); // force re-login with the new password
  }
  await logAudit(admin, "Reset password", target.name);
  revalidatePath("/admin/users");
}

export async function setUserStatusAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["active", "suspended"].includes(status)) return;
  if (userId === admin.id) return; // never suspend yourself

  const target = await db.prepare("SELECT name FROM users WHERE id = ?").get(userId) as { name: string } | undefined;
  await db.prepare("UPDATE users SET status = ? WHERE id = ?").run(status, userId);
  if (status === "suspended") {
    await db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId); // force sign-out
  }
  await logAudit(admin, status === "suspended" ? "Suspended user" : "Reactivated user", target?.name ?? userId);
  revalidatePath("/admin/users");
}

// ────────────────────────────────────────────────────────────
// Course / batch management
// ────────────────────────────────────────────────────────────
export async function createCourseAction(formData: FormData) {
  const admin = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Math.max(0, Math.round(Number(formData.get("price") ?? 0) || 0));
  if (!name) return;

  await db.prepare(
    "INSERT INTO courses (id, name, description, status, price) VALUES (?, ?, ?, 'active', ?)"
  ).run(newId(), name, description, price);

  await logAudit(admin, "Created course", `${name}${price ? ` · ₹${price}` : " · free"}`);
  revalidatePath("/admin/courses");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function editCourseAction(formData: FormData) {
  const admin = await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Math.max(0, Math.round(Number(formData.get("price") ?? 0) || 0));
  if (!courseId || !name) return;

  const existing = await db.prepare("SELECT id FROM courses WHERE id = ?").get(courseId);
  if (!existing) return;

  await db.prepare(
    "UPDATE courses SET name = ?, description = ?, price = ? WHERE id = ?"
  ).run(name, description, price, courseId);

  await logAudit(admin, "Edited course", `${name}${price ? ` · ₹${price}` : " · free"}`);
  revalidatePath("/admin/courses");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function setCourseStatusAction(formData: FormData) {
  await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["active", "archived"].includes(status)) return;

  await db.prepare("UPDATE courses SET status = ? WHERE id = ?").run(status, courseId);
  revalidatePath("/admin/courses");
  revalidatePath("/");
}

export async function enrollStudentAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  if (!userId || !courseId) return;

  const res = await db.prepare(
    "INSERT INTO enrollments (user_id, course_id) VALUES (?, ?) ON CONFLICT DO NOTHING"
  ).run(userId, courseId);
  if (res.changes > 0) {
    const c = await db.prepare("SELECT name FROM courses WHERE id = ?").get(courseId) as { name: string } | undefined;
    await notify(userId, "info", "Enrolled in a batch", `You now have access to ${c?.name ?? "a new batch"} — its classes, notes and tests are unlocked.`);
  }
  revalidatePath("/admin/courses");
  revalidatePath("/");
}

/** Enroll many students into a batch at once. Notifies each newly-added student. */
export async function bulkEnrollAction(formData: FormData) {
  const admin = await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const userIds = formData.getAll("userIds").map(String).filter(Boolean).slice(0, 500);
  if (!courseId || userIds.length === 0) return;

  const course = await db.prepare("SELECT name FROM courses WHERE id = ?").get(courseId) as { name: string } | undefined;
  if (!course) return;

  let added = 0;
  for (const userId of userIds) {
    const res = await db.prepare(
      "INSERT INTO enrollments (user_id, course_id) VALUES (?, ?) ON CONFLICT DO NOTHING"
    ).run(userId, courseId);
    if (res.changes > 0) {
      added++;
      await notify(userId, "info", "Enrolled in a batch", `You now have access to ${course.name} — its classes, notes and tests are unlocked.`);
    }
  }

  await logAudit(admin, "Bulk enrolled students", `${added} student(s) → ${course.name}`);
  revalidatePath("/admin/courses");
  revalidatePath("/");
}

/**
 * Record a manual / offline fee payment (cash, cheque, bank transfer, UPI).
 * Creates a paid invoice and enrolls the student in the batch if not already.
 */
export async function recordPaymentAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const courseId = String(formData.get("courseId") ?? "") || null;
  const amount = Math.max(0, Math.round(Number(formData.get("amount") ?? 0) || 0));
  const method = String(formData.get("method") ?? "cash").trim() || "cash";
  if (!userId) return;

  const invoiceNo = "CLT-" + Date.now().toString().slice(-8);
  await db.prepare(
    `INSERT INTO payments (id, user_id, course_id, amount, status, method, invoice_no)
     VALUES (?, ?, ?, ?, 'paid', ?, ?)`
  ).run(newId(), userId, courseId, amount, method, invoiceNo);

  // A recorded fee usually means the student should have batch access.
  if (courseId) {
    await db.prepare(
      "INSERT INTO enrollments (user_id, course_id) VALUES (?, ?) ON CONFLICT DO NOTHING"
    ).run(userId, courseId);
  }

  await notify(userId, "payment", "Payment recorded", `Invoice ${invoiceNo} · ₹${amount.toLocaleString("en-IN")} (${method}) recorded by the office.`);
  await logAudit(admin, "Recorded payment", `${invoiceNo} · ₹${amount} · ${method}`);
  revalidatePath("/admin/payments");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function unenrollStudentAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  if (!userId || !courseId) return;

  await db.prepare("DELETE FROM enrollments WHERE user_id = ? AND course_id = ?").run(userId, courseId);
  await logAudit(admin, "Removed enrollment", `student ${userId} from course ${courseId}`);
  revalidatePath("/admin/courses");
  revalidatePath("/");
}

// ────────────────────────────────────────────────────────────
// Content approval
// ────────────────────────────────────────────────────────────
/** Approve or reject many content items at once. Notifies each author. */
export async function bulkSetContentStatusAction(ids: string[], status: string) {
  const admin = await requireAdmin();
  if (!["approved", "rejected", "pending"].includes(status)) return;
  const list = (Array.isArray(ids) ? ids : []).map(String).filter(Boolean).slice(0, 200);
  if (list.length === 0) return;

  for (const id of list) {
    const item = await db.prepare("SELECT title, author_id FROM content WHERE id = ?").get(id) as { title: string; author_id: string | null } | undefined;
    if (!item) continue;
    await db.prepare("UPDATE content SET status = ? WHERE id = ?").run(status, id);
    if (item.author_id && (status === "approved" || status === "rejected")) {
      await notify(
        item.author_id,
        "content",
        status === "approved" ? "Content approved" : "Content needs changes",
        status === "approved" ? `“${item.title}” is now live for students.` : `“${item.title}” was sent back for changes.`
      );
    }
  }

  await logAudit(admin, `Bulk content ${status}`, `${list.length} item(s)`);
  revalidatePath("/admin/content");
  revalidatePath("/");
}

export async function setContentStatusAction(formData: FormData) {
  const admin = await requireAdmin();
  const contentId = String(formData.get("contentId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["pending", "approved", "rejected"].includes(status)) return;

  const item = await db.prepare("SELECT title, author_id FROM content WHERE id = ?").get(contentId) as { title: string; author_id: string | null } | undefined;

  await db.prepare("UPDATE content SET status = ? WHERE id = ?").run(status, contentId);
  if (item) await logAudit(admin, `Content ${status}`, item.title);

  if (item?.author_id && (status === "approved" || status === "rejected")) {
    await notify(
      item.author_id,
      "content",
      status === "approved" ? "Content approved" : "Content needs changes",
      status === "approved" ? `“${item.title}” is now live for students.` : `“${item.title}” was sent back for changes.`
    );
  }

  revalidatePath("/admin/content");
  revalidatePath("/admin");
  revalidatePath("/teacher");
}

// ────────────────────────────────────────────────────────────
// Catalog — courses, batches, subjects and faculty mirrored from the website.
// These are the FormData server actions the admin panel's forms post to;
// app/lib/course-actions.ts holds the typed helpers used by server components.
// ────────────────────────────────────────────────────────────

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** Pull the website's catalog into the LMS. Safe to run repeatedly. */
export async function syncCatalogAction() {
  const admin = await requireAdmin();
  const result = await syncCatalog();
  await logAudit(
    admin,
    "Synced catalog",
    `${result.courses} courses · ${result.batches} batches · from ${result.source}`
  );
  revalidatePath("/admin/courses");
  revalidatePath("/admin/batches");
  revalidatePath("/admin");
  revalidatePath("/");
}

// ── Batches ─────────────────────────────────────────────────

export async function createBatchAction(formData: FormData) {
  const admin = await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!courseId || !name) return;

  const course = await db.prepare("SELECT id FROM courses WHERE id = ?").get(courseId);
  if (!course) return;

  // Batch slugs are unique; suffix if the obvious one is taken.
  const base = slugify(name) || "batch";
  let slug = base;
  for (let i = 2; await db.prepare("SELECT 1 FROM batches WHERE slug = ?").get(slug); i++) {
    slug = `${base}-${i}`;
  }

  await db.prepare(
    `INSERT INTO batches (id, slug, name, course_id, category, exam, batch_code,
       start_date, end_date, duration, schedule, mode, seats, fee, original_fee,
       emi, offer, status, language, batch_type, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    newId(), slug, name, courseId,
    String(formData.get("category") ?? "offline"),
    String(formData.get("exam") ?? "").trim(),
    String(formData.get("batchCode") ?? "").trim(),
    String(formData.get("startDate") ?? ""),
    String(formData.get("endDate") ?? ""),
    String(formData.get("duration") ?? "").trim(),
    String(formData.get("schedule") ?? "").trim(),
    String(formData.get("mode") ?? "").trim(),
    Math.max(0, Math.round(Number(formData.get("seats") ?? 30) || 0)),
    Math.max(0, Math.round(Number(formData.get("fee") ?? 0) || 0)),
    Math.max(0, Math.round(Number(formData.get("originalFee") ?? 0) || 0)),
    String(formData.get("emi") ?? "").trim(),
    String(formData.get("offer") ?? "").trim(),
    String(formData.get("status") ?? "upcoming"),
    String(formData.get("language") ?? "Hinglish"),
    String(formData.get("batchType") ?? "").trim(),
    String(formData.get("description") ?? "").trim(),
  );

  await logAudit(admin, "Created batch", name);
  revalidatePath("/admin/batches");
  revalidatePath("/admin/courses");
  revalidatePath("/");
}

export async function editBatchAction(formData: FormData) {
  const admin = await requireAdmin();
  const batchId = String(formData.get("batchId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!batchId || !name) return;

  await db.prepare(
    `UPDATE batches SET name = ?, start_date = ?, end_date = ?, duration = ?, schedule = ?,
       mode = ?, seats = ?, fee = ?, original_fee = ?, emi = ?, offer = ?,
       language = ?, batch_type = ?, description = ?
     WHERE id = ?`
  ).run(
    name,
    String(formData.get("startDate") ?? ""),
    String(formData.get("endDate") ?? ""),
    String(formData.get("duration") ?? "").trim(),
    String(formData.get("schedule") ?? "").trim(),
    String(formData.get("mode") ?? "").trim(),
    Math.max(0, Math.round(Number(formData.get("seats") ?? 0) || 0)),
    Math.max(0, Math.round(Number(formData.get("fee") ?? 0) || 0)),
    Math.max(0, Math.round(Number(formData.get("originalFee") ?? 0) || 0)),
    String(formData.get("emi") ?? "").trim(),
    String(formData.get("offer") ?? "").trim(),
    String(formData.get("language") ?? "Hinglish"),
    String(formData.get("batchType") ?? "").trim(),
    String(formData.get("description") ?? "").trim(),
    batchId,
  );

  await logAudit(admin, "Edited batch", name);
  revalidatePath("/admin/batches");
  revalidatePath("/");
}

export async function setBatchStatusAction(formData: FormData) {
  await requireAdmin();
  const batchId = String(formData.get("batchId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!batchId || !["upcoming", "ongoing", "filling-fast", "archived"].includes(status)) return;

  await db.prepare("UPDATE batches SET status = ? WHERE id = ?").run(status, batchId);
  revalidatePath("/admin/batches");
  revalidatePath("/");
}

export async function deleteBatchAction(formData: FormData) {
  const admin = await requireAdmin();
  const batchId = String(formData.get("batchId") ?? "");
  if (!batchId) return;

  const batch = await db.prepare("SELECT name FROM batches WHERE id = ?").get(batchId) as { name: string } | undefined;
  // Students already in the batch keep their course access — only the cohort goes.
  await db.prepare("DELETE FROM batches WHERE id = ?").run(batchId);
  if (batch) await logAudit(admin, "Deleted batch", batch.name);

  revalidatePath("/admin/batches");
  revalidatePath("/");
}

// ── Subjects ────────────────────────────────────────────────

export async function createSubjectAction(formData: FormData) {
  const admin = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const slug = slugify(String(formData.get("slug") ?? "") || name);
  if (!slug) return;
  if (await db.prepare("SELECT 1 FROM subjects WHERE slug = ?").get(slug)) return;

  const max = await db.prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM subjects").get() as { m: number };
  await db.prepare(
    "INSERT INTO subjects (id, name, slug, description, icon, color, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(
    newId(), name, slug,
    String(formData.get("description") ?? "").trim(),
    String(formData.get("icon") ?? "").trim() || "📖",
    String(formData.get("color") ?? "").trim() || "var(--blue-dark)",
    max.m + 1,
  );

  await logAudit(admin, "Created subject", name);
  revalidatePath("/admin/subjects");
}

export async function deleteSubjectAction(formData: FormData) {
  const admin = await requireAdmin();
  const subjectId = String(formData.get("subjectId") ?? "");
  if (!subjectId) return;

  const subject = await db.prepare("SELECT name FROM subjects WHERE id = ?").get(subjectId) as { name: string } | undefined;
  await db.prepare("DELETE FROM subjects WHERE id = ?").run(subjectId);
  if (subject) await logAudit(admin, "Deleted subject", subject.name);

  revalidatePath("/admin/subjects");
}

// ── Faculty ─────────────────────────────────────────────────

export async function createFacultyAction(formData: FormData) {
  const admin = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const max = await db.prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM faculty").get() as { m: number };
  await db.prepare(
    `INSERT INTO faculty (id, name, designation, subject, specialization, experience, avatar, bio, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    newId(), name,
    String(formData.get("designation") ?? "").trim(),
    String(formData.get("subject") ?? "").trim(),
    String(formData.get("specialization") ?? "").trim(),
    String(formData.get("experience") ?? "").trim(),
    // Fall back to initials, which is what the website's avatar field holds.
    String(formData.get("avatar") ?? "").trim() ||
      name.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w)).map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
    String(formData.get("bio") ?? "").trim(),
    max.m + 1,
  );

  await logAudit(admin, "Added faculty", name);
  revalidatePath("/admin/faculty");
}

export async function deleteFacultyAction(formData: FormData) {
  const admin = await requireAdmin();
  const facultyId = String(formData.get("facultyId") ?? "");
  if (!facultyId) return;

  const f = await db.prepare("SELECT name FROM faculty WHERE id = ?").get(facultyId) as { name: string } | undefined;
  await db.prepare("DELETE FROM faculty WHERE id = ?").run(facultyId);
  if (f) await logAudit(admin, "Removed faculty", f.name);

  revalidatePath("/admin/faculty");
}

// ── Course syllabus: modules → chapters → lessons ───────────

export async function createModuleAction(formData: FormData) {
  await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const subjectId = String(formData.get("subjectId") ?? "") || null;
  // A course's subject block is titled after its subject unless named otherwise.
  const subject = subjectId
    ? await db.prepare("SELECT name FROM subjects WHERE id = ?").get(subjectId) as { name: string } | undefined
    : undefined;
  const title = String(formData.get("title") ?? "").trim() || subject?.name || "";
  if (!courseId || !title) return;

  const max = await db.prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM modules WHERE course_id = ?").get(courseId) as { m: number };
  await db.prepare(
    "INSERT INTO modules (id, course_id, subject_id, title, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(
    newId(), courseId,
    subjectId,
    title,
    String(formData.get("description") ?? "").trim(),
    max.m + 1,
  );
  revalidatePath(`/admin/courses/${courseId}/syllabus`);
}

export async function createChapterAction(formData: FormData) {
  await requireAdmin();
  const moduleId = String(formData.get("moduleId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!moduleId || !title) return;

  const max = await db.prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM chapters WHERE module_id = ?").get(moduleId) as { m: number };
  await db.prepare(
    "INSERT INTO chapters (id, module_id, title, description, sort_order) VALUES (?, ?, ?, ?, ?)"
  ).run(newId(), moduleId, title, String(formData.get("description") ?? "").trim(), max.m + 1);
  revalidatePath(`/admin/courses/${courseId}/syllabus`);
}

/** Topic fields shared by create and edit. A blank test id means "no test". */
function topicFields(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    videoUrl: String(formData.get("videoUrl") ?? "").trim(),
    body: String(formData.get("body") ?? "").trim(),
    // A freshly uploaded notes file wins over a pasted link.
    notesUrl: (() => {
      const uploaded = String(formData.get("notesFileUrl") ?? "").trim();
      return uploaded && isOurFileUrl(uploaded) ? uploaded : String(formData.get("notesUrl") ?? "").trim();
    })(),
    testId: String(formData.get("testId") ?? "") || null,
    durationMin: Math.max(0, Math.round(Number(formData.get("durationMin") ?? 0) || 0)),
    isFree: formData.get("isFree") ? 1 : 0,
  };
}

/** A topic (stored as a `lessons` row): video + notes + test, all optional. */
export async function createLessonAction(formData: FormData) {
  await requireAdmin();
  const chapterId = String(formData.get("chapterId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const f = topicFields(formData);
  if (!chapterId || !f.title) return;

  const max = await db.prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM lessons WHERE chapter_id = ?").get(chapterId) as { m: number };
  await db.prepare(
    `INSERT INTO lessons (id, chapter_id, title, type, body, video_url, notes_url, test_id, duration_min, is_free, sort_order)
     VALUES (?, ?, ?, 'topic', ?, ?, ?, ?, ?, ?, ?)`
  ).run(newId(), chapterId, f.title, f.body, f.videoUrl, f.notesUrl, f.testId, f.durationMin, f.isFree, max.m + 1);
  revalidatePath(`/admin/courses/${courseId}/syllabus`);
  revalidatePath("/");
}

export async function updateLessonAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const f = topicFields(formData);
  if (!id || !f.title) return;

  await db.prepare(
    `UPDATE lessons SET title = ?, body = ?, video_url = ?, notes_url = ?, test_id = ?, duration_min = ?, is_free = ?
     WHERE id = ?`
  ).run(f.title, f.body, f.videoUrl, f.notesUrl, f.testId, f.durationMin, f.isFree, id);
  revalidatePath(`/admin/courses/${courseId}/syllabus`);
  revalidatePath("/");
}

export async function deleteSyllabusNodeAction(formData: FormData) {
  await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const kind = String(formData.get("kind") ?? "");
  const id = String(formData.get("id") ?? "");
  const table = { module: "modules", chapter: "chapters", lesson: "lessons" }[kind];
  if (!table || !id) return;

  // Children cascade via the schema's ON DELETE CASCADE.
  await db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
  revalidatePath(`/admin/courses/${courseId}/syllabus`);
}

/** Put a student into a batch by hand (admin-side counterpart of checkout). */
export async function enrollBatchStudentAction(formData: FormData) {
  const admin = await requireAdmin();
  const batchId = String(formData.get("batchId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (!batchId || !userId) return;

  const batch = await db.prepare(
    "SELECT id, name, course_id, fee FROM batches WHERE id = ?"
  ).get(batchId) as { id: string; name: string; course_id: string | null; fee: number } | undefined;
  if (!batch) return;

  const already = await db.prepare(
    "SELECT 1 FROM batch_enrollments WHERE batch_id = ? AND user_id = ?"
  ).get(batchId, userId);
  if (already) return;

  await db.prepare(
    "INSERT INTO batch_enrollments (id, batch_id, user_id, enrolled_by, amount, status) VALUES (?, ?, ?, ?, 0, 'active')"
  ).run(newId(), batchId, userId, admin.id);
  await db.prepare("UPDATE batches SET filled = filled + 1 WHERE id = ?").run(batchId);

  // Access is gated on the course, so joining a batch grants the course too.
  if (batch.course_id) {
    await db.prepare(
      "INSERT INTO enrollments (user_id, course_id) VALUES (?, ?) ON CONFLICT DO NOTHING"
    ).run(userId, batch.course_id);
  }

  await notify(userId, "announcement", "Added to a batch", `You've been enrolled in ${batch.name}.`);
  await logAudit(admin, "Enrolled student in batch", batch.name);
  revalidatePath(`/admin/batches/${batchId}/enrollments`);
  revalidatePath("/admin/batches");
  revalidatePath("/");
}

/** Remove a student from a batch. Their course access is left untouched. */
export async function unenrollBatchStudentAction(formData: FormData) {
  const admin = await requireAdmin();
  const batchId = String(formData.get("batchId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (!batchId || !userId) return;

  const removed = await db.prepare(
    "DELETE FROM batch_enrollments WHERE batch_id = ? AND user_id = ?"
  ).run(batchId, userId);
  if (removed.changes > 0) {
    await db.prepare("UPDATE batches SET filled = GREATEST(filled - 1, 0) WHERE id = ?").run(batchId);
    await logAudit(admin, "Removed student from batch", batchId);
  }

  revalidatePath(`/admin/batches/${batchId}/enrollments`);
  revalidatePath("/admin/batches");
}
