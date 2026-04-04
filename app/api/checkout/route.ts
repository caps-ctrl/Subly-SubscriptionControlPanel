import { NextRequest, NextResponse } from "next/server";

import { withAuth } from "@/lib/auth/withAuth";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  return withAuth(req, async (user) => {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

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

      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,

      metadata: {
        userId: user.id,
      },
    });

    return NextResponse.json({ url: session.url });
  });
}
