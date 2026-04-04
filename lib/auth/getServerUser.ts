import { cookies } from "next/headers";

import { env } from "@/lib/env";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { getAuthUserById } from "./user";
import { validateRefreshToken } from "./refreshToken";

export async function getServerUser(): Promise<{
  id: string;
  email: string;
  plan: "FREE" | "PRO";
} | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(env.SESSION_COOKIE_NAME)?.value;
  if (accessToken) {
    const claims = await verifyAccessToken(accessToken);
    if (claims) {
      const user = await getAuthUserById(claims.id);
      if (user) return user;
    }
  }

  const refreshToken = cookieStore.get(env.REFRESH_COOKIE_NAME)?.value;
  if (!refreshToken) return null;

  const refreshSession = await validateRefreshToken(refreshToken);
  return refreshSession?.user ?? null;
}
