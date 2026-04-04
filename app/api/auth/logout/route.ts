import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";
import { revokeRefreshToken } from "@/lib/auth/refreshToken";
import { clearAuthCookies } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(env.REFRESH_COOKIE_NAME)?.value;
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }

  const res = NextResponse.json({ ok: true }, { status: 200 });
  clearAuthCookies(res);
  return res;
}
