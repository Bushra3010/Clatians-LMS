"use server";

import { redirect } from "next/navigation";
import {
  createSession,
  destroySession,
  findUserByEmail,
  verifyPassword,
} from "./auth";

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
