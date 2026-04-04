import type { NextRequest } from "next/server";

import { env } from "@/lib/env";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { getAuthUserById } from "@/lib/auth/user";
import { validateRefreshToken } from "@/lib/auth/refreshToken";

export async function getAuthUser(
  request: NextRequest,
): Promise<{ id: string; email: string; plan: "FREE" | "PRO" } | null> {
  const accessToken = request.cookies.get(env.SESSION_COOKIE_NAME)?.value;
  if (accessToken) {
    const session = await verifyAccessToken(accessToken);
    if (session) {
      const user = await getAuthUserById(session.id);
      if (user) return user;
    }
  }

  const refreshToken = request.cookies.get(env.REFRESH_COOKIE_NAME)?.value;
  if (!refreshToken) return null;

  const refreshSession = await validateRefreshToken(refreshToken);
  return refreshSession?.user ?? null;
}
