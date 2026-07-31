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
  await logAudit(admin, "Converted lead to student", `${lead.name} (${email})`);
  revalidatePath("/admin/leads");
  revalidatePath("/admin/users");
  revalidatePath("/admin");
  revalidatePath("/");
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
