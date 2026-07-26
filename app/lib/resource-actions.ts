"use server";

import { revalidatePath } from "next/cache";
import { db, newId } from "./db";
import { requireRole } from "./auth";
import { logAudit } from "./audit";

const TYPES = ["tip", "story", "update", "vocab", "caq", "nlu"];

/** Assemble the type-specific `data` JSON from a submitted form. */
function buildData(type: string, title: string, formData: FormData): Record<string, unknown> {
  if (type === "tip") return {
    tag: String(formData.get("tag") ?? "").trim(),
    icon: String(formData.get("icon") ?? "💡").trim() || "💡",
    color: "#3D2411",
    points: String(formData.get("points") ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
  };
  if (type === "story") return {
    college: String(formData.get("college") ?? "").trim(),
    rank: String(formData.get("rank") ?? "").trim(),
    initials: title.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
    color: "#3D2411",
  };
  if (type === "update") return {
    tag: String(formData.get("tag") ?? "").trim(),
    icon: String(formData.get("icon") ?? "✨").trim() || "✨",
    color: "#0891B2",
    dateLabel: String(formData.get("dateLabel") ?? "").trim() || "New",
    more: String(formData.get("more") ?? "").trim(),
    hot: formData.get("hot") ? 1 : 0,
  };
  if (type === "vocab") return { example: String(formData.get("example") ?? "").trim() };
  if (type === "nlu") {
    const num = (k: string) => Math.max(0, Math.round(Number(formData.get(k) ?? 0) || 0));
    return { city: String(formData.get("city") ?? "").trim(), general: num("general"), obc: num("obc"), ews: num("ews"), sc: num("sc"), st: num("st") };
  }
  if (type === "caq") return {
    options: [
      String(formData.get("optA") ?? "").trim(),
      String(formData.get("optB") ?? "").trim(),
      String(formData.get("optC") ?? "").trim(),
      String(formData.get("optD") ?? "").trim(),
    ],
    correct: Math.min(3, Math.max(0, Number(formData.get("correct") ?? 0) || 0)),
    explain: String(formData.get("explain") ?? "").trim(),
  };
  return {};
}

/** Create an editorial resource (tip / success story / update / vocab / CA question). */
export async function createResourceAction(formData: FormData) {
  const user = await requireRole(["teacher", "admin"]);
  const type = String(formData.get("type") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!TYPES.includes(type) || !title) return;

  const data = buildData(type, title, formData);
  const n = (db.prepare("SELECT COUNT(*) AS n FROM resources WHERE type = ?").get(type) as { n: number }).n;
  db.prepare(
    "INSERT INTO resources (id, type, title, body, data, status, created_by, order_idx) VALUES (?, ?, ?, ?, ?, 'published', ?, ?)"
  ).run(newId(), type, title, body, JSON.stringify(data), user.id, n);

  logAudit(user, "Added resource", `${type}: ${title}`);
  revalidatePath("/admin/resources");
  revalidatePath("/teacher/resources");
  revalidatePath("/");
}

/** Update an existing resource in place. */
export async function updateResourceAction(formData: FormData) {
  const user = await requireRole(["teacher", "admin"]);
  const id = String(formData.get("resourceId") ?? "");
  const type = String(formData.get("type") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!id || !TYPES.includes(type) || !title) return;

  const data = buildData(type, title, formData);
  db.prepare("UPDATE resources SET title = ?, body = ?, data = ? WHERE id = ?")
    .run(title, body, JSON.stringify(data), id);

  logAudit(user, "Edited resource", `${type}: ${title}`);
  revalidatePath("/admin/resources");
  revalidatePath("/teacher/resources");
  revalidatePath("/");
}

export async function setResourceStatusAction(formData: FormData) {
  await requireRole(["teacher", "admin"]);
  const id = String(formData.get("resourceId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["published", "draft"].includes(status)) return;
  db.prepare("UPDATE resources SET status = ? WHERE id = ?").run(status, id);
  revalidatePath("/admin/resources");
  revalidatePath("/teacher/resources");
  revalidatePath("/");
}

export async function deleteResourceAction(formData: FormData) {
  await requireRole(["teacher", "admin"]);
  const id = String(formData.get("resourceId") ?? "");
  db.prepare("DELETE FROM resources WHERE id = ?").run(id);
  revalidatePath("/admin/resources");
  revalidatePath("/teacher/resources");
  revalidatePath("/");
}
