import { NextResponse, type NextRequest } from "next/server";

import { verifyEmailVerificationToken } from "@/lib/auth/emailVerification";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

function buildLoginRedirect(request: NextRequest, params: Record<string, string>) {
  const url = new URL("/login", request.nextUrl.origin);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url;
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      buildLoginRedirect(request, { verification: "invalid" }),
    );
  }

  const payload = await verifyEmailVerificationToken(token);
  if (!payload) {
    return NextResponse.redirect(
      buildLoginRedirect(request, { verification: "invalid" }),
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: {
      id: true,
      email: true,
      isVerified: true,
    },
  });

  if (!user || user.email !== payload.email) {
    return NextResponse.redirect(
      buildLoginRedirect(request, { verification: "invalid" }),
    );
  }

  if (!user.isVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });
  }

  return NextResponse.redirect(
    buildLoginRedirect(request, {
      verified: "1",
      email: user.email,
    }),
  );
}
