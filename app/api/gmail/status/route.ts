import { NextResponse, type NextRequest } from "next/server";

import { withAuth } from "@/lib/auth/withAuth";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const account = await prisma.gmailAccount.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { gmailAddress: true },
    });

    return NextResponse.json(
      { connected: Boolean(account), gmailAddress: account?.gmailAddress ?? null },
      { status: 200 },
    );
  });
}
