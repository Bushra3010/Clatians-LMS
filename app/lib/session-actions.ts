"use server";

import { redirect } from "next/navigation";
import {
  createSession,
  destroySession,
  findUserByEmail,
  verifyPassword,
  hashPassword,
  auth,
} from "./auth";
import { db } from "./db";

export type LoginState = { error?: string };

// Where each role lands after signing in.
const HOME_BY_ROLE: Record<string, string> = {
  admin: "/admin",
  teacher: "/teacher",
  student: "/",
};

/**
 * Common login for every role. Authenticates against the shared users table,
 * then routes the user to the area for their role.
 */
export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const user = await findUserByEmail(email);
  if (!user || !verifyPassword(password, user.password)) {
    return { error: "Invalid email or password." };
  }
  if (user.status === "suspended") {
    return { error: "This account is suspended. Contact your administrator." };
  }

  await createSession(user.id);
  redirect(HOME_BY_ROLE[user.role] ?? "/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

/** Self-service password change for the signed-in user (any role). */
export async function changePasswordAction(current: string, next: string): Promise<{ ok: boolean; error?: string }> {
  const user = await auth();
  if (!user) return { ok: false, error: "Please sign in again." };
  if (String(next).length < 6) return { ok: false, error: "New password must be at least 6 characters." };

  const row = await db.prepare("SELECT password FROM users WHERE id = ?").get(user.id) as { password: string } | undefined;
  if (!row || !verifyPassword(String(current), row.password)) {
    return { ok: false, error: "Your current password is incorrect." };
  }

  await db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashPassword(String(next)), user.id);
  return { ok: true };
}
