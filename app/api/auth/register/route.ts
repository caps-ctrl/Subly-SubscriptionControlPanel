import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { sendAccountVerificationEmail } from "@/lib/auth/emailVerification";

export const runtime = "nodejs";

const RegisterSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: z.string().min(8).max(200),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      isVerified: true,
    },
  });
  if (existing) {
    if (!existing.isVerified) {
      try {
        await sendAccountVerificationEmail(existing);
      } catch (error) {
        console.error("Verification email resend failed", error);

        return NextResponse.json(
          { error: "VERIFICATION_EMAIL_FAILED" },
          { status: 500 },
        );
      }

      return NextResponse.json(
        {
          ok: true,
          verificationRequired: true,
          email: existing.email,
        },
        { status: 200 },
      );
    }

    return NextResponse.json({ error: "EMAIL_TAKEN" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      isVerified: false,
    },
    select: {
      id: true,
      email: true,
    },
  });

  try {
    await sendAccountVerificationEmail(user);
  } catch (error) {
    console.error("Verification email send failed", error);
    await prisma.user.delete({ where: { id: user.id } }).catch(() => null);

    return NextResponse.json(
      { error: "VERIFICATION_EMAIL_FAILED" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      verificationRequired: true,
      email: user.email,
    },
    { status: 201 },
  );
}
