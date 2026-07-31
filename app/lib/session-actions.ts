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
import { db, newId } from "./db";
import { notify, notifyMany } from "./notify";

export type LoginState = { error?: string };

// Where each role lands after signing in.
const HOME_BY_ROLE: Record<string, string> = {
  admin: "/admin",
  teacher: "/teacher",
  student: "/",
  parent: "/parent",
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

export type SignupState = { error?: string };

/**
 * PUBLIC self-signup — creates a student account and signs them straight in.
 * New students land on the app with the free material unlocked; paid batches
 * unlock after checkout.
 */
export async function signupAction(
  _prev: SignupState,
  formData: FormData
): Promise<SignupState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (name.length < 2) return { error: "Please enter your full name." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Please enter a valid email address." };
  if (password.length < 6) return { error: "Password must be at least 6 characters." };
  if (await findUserByEmail(email)) {
    return { error: "An account with this email already exists — please sign in instead." };
  }

  const id = newId();
  await db.prepare(
    "INSERT INTO users (id, name, email, password, role, status) VALUES (?, ?, ?, ?, 'student', 'active')"
  ).run(id, name, email, hashPassword(password));

  // Warm welcome + a heads-up to the admissions team.
  await notify(
    id,
    "announcement",
    "Welcome to CLATians! 🎉",
    "Explore your free study material, attempt the scholarship mock test, and enroll in a batch to unlock live classes & the full course."
  );
  const admins = (await db.prepare("SELECT id FROM users WHERE role='admin'").all() as { id: string }[]).map((a) => a.id);
  await notifyMany(admins, "info", "New student signup", `${name} (${email}) just created an account.`);

  await createSession(id);
  redirect("/");
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

export type NotifyPrefs = { push: boolean; email: boolean; sms: boolean };

/** Persist the signed-in user's notification preferences (Settings toggles). */
export async function updateNotifyPrefsAction(prefs: NotifyPrefs): Promise<{ ok: boolean }> {
  const user = await auth();
  if (!user) return { ok: false };
  const clean: NotifyPrefs = { push: !!prefs.push, email: !!prefs.email, sms: !!prefs.sms };
  await db.prepare("UPDATE users SET notify_prefs = ? WHERE id = ?").run(JSON.stringify(clean), user.id);
  return { ok: true };
}
