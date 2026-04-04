import type { NextRequest } from "next/server";

import { env } from "@/lib/env";
import { signAccessToken, verifyAccessToken } from "@/lib/auth/jwt";
import { rotateRefreshToken } from "@/lib/auth/refreshToken";
import { getAuthUserById, type AuthUser } from "@/lib/auth/user";

export type AuthSessionUpdate = {
  accessToken: string;
  refreshToken?: string;
};

export type AuthenticatedRequest = {
  user: AuthUser;
  session: AuthSessionUpdate | null;
};

export async function authenticateRequest(
  request: NextRequest,
): Promise<AuthenticatedRequest | null> {
  const accessToken = request.cookies.get(env.SESSION_COOKIE_NAME)?.value;
  if (accessToken) {
    const session = await verifyAccessToken(accessToken);
    if (session) {
      const user = await getAuthUserById(session.id);
      if (user) {
        return {
          user,
          session: null,
        };
      }
    }
  }

  const refreshToken = request.cookies.get(env.REFRESH_COOKIE_NAME)?.value;
  if (!refreshToken) return null;

  const rotatedSession = await rotateRefreshToken(refreshToken);
  if (!rotatedSession) return null;

  return {
    user: rotatedSession.user,
    session: {
      accessToken: await signAccessToken({ id: rotatedSession.user.id }),
      refreshToken: rotatedSession.refreshToken,
    },
  };
}
