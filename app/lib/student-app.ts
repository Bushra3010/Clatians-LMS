import "server-only";
import { headers } from "next/headers";

/**
 * The Android student app (mobile/) appends this to its WebView's user agent.
 * Requests that carry it get the student-only experience: no demo logins, and
 * no staff sign-ins. Keep in sync with mobile/capacitor.config.json and proxy.ts.
 */
export const STUDENT_APP_UA = "CLATiansStudentApp";

export async function isStudentApp(): Promise<boolean> {
  return ((await headers()).get("user-agent") ?? "").includes(STUDENT_APP_UA);
}
