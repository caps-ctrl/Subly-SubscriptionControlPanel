import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { withAuth } from "@/lib/auth/withAuth";
import { prisma } from "@/lib/db/prisma";
import { generateCancellationGuide } from "@/lib/openai/cancelHelp";

export const runtime = "nodejs";

const CancelHelpSchema = z.object({
  subscriptionId: z.string().min(1),
  userCountry: z.string().trim().min(2).max(3).optional(),
  userLanguage: z.enum(["pl", "en"]).default("pl"),
});

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    const body = await request.json().catch(() => ({}));
    const { subscriptionId, userCountry, userLanguage } =
      CancelHelpSchema.parse(body);

    const subscription = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId: user.id },
      select: {
        id: true,
        providerName: true,
        amountCents: true,
        currency: true,
        billingInterval: true,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "SUBSCRIPTION_NOT_FOUND" },
        { status: 404 },
      );
    }

    try {
      const { guide, model } = await generateCancellationGuide({
        providerName: subscription.providerName,
        userCountry,
        userLanguage,
      });

      const serializedGuide = JSON.parse(
        JSON.stringify(guide),
      ) as Prisma.InputJsonValue;

      await prisma.cancellationGuide.create({
        data: {
          userId: user.id,
          subscriptionId: subscription.id,
          model,
          guide: serializedGuide,
        },
      });

      return NextResponse.json(
        {
          guide,
          model,
          subscription,
        },
        { status: 200 },
      );
    } catch {
      return NextResponse.json({ error: "OPENAI_FAILED" }, { status: 502 });
    }
  });
}
