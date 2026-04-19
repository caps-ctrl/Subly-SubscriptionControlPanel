import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/db/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

function getCurrentPeriodEnd(subscription: Stripe.Subscription) {
  const timestamp = subscription.items.data[0]?.current_period_end;
  return timestamp ? new Date(timestamp * 1000) : null;
}

function shouldUserHaveProPlan(status: Stripe.Subscription.Status) {
  return status === "active" || status === "trialing" || status === "past_due";
}

async function syncUserSubscriptionState(subscription: Stripe.Subscription) {
  const existing = await prisma.userSubscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    select: { userId: true },
  });

  if (!existing) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.userSubscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status,
        currentPeriodEnd: getCurrentPeriodEnd(subscription),
      },
    });

    await tx.user.update({
      where: { id: existing.userId },
      data: {
        plan: shouldUserHaveProPlan(subscription.status) ? "PRO" : "FREE",
      },
    });
  });
}

export async function POST(req: Request) {
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  console.log("Otrzymano webhook Stripe:", { sig, body }); // IGNORE
  if (!sig || !webhookSecret) {
    return NextResponse.json(
      { error: "WEBHOOK_NOT_CONFIGURED" },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 400 });
  }

  // 🔥 EVENTY
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log("Checkout session completed:", session.id); // IGNORE
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
    console.log("Pobieranie subskrypcji z Stripe:", stripeSubscriptionId); // IGNORE
    const subscription =
      await stripe.subscriptions.retrieve(stripeSubscriptionId);
    const currentPeriodEnd = getCurrentPeriodEnd(subscription);

    await prisma.$transaction(async (tx) => {
      await tx.userSubscription.upsert({
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
      console.log("Aktualizacja planu użytkownika na PRO:", userId); // IGNORE
      await tx.user.update({
        where: { id: userId },
        data: {
          plan: shouldUserHaveProPlan(subscription.status) ? "PRO" : "FREE",
        },
      });
    });
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    await syncUserSubscriptionState(subscription);
  }

  return NextResponse.json({ received: true });
}
