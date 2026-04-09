import { NextRequest, NextResponse } from "next/server";

import { withAuth } from "@/lib/auth/withAuth";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return withAuth(req, async (user) => {
    if (user.plan === "PRO") {
      return NextResponse.json({ error: "ALREADY_PRO" }, { status: 409 });
    }

    try {
      const stripe = getStripe();
      const successUrl = new URL("/checkout/success", req.nextUrl.origin);
      const cancelUrl = new URL("/checkout/cancel", req.nextUrl.origin);
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: user.email,
        client_reference_id: user.id,
        line_items: [
          {
            price_data: {
              currency: "pln",
              product_data: {
                name: "Premium plan",
              },
              unit_amount: 1000,
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ],
        success_url: successUrl.toString(),
        cancel_url: cancelUrl.toString(),
        metadata: {
          userId: user.id,
        },
      });

      if (!session.url) {
        return NextResponse.json(
          { error: "CHECKOUT_URL_MISSING" },
          { status: 500 },
        );
      }

      return NextResponse.json({ url: session.url });
    } catch (error) {
      console.error("Stripe checkout session creation failed", error);

      return NextResponse.json(
        { error: "CHECKOUT_UNAVAILABLE" },
        { status: 500 },
      );
    }
  });
}
