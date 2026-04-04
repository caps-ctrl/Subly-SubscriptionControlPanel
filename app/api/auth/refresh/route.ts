import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";
import { signAccessToken } from "@/lib/auth/jwt";
import { rotateRefreshToken } from "@/lib/auth/refreshToken";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(env.REFRESH_COOKIE_NAME)?.value;
  if (!refreshToken) {
    const res = NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    clearAuthCookies(res);
    return res;
  }

  const session = await rotateRefreshToken(refreshToken);
  if (!session) {
    const res = NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    clearAuthCookies(res);
    return res;
  }

  const accessToken = await signAccessToken({ id: session.user.id });

  const res = NextResponse.json({ user: session.user }, { status: 200 });
  setAuthCookies(res, {
    accessToken,
    refreshToken: session.refreshToken,
  });
  return res;
}
