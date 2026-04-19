import { NextRequest, NextResponse } from "next/server";

import { withAuth } from "@/lib/auth/withAuth";
import { prisma } from "@/lib/db/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return withAuth(req, async (user) => {
    try {
      const billingAccount = await prisma.userSubscription.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        select: { stripeCustomerId: true },
      });

      if (!billingAccount?.stripeCustomerId) {
        return NextResponse.json(
          { error: "NO_BILLING_ACCOUNT" },
          { status: 409 },
        );
      }

      const stripe = getStripe();
      const returnUrl = new URL("/dashboard/settings", req.nextUrl.origin);
      const session = await stripe.billingPortal.sessions.create({
        customer: billingAccount.stripeCustomerId,
        return_url: returnUrl.toString(),
      });

      return NextResponse.json({ url: session.url });
    } catch (error) {
      console.error("Stripe billing portal session creation failed", error);

      return NextResponse.json(
        { error: "BILLING_PORTAL_UNAVAILABLE" },
        { status: 500 },
      );
    }
  });
}
