import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { withAuth } from "@/lib/auth/withAuth";
import { prisma } from "@/lib/db/prisma";
import { FREE_ACTIVE_SUBSCRIPTIONS_LIMIT } from "@/lib/billing/limits";

export const runtime = "nodejs";

const CreateSubscriptionSchema = z.object({
  providerName: z.string().min(1).max(120),
  amountCents: z.number().int().nonnegative(),
  currency: z.string().min(3).max(3).default("USD"),
  billingInterval: z.enum([
    "WEEKLY",
    "MONTHLY",
    "QUARTERLY",
    "YEARLY",
    "UNKNOWN",
  ]),
  nextBillingDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
});

function parseISODate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: user.id },
      orderBy: [
        { status: "asc" },
        { nextBillingDate: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ subscriptions }, { status: 200 });
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    const body = await request.json().catch(() => null);
    const parsed = CreateSubscriptionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_INPUT", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    if (user.plan === "FREE") {
      const activeCount = await prisma.subscription.count({
        where: { userId: user.id, status: "ACTIVE" },
      });
      if (activeCount >= FREE_ACTIVE_SUBSCRIPTIONS_LIMIT) {
        return NextResponse.json(
          { error: "PLAN_LIMIT_REACHED", limit: FREE_ACTIVE_SUBSCRIPTIONS_LIMIT },
          { status: 402 },
        );
      }
    }

    const {
      providerName,
      amountCents,
      currency,
      billingInterval,
      nextBillingDate,
    } = parsed.data;

    const created = await prisma.subscription.create({
      data: {
        userId: user.id,
        providerName,
        amountCents,
        currency: currency.toUpperCase(),
        billingInterval,
        nextBillingDate: nextBillingDate ? parseISODate(nextBillingDate) : null,
        source: "MANUAL",
      },
    });

    return NextResponse.json({ subscription: created }, { status: 201 });
  });
}
