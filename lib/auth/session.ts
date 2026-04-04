import type { NextResponse } from "next/server";

import { env } from "@/lib/env";

type AuthCookies = {
  accessToken: string;
  refreshToken?: string;
};

function createCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function setAccessTokenCookie(res: NextResponse, token: string) {
  res.cookies.set(
    env.SESSION_COOKIE_NAME,
    token,
    createCookieOptions(env.ACCESS_TOKEN_TTL_SECONDS),
  );
}

export function setRefreshTokenCookie(res: NextResponse, token: string) {
  res.cookies.set(
    env.REFRESH_COOKIE_NAME,
    token,
    createCookieOptions(env.REFRESH_TOKEN_TTL_SECONDS),
  );
}

export function setAuthCookies(res: NextResponse, cookies: AuthCookies) {
  setAccessTokenCookie(res, cookies.accessToken);
  if (cookies.refreshToken) {
    setRefreshTokenCookie(res, cookies.refreshToken);
  }
}

export function clearAccessTokenCookie(res: NextResponse) {
  res.cookies.set(env.SESSION_COOKIE_NAME, "", createCookieOptions(0));
}

export function clearRefreshTokenCookie(res: NextResponse) {
  res.cookies.set(env.REFRESH_COOKIE_NAME, "", createCookieOptions(0));
}

export function clearAuthCookies(res: NextResponse) {
  clearAccessTokenCookie(res);
  clearRefreshTokenCookie(res);
}

export const setSessionCookie = setAccessTokenCookie;
export const clearSessionCookie = clearAccessTokenCookie;
