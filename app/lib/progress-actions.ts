"use server";

import { revalidatePath } from "next/cache";
import { db } from "./db";
import { requireRole } from "./auth";

/** Student toggles a content item as done / not done. */
export async function toggleContentDoneAction(contentId: string) {
  const user = await requireRole(["student"]);
  if (!contentId) return;

  const exists = await db
    .prepare("SELECT 1 FROM content_progress WHERE user_id = ? AND content_id = ?")
    .get(user.id, contentId);

  if (exists) {
    await db.prepare("DELETE FROM content_progress WHERE user_id = ? AND content_id = ?").run(user.id, contentId);
  } else {
    await db.prepare("INSERT INTO content_progress (user_id, content_id) VALUES (?, ?) ON CONFLICT DO NOTHING").run(user.id, contentId);
  }

  revalidatePath("/");
}
