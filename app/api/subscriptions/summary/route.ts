import { NextResponse, type NextRequest } from "next/server";

import { withAuth } from "@/lib/auth/withAuth";
import { prisma } from "@/lib/db/prisma";
import { monthlyCostCents } from "@/lib/subscriptions/cost";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const subs = await prisma.subscription.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      select: { amountCents: true, currency: true, billingInterval: true },
    });

    const totalsByCurrency = new Map<string, number>();
    for (const s of subs) {
      const monthly = monthlyCostCents(s.amountCents, s.billingInterval);
      if (!monthly) continue;
      totalsByCurrency.set(
        s.currency,
        (totalsByCurrency.get(s.currency) ?? 0) + monthly,
      );
    }

    return NextResponse.json(
      {
        activeCount: subs.length,
        monthlyTotals: Array.from(totalsByCurrency.entries()).map(
          ([currency, monthlyTotalCents]) => ({ currency, monthlyTotalCents }),
        ),
      },
      { status: 200 },
    );
  });
}
