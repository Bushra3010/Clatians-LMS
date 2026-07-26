import "server-only";
import { db, newId } from "./db";
import type { User } from "./auth";

const insert = db.prepare(
  "INSERT INTO audit_log (id, actor_id, actor_name, actor_role, action, detail) VALUES (?, ?, ?, ?, ?, ?)"
);

/**
 * Record a staff action for the admin audit trail. Best-effort — never let an
 * audit write break the underlying operation.
 */
export function logAudit(actor: Pick<User, "id" | "name" | "role"> | null, action: string, detail = "") {
  try {
    insert.run(newId(), actor?.id ?? null, actor?.name ?? "System", actor?.role ?? "", action, detail);
  } catch {
    // swallow — auditing must not affect the primary action
  }
}
