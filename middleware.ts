import { NextResponse, type NextRequest } from "next/server";

import { verifyAccessToken } from "@/lib/auth/jwt";
import { env } from "@/lib/env";

const PROTECTED_PATHS = [
  "/dashboard",
  "/profile",
  "/settings",
  "/subscriptions",
  "/premium",
];
const AUTH_PATHS = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (!isProtected && !isAuthPage) return NextResponse.next();

  const accessToken = request.cookies.get(env.SESSION_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(env.REFRESH_COOKIE_NAME)?.value;
  const user = accessToken ? await verifyAccessToken(accessToken) : null;

  if (isProtected && !user && !refreshToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile",
    "/settings",
    "/subscriptions",
    "/premium",
    "/login",
    "/register",
  ],
};
