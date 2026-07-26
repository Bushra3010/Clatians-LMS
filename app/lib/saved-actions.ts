"use server";

import { revalidatePath } from "next/cache";
import { db } from "./db";
import { requireRole } from "./auth";

/** Student toggles an item in their "My Notes" saved list (tip / vocab / content). */
export async function toggleSavedAction(kind: string, itemKey: string, title = "", subtitle = "") {
  const user = await requireRole(["student"]);
  if (!kind || !itemKey) return;

  const exists = db
    .prepare("SELECT 1 FROM saved_items WHERE user_id = ? AND kind = ? AND item_key = ?")
    .get(user.id, kind, itemKey);

  if (exists) {
    db.prepare("DELETE FROM saved_items WHERE user_id = ? AND kind = ? AND item_key = ?").run(user.id, kind, itemKey);
  } else {
    db.prepare(
      "INSERT INTO saved_items (user_id, kind, item_key, title, subtitle) VALUES (?, ?, ?, ?, ?)"
    ).run(user.id, kind, itemKey, title, subtitle);
  }

  revalidatePath("/");
}
