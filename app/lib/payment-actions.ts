"use server";

import { revalidatePath } from "next/cache";
import { db, newId } from "./db";
import { requireRole } from "./auth";
import { notify } from "./notify";

type Course = { id: string; price: number };

/**
 * Enrol the current student into a batch. Paid batches go through a SIMULATED
 * payment (test-mode) — swap this for a real gateway's verify webhook later.
 * On success we record an invoice and create the enrollment, which is what
 * unlocks the batch's content, live classes and attendance.
 */
export async function payForCourseAction(courseId: string, method = "upi") {
  const user = await requireRole(["student"]);

  const course = db
    .prepare("SELECT id, price FROM courses WHERE id = ? AND status = 'active'")
    .get(courseId) as Course | undefined;
  if (!course) return { ok: false, error: "This batch is not available." };

  const already = db
    .prepare("SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?")
    .get(user.id, courseId);
  if (already) return { ok: false, error: "You are already enrolled in this batch." };

  // ── Simulated payment authorization ──
  // A real integration would create an order, redirect to the gateway, and
  // confirm via webhook/signature before this point. Here we treat it as paid.
  const invoiceNo = "CLT-" + Date.now().toString().slice(-8);

  const enrol = db.transaction(() => {
    if (course.price > 0) {
      db.prepare(
        `INSERT INTO payments (id, user_id, course_id, amount, status, method, invoice_no)
         VALUES (?, ?, ?, ?, 'paid', ?, ?)`
      ).run(newId(), user.id, courseId, course.price, method, invoiceNo);
    }
    db.prepare(
      "INSERT OR IGNORE INTO enrollments (user_id, course_id) VALUES (?, ?)"
    ).run(user.id, courseId);
  });
  enrol();

  notify(
    user.id,
    "payment",
    course.price > 0 ? "Payment successful" : "Enrolled",
    course.price > 0
      ? `Invoice ${invoiceNo} · ₹${course.price.toLocaleString("en-IN")}. Your batch is now unlocked.`
      : "Your free batch is now unlocked."
  );

  revalidatePath("/");
  return { ok: true, invoiceNo, amount: course.price };
}
