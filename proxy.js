import { NextResponse } from "next/server";

export function proxy(request) {
  const password = process.env.APP_ACCESS_PASSWORD;
  if (!password) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const allowed =
    pathname === "/login" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/auth/login");

  if (allowed) {
    return NextResponse.next();
  }

  const cookieValue = request.cookies.get("dg_eval_gate")?.value;
  if (cookieValue === password) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/login";
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/((?!api/bootstrap).*)"],
};
