import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature")!;

  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!,
  );

  // 🔥 EVENTY
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session.metadata?.userId;
    const stripeSubscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;
    const stripeCustomerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;

    if (!userId || !stripeSubscriptionId || !stripeCustomerId) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const subscription = await stripe.subscriptions.retrieve(
      stripeSubscriptionId,
    );
    const currentPeriodEnd = subscription.items.data[0]?.current_period_end
      ? new Date(subscription.items.data[0].current_period_end * 1000)
      : null;

    await prisma.userSubscription.upsert({
      where: {
        stripeSubscriptionId: subscription.id,
      },
      update: {
        status: subscription.status,
        currentPeriodEnd,
      },
      create: {
        userId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId,
        status: subscription.status,
        currentPeriodEnd,
      },
    });
  }

  return NextResponse.json({ received: true });
}
