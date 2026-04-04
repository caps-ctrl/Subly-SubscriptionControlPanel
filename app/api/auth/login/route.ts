import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { signAccessToken } from "@/lib/auth/jwt";
import { issueRefreshToken } from "@/lib/auth/refreshToken";
import { setAuthCookies } from "@/lib/auth/session";

export const runtime = "nodejs";

const LoginSchema = z.object({
  email: z
    .string()
    .email()
    .transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, plan: true, passwordHash: true },
  });

  if (!user) {
    return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({ id: user.id }),
    issueRefreshToken(user.id),
  ]);

  const res = NextResponse.json(
    { user: { id: user.id, email: user.email, plan: user.plan } },
    { status: 200 },
  );
  setAuthCookies(res, {
    accessToken,
    refreshToken: refreshToken.token,
  });
  return res;
}
