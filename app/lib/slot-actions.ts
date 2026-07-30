"use server";

import { revalidatePath } from "next/cache";
import { db, newId } from "./db";
import { requireRole } from "./auth";
import { notify } from "./notify";
import { fmtIST, datetimeLocalToUtcISO } from "./dates";

function fmtWhen(iso: string) {
  return fmtIST(iso, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
}

/**
 * Teacher/admin publishes one or more open 1:1 booking slots. `count` creates
 * back-to-back slots of `duration` minutes each, starting at `startAt`.
 */
export async function createSlotAction(formData: FormData) {
  const user = await requireRole(["teacher", "admin"]);
  const startAt = String(formData.get("startAt") ?? "").trim();
  const duration = Math.min(120, Math.max(10, Math.round(Number(formData.get("duration") ?? 30) || 30)));
  const count = Math.min(8, Math.max(1, Math.round(Number(formData.get("count") ?? 1) || 1)));
  if (!startAt) return;

  const base = new Date(datetimeLocalToUtcISO(startAt));
  const insert = await db.prepare(
    "INSERT INTO booking_slots (id, teacher_id, start_at, duration_min, status) VALUES (?, ?, ?, ?, 'open')"
  );
  for (let i = 0; i < count; i++) {
    const d = new Date(base.getTime() + i * duration * 60000);
    await insert.run(newId(), user.id, d.toISOString(), duration);
  }

  revalidatePath("/teacher/slots");
  revalidatePath("/admin/slots");
  revalidatePath("/");
}

/** Teacher/admin cancels a slot they own; a booked student is notified. */
export async function cancelSlotAction(formData: FormData) {
  const user = await requireRole(["teacher", "admin"]);
  const slotId = String(formData.get("slotId") ?? "");
  if (!slotId) return;

  const slot = (await db.prepare(
    "SELECT teacher_id, booked_by, start_at FROM booking_slots WHERE id = ? AND status != 'cancelled'"
  ).get(slotId)) as { teacher_id: string; booked_by: string | null; start_at: string } | undefined;
  if (!slot) return;
  if (user.role !== "admin" && slot.teacher_id !== user.id) return;

  await db.prepare("UPDATE booking_slots SET status='cancelled' WHERE id = ?").run(slotId);
  if (slot.booked_by) {
    await notify(slot.booked_by, "doubt", "Your 1:1 slot was cancelled", `The mentorship slot on ${fmtWhen(slot.start_at)} was cancelled. Please book another.`);
  }

  revalidatePath("/teacher/slots");
  revalidatePath("/admin/slots");
  revalidatePath("/");
}

/** A student books an open slot. The conditional UPDATE prevents double-booking. */
export async function bookSlotAction(slotId: string, topic: string): Promise<{ ok: boolean; error?: string }> {
  const user = await requireRole(["student"]);
  const id = String(slotId ?? "");
  const note = String(topic ?? "").trim().slice(0, 300);
  if (!id) return { ok: false, error: "Missing slot." };

  // Atomic guard: only succeeds while the slot is still open.
  const res = await db.prepare(
    "UPDATE booking_slots SET status='booked', booked_by=?, topic=? WHERE id=? AND status='open'"
  ).run(user.id, note, id);
  if (res.changes === 0) return { ok: false, error: "Sorry — that slot was just taken. Please pick another." };

  const slot = (await db.prepare("SELECT teacher_id, start_at FROM booking_slots WHERE id = ?").get(id)) as
    | { teacher_id: string; start_at: string }
    | undefined;
  if (slot) {
    await notify(slot.teacher_id, "doubt", "A student booked a 1:1 slot", `${user.name} booked your slot on ${fmtWhen(slot.start_at)}${note ? ` — “${note}”` : ""}.`);
  }

  revalidatePath("/teacher/slots");
  revalidatePath("/admin/slots");
  revalidatePath("/");
  return { ok: true };
}

/** A student cancels their own booking, releasing the slot back to open. */
export async function cancelBookingAction(slotId: string): Promise<{ ok: boolean; error?: string }> {
  const user = await requireRole(["student"]);
  const id = String(slotId ?? "");
  if (!id) return { ok: false, error: "Missing slot." };

  const slot = (await db.prepare(
    "SELECT teacher_id, start_at FROM booking_slots WHERE id = ? AND booked_by = ? AND status = 'booked'"
  ).get(id, user.id)) as { teacher_id: string; start_at: string } | undefined;
  if (!slot) return { ok: false, error: "That booking couldn't be found." };

  await db.prepare("UPDATE booking_slots SET status='open', booked_by=NULL, topic='' WHERE id = ?").run(id);
  await notify(slot.teacher_id, "doubt", "A 1:1 booking was cancelled", `${user.name} cancelled their slot on ${fmtWhen(slot.start_at)}.`);

  revalidatePath("/teacher/slots");
  revalidatePath("/admin/slots");
  revalidatePath("/");
  return { ok: true };
}
