import { NextResponse, type NextRequest } from "next/server";

import { withAuth } from "@/lib/auth/withAuth";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return withAuth(request, async (user) => {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { plan: "PRO" },
      select: { id: true, email: true, plan: true },
    });

    return NextResponse.json({ user: updated }, { status: 200 });
  });
}
