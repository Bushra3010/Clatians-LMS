"use server";

import { revalidatePath } from "next/cache";
import { db, newId } from "./db";
import { requireRole } from "./auth";
import { notifyMany } from "./notify";
import { logAudit } from "./audit";

export type LeadState = { ok?: boolean; error?: string };

const STATUSES = ["new", "contacted", "demo", "enrolled", "lost"];

/**
 * PUBLIC — anyone can submit an enquiry (no auth). A production build would add
 * rate-limiting / captcha here to prevent spam.
 */
export async function createLeadAction(_prev: LeadState, formData: FormData): Promise<LeadState> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const interest = String(formData.get("interest") ?? "").trim();
  const demoDate = String(formData.get("demoDate") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !phone) return { error: "Please enter your name and phone number." };

  await db.prepare(
    `INSERT INTO leads (id, name, phone, email, interest, demo_date, message, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(newId(), name, phone, email, interest, demoDate, message, demoDate ? "demo" : "new");

  // Alert admins about the new enquiry.
  const admins = (await db.prepare("SELECT id FROM users WHERE role='admin'").all() as { id: string }[]).map((a) => a.id);
  await notifyMany(admins, "info", "New enquiry", `${name} is interested in ${interest || "your courses"}.`);

  revalidatePath("/admin/leads");
  return { ok: true };
}

export async function updateLeadStatusAction(formData: FormData) {
  const admin = await requireRole(["admin"]);
  const id = String(formData.get("leadId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !STATUSES.includes(status)) return;
  const lead = await db.prepare("SELECT name FROM leads WHERE id=?").get(id) as { name: string } | undefined;
  await db.prepare("UPDATE leads SET status=?, updated_at=to_char((now() at time zone 'utc'), 'YYYY-MM-DD HH24:MI:SS') WHERE id=?").run(status, id);
  await logAudit(admin, "Updated lead status", `${lead?.name ?? id} → ${status}`);
  revalidatePath("/admin/leads");
}

export async function saveLeadNoteAction(formData: FormData) {
  await requireRole(["admin"]);
  const id = String(formData.get("leadId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  if (!id) return;
  await db.prepare("UPDATE leads SET notes=?, updated_at=to_char((now() at time zone 'utc'), 'YYYY-MM-DD HH24:MI:SS') WHERE id=?").run(notes, id);
  revalidatePath("/admin/leads");
}

export async function deleteLeadAction(formData: FormData) {
  await requireRole(["admin"]);
  const id = String(formData.get("leadId") ?? "");
  await db.prepare("DELETE FROM leads WHERE id=?").run(id);
  revalidatePath("/admin/leads");
}
