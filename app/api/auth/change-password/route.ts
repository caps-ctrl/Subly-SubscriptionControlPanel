import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/auth/authenticateRequest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { signAccessToken } from "@/lib/auth/jwt";
import { issueRefreshToken } from "@/lib/auth/refreshToken";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8).max(200),
});

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);

  if (!auth) {
    const response = NextResponse.json(
      { error: "UNAUTHORIZED" },
      { status: 401 },
    );
    clearAuthCookies(response);
    return response;
  }

  const jsonWithSession = (
    body: Record<string, unknown>,
    status: number,
  ): NextResponse => {
    const response = NextResponse.json(body, { status });
    if (auth.session) {
      setAuthCookies(response, auth.session);
    }
    return response;
  };

  const body = await request.json().catch(() => null);
  const parsed = ChangePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonWithSession(
      { error: "INVALID_INPUT", details: parsed.error.flatten() },
      400,
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  if (currentPassword === newPassword) {
    return jsonWithSession({ error: "PASSWORD_UNCHANGED" }, 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    const response = NextResponse.json(
      { error: "UNAUTHORIZED" },
      { status: 401 },
    );
    clearAuthCookies(response);
    return response;
  }

  const passwordMatches = await verifyPassword(
    currentPassword,
    user.passwordHash,
  );
  if (!passwordMatches) {
    return jsonWithSession({ error: "INVALID_CURRENT_PASSWORD" }, 400);
  }

  const passwordHash = await hashPassword(newPassword);
  const revokedAt = new Date();

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: {
        revokedAt,
        tokenUsed: true,
      },
    }),
  ]);

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({ id: user.id }),
    issueRefreshToken(user.id),
  ]);

  const response = NextResponse.json({ ok: true }, { status: 200 });
  setAuthCookies(response, {
    accessToken,
    refreshToken: refreshToken.token,
  });
  return response;
}
