import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Optimistic gate only — the authoritative role checks live in each area's
// server components (requireRole / requireAdmin). This just avoids flashing a
// protected shell for visitors with no session cookie at all.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("lms_session");

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
