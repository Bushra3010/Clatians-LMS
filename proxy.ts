import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Optimistic gate only — the authoritative role checks live in each area's
// server components (requireRole / requireAdmin). This just avoids flashing a
// protected shell for visitors with no session cookie at all.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("lms_session");

  // The Android student app never opens staff areas. A staff session found
  // there is dropped, so the app lands on a clean student sign-in.
  // Matches STUDENT_APP_UA in app/lib/student-app.ts.
  if ((request.headers.get("user-agent") ?? "").includes("CLATiansStudentApp")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    const res = NextResponse.redirect(url);
    res.cookies.delete("lms_session");
    return res;
  }

  const isProtected =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/teacher" ||
    pathname.startsWith("/teacher/") ||
    pathname === "/parent" ||
    pathname.startsWith("/parent/");

  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/teacher/:path*", "/parent/:path*"],
};
