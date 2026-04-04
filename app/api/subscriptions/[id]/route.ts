import { prisma } from "@/lib/db/prisma";
import { withAuth } from "@/lib/auth/withAuth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return withAuth(req, async (user) => {
      const subscription = await prisma.subscription.findUnique({
        where: { id },
      });

      if (!subscription) {
        return NextResponse.json(
          { error: "Nie znaleziono subskrypcji" },
          { status: 404 },
        );
      }

      if (subscription.userId !== user.id) {
        return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
      }

      await prisma.subscription.delete({
        where: { id },
      });

      return NextResponse.json({ success: true });
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

const UpdateSchema = z.object({
  providerName: z.string().min(1).max(120).optional(),
  amountCents: z.number().int().nonnegative().optional(),
  currency: z.string().min(3).max(3).optional(),
  billingInterval: z
    .enum(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY", "UNKNOWN"])
    .optional(),
  nextBillingDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  markPaid: z.boolean().optional(),
});

function parseISODate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function daysInMonthUtc(year: number, monthIndex0: number) {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

function addMonthsUtc(date: Date, months: number) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const second = date.getUTCSeconds();
  const ms = date.getUTCMilliseconds();

  const totalMonths = month + months;
  const newYear = year + Math.floor(totalMonths / 12);
  const newMonth = ((totalMonths % 12) + 12) % 12;
  const maxDay = daysInMonthUtc(newYear, newMonth);
  const newDay = Math.min(day, maxDay);

  return new Date(
    Date.UTC(newYear, newMonth, newDay, hour, minute, second, ms),
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return withAuth(req, async (user) => {
      const body = await req.json().catch(() => null);
      const parsed = UpdateSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: "INVALID_INPUT", details: parsed.error.flatten() },
          { status: 400 },
        );
      }

      const subscription = await prisma.subscription.findUnique({
        where: { id },
      });

      if (!subscription) {
        return NextResponse.json(
          { error: "Nie znaleziono subskrypcji" },
          { status: 404 },
        );
      }

      if (subscription.userId !== user.id) {
        return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
      }

      const { markPaid, ...data } = parsed.data;
      if (markPaid && !subscription.nextBillingDate) {
        return NextResponse.json(
          { error: "Brak nextBillingDate" },
          { status: 400 },
        );
      }

      const paidUpdate =
        markPaid && subscription.nextBillingDate
          ? {
              lastBilledAt: subscription.nextBillingDate,
              nextBillingDate: addMonthsUtc(subscription.nextBillingDate, 1),
            }
          : {};

      const updated = await prisma.subscription.update({
        where: { id },
        data: {
          ...data,
          currency: data.currency?.toUpperCase(),
          nextBillingDate:
            data.nextBillingDate === undefined
              ? undefined
              : data.nextBillingDate === null
                ? null
                : parseISODate(data.nextBillingDate),
          ...paidUpdate,
        },
      });

      return NextResponse.json(updated);
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
