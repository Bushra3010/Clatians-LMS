import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";
import { db, newId } from "./db";

const SESSION_COOKIE = "lms_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type Role = "student" | "teacher" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "suspended";
  created_at: string;
};

// ────────────────────────────────────────────────────────────
// Password hashing (scrypt — no external dependency)
// ────────────────────────────────────────────────────────────
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const derived = scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(key, "hex");
  return keyBuf.length === derived.length && timingSafeEqual(keyBuf, derived);
}

// ────────────────────────────────────────────────────────────
// Sessions
// ────────────────────────────────────────────────────────────
export async function createSession(userId: string): Promise<void> {
  const token = newId() + newId();
  db.prepare("INSERT INTO sessions (token, user_id) VALUES (?, ?)").run(token, userId);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  jar.delete(SESSION_COOKIE);
}

/** Returns the signed-in user, or null. */
export async function auth(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.role, u.status, u.created_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`
    )
    .get(token) as User | undefined;
  if (!row || row.status === "suspended") return null;
  return row;
}

/** Guards a page/action: redirects to the common login unless the signed-in user has one of `roles`. */
export async function requireRole(roles: Role[]): Promise<User> {
  const user = await auth();
  if (!user) redirect("/login");
  if (!roles.includes(user.role)) redirect("/login");
  return user;
}

/** Convenience guard for admin-only areas. */
export async function requireAdmin(): Promise<User> {
  return requireRole(["admin"]);
}

export function findUserByEmail(email: string) {
  return db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.trim().toLowerCase()) as
    | (User & { password: string })
    | undefined;
}
