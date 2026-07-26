import "server-only";
import { db, newId } from "./db";

export type NotifType = "doubt" | "class" | "payment" | "content" | "announcement" | "info";

const insert = db.prepare(
  "INSERT INTO notifications (id, user_id, type, title, body) VALUES (?, ?, ?, ?, ?)"
);

/**
 * Create an in-app notification for one user.
 *
 * External delivery (email / SMS / WhatsApp / push) would fan out from here to
 * a provider (Twilio, FCM, …). Those need account credentials, so for now we
 * persist the in-app notification only — the single place to add channels later.
 */
export function notify(userId: string, type: NotifType, title: string, body = "") {
  if (!userId) return;
  insert.run(newId(), userId, type, title, body);
}

/** Same, fanned out to many recipients in one transaction. */
export const notifyMany = db.transaction(
  (userIds: string[], type: NotifType, title: string, body = "") => {
    for (const uid of userIds) insert.run(newId(), uid, type, title, body);
  }
);
