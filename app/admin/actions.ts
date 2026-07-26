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
  if (findUserByEmail(email)) return; // email already exists — ignored silently

  db.prepare(
    "INSERT INTO users (id, name, email, password, role, status) VALUES (?, ?, ?, ?, ?, 'active')"
  ).run(newId(), name, email, hashPassword(password), role);

  logAudit(admin, "Created user", `${name} (${role})`);
  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

export async function setUserStatusAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["active", "suspended"].includes(status)) return;
  if (userId === admin.id) return; // never suspend yourself

  const target = db.prepare("SELECT name FROM users WHERE id = ?").get(userId) as { name: string } | undefined;
  db.prepare("UPDATE users SET status = ? WHERE id = ?").run(status, userId);
  if (status === "suspended") {
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId); // force sign-out
  }
  logAudit(admin, status === "suspended" ? "Suspended user" : "Reactivated user", target?.name ?? userId);
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

  db.prepare(
    "INSERT INTO courses (id, name, description, status, price) VALUES (?, ?, ?, 'active', ?)"
  ).run(newId(), name, description, price);

  logAudit(admin, "Created course", `${name}${price ? ` · ₹${price}` : " · free"}`);
  revalidatePath("/admin/courses");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function setCourseStatusAction(formData: FormData) {
  await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["active", "archived"].includes(status)) return;

  db.prepare("UPDATE courses SET status = ? WHERE id = ?").run(status, courseId);
  revalidatePath("/admin/courses");
}

export async function enrollStudentAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  if (!userId || !courseId) return;

  db.prepare(
    "INSERT OR IGNORE INTO enrollments (user_id, course_id) VALUES (?, ?)"
  ).run(userId, courseId);
  revalidatePath("/admin/courses");
}

// ────────────────────────────────────────────────────────────
// Content approval
// ────────────────────────────────────────────────────────────
export async function setContentStatusAction(formData: FormData) {
  const admin = await requireAdmin();
  const contentId = String(formData.get("contentId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["pending", "approved", "rejected"].includes(status)) return;

  const item = db.prepare("SELECT title, author_id FROM content WHERE id = ?").get(contentId) as { title: string; author_id: string | null } | undefined;

  db.prepare("UPDATE content SET status = ? WHERE id = ?").run(status, contentId);
  if (item) logAudit(admin, `Content ${status}`, item.title);

  if (item?.author_id && (status === "approved" || status === "rejected")) {
    notify(
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
