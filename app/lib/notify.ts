import "server-only";
import { db, newId } from "./db";

export type NotifType = "doubt" | "class" | "payment" | "content" | "announcement" | "info";

const INSERT = "INSERT INTO notifications (id, user_id, type, title, body) VALUES (?, ?, ?, ?, ?)";

/**
 * Create an in-app notification for one user.
 *
 * External delivery (email / SMS / WhatsApp / push) would fan out from here to
 * a provider (Twilio, FCM, …). Those need account credentials, so for now we
 * persist the in-app notification only — the single place to add channels later.
 */
export async function notify(userId: string, type: NotifType, title: string, body = ""): Promise<void> {
  if (!userId) return;
  await db.prepare(INSERT).run(newId(), userId, type, title, body);
}

/** Same, fanned out to many recipients. */
export async function notifyMany(userIds: string[], type: NotifType, title: string, body = ""): Promise<void> {
  for (const uid of userIds) await notify(uid, type, title, body);
}
