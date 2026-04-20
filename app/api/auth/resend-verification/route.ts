import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { sendAccountVerificationEmail } from "@/lib/auth/emailVerification";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

const ResendVerificationSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase().trim()),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = ResendVerificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: {
      id: true,
      email: true,
      isVerified: true,
    },
  });

  if (user && !user.isVerified) {
    try {
      await sendAccountVerificationEmail(user);
    } catch (error) {
      console.error("Verification email resend failed", error);

      return NextResponse.json(
        { error: "VERIFICATION_EMAIL_FAILED" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
