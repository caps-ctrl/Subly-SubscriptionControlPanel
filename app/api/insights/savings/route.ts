import { NextResponse, type NextRequest } from "next/server";

import { withAuth } from "@/lib/auth/withAuth";
import { prisma } from "@/lib/db/prisma";
import { generateSavingsInsights } from "@/lib/openai/savingsInsights";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    if (user.plan !== "PRO") {
      return NextResponse.json({ error: "PRO_REQUIRED" }, { status: 402 });
    }

    const subs = await prisma.subscription.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      select: {
        providerName: true,
        amountCents: true,
        currency: true,
        billingInterval: true,
      },
      orderBy: { amountCents: "desc" },
    });

    try {
      const insights = await generateSavingsInsights({ subscriptions: subs });
      return NextResponse.json({ insights }, { status: 200 });
    } catch {
      return NextResponse.json({ error: "OPENAI_FAILED" }, { status: 502 });
    }
  });
}
