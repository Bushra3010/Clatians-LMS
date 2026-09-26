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

  const course = await db
    .prepare("SELECT id, price FROM courses WHERE id = ? AND status = 'active'")
    .get(courseId) as Course | undefined;
  if (!course) return { ok: false, error: "This batch is not available." };

  const already = await db
    .prepare("SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?")
    .get(user.id, courseId);
  if (already) return { ok: false, error: "You are already enrolled in this batch." };

  // ── Simulated payment authorization ──
  // A real integration would create an order, redirect to the gateway, and
  // confirm via webhook/signature before this point. Here we treat it as paid.
  const invoiceNo = "CLT-" + Date.now().toString().slice(-8);

  // The invoice records exactly what checkout showed: price + 18% GST,
  // minus any referral credit.
  let discount = 0;
  let amount = course.price;
  if (course.price > 0) {
    const gross = course.price + Math.round(course.price * 0.18); // matches the checkout GST line
    const row = await db.prepare("SELECT referral_credit FROM users WHERE id = ?").get(user.id) as { referral_credit: number } | undefined;
    discount = Math.min(row?.referral_credit ?? 0, gross);
    amount = gross - discount;
    if (discount > 0) {
      await db.prepare("UPDATE users SET referral_credit = referral_credit - ? WHERE id = ?").run(discount, user.id);
    }
    await db.prepare(
      `INSERT INTO payments (id, user_id, course_id, amount, status, method, invoice_no)
       VALUES (?, ?, ?, ?, 'paid', ?, ?)`
    ).run(newId(), user.id, courseId, amount, method, invoiceNo);
  }
  await db.prepare(
    "INSERT INTO enrollments (user_id, course_id) VALUES (?, ?) ON CONFLICT DO NOTHING"
  ).run(user.id, courseId);

  await notify(
    user.id,
    "payment",
    course.price > 0 ? "Payment successful" : "Enrolled",
    course.price > 0
      ? `Invoice ${invoiceNo} · ₹${amount.toLocaleString("en-IN")}${discount > 0 ? ` (₹${discount.toLocaleString("en-IN")} referral credit applied)` : ""}. Your batch is now unlocked.`
      : "Your free batch is now unlocked."
  );

  revalidatePath("/");
  return { ok: true, invoiceNo, amount, discount };
}

type BatchRow = { id: string; name: string; course_id: string | null; fee: number; seats: number; filled: number };

/**
 * Enrol the current student into a specific batch of a course — the same
 * simulated payment as payForCourseAction, but charged at the batch's fee.
 *
 * Access in the LMS is gated on `enrollments(user_id, course_id)`: content,
 * live classes, tests and attendance all key off the course. So joining a
 * batch also enrols the student in the batch's parent course, and the batch
 * row records which cohort they're actually in.
 */
export async function payForBatchAction(batchId: string, method = "upi") {
  const user = await requireRole(["student"]);

  const batch = await db
    .prepare("SELECT id, name, course_id, fee, seats, filled FROM batches WHERE id = ?")
    .get(batchId) as BatchRow | undefined;
  if (!batch) return { ok: false as const, error: "This batch is not available." };
  if (!batch.course_id) return { ok: false as const, error: "This batch isn't linked to a course yet." };
  if (batch.seats > 0 && batch.filled >= batch.seats) {
    return { ok: false as const, error: "This batch is full." };
  }

  const already = await db
    .prepare("SELECT 1 FROM batch_enrollments WHERE user_id = ? AND batch_id = ?")
    .get(user.id, batchId);
  if (already) return { ok: false as const, error: "You are already enrolled in this batch." };

  const invoiceNo = "CLT-" + Date.now().toString().slice(-8);
  let discount = 0;
  let amount = batch.fee;

  if (batch.fee > 0) {
    const gross = batch.fee + Math.round(batch.fee * 0.18); // matches the checkout GST line
    const row = await db.prepare("SELECT referral_credit FROM users WHERE id = ?").get(user.id) as { referral_credit: number } | undefined;
    discount = Math.min(row?.referral_credit ?? 0, gross);
    amount = gross - discount;
    if (discount > 0) {
      await db.prepare("UPDATE users SET referral_credit = referral_credit - ? WHERE id = ?").run(discount, user.id);
    }
    await db.prepare(
      `INSERT INTO payments (id, user_id, course_id, amount, status, method, invoice_no)
       VALUES (?, ?, ?, ?, 'paid', ?, ?)`
    ).run(newId(), user.id, batch.course_id, amount, method, invoiceNo);
  }

  await db.prepare(
    `INSERT INTO batch_enrollments (id, batch_id, user_id, amount, status)
     VALUES (?, ?, ?, ?, 'active')`
  ).run(newId(), batchId, user.id, amount);
  await db.prepare("UPDATE batches SET filled = filled + 1 WHERE id = ?").run(batchId);
  await db.prepare(
    "INSERT INTO enrollments (user_id, course_id) VALUES (?, ?) ON CONFLICT DO NOTHING"
  ).run(user.id, batch.course_id);

  await notify(
    user.id,
    "payment",
    batch.fee > 0 ? "Payment successful" : "Enrolled",
    batch.fee > 0
      ? `Invoice ${invoiceNo} · ₹${amount.toLocaleString("en-IN")} for ${batch.name}${discount > 0 ? ` (₹${discount.toLocaleString("en-IN")} referral credit applied)` : ""}. Your batch is now unlocked.`
      : `${batch.name} is now unlocked.`
  );

  revalidatePath("/");
  return { ok: true as const, invoiceNo, amount, discount };
}
