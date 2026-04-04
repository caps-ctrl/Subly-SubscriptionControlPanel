import { addDays, endOfDay, startOfDay } from "date-fns";

import { prisma } from "../lib/db/prisma";
import { env } from "../lib/env";
import { sendMail } from "../lib/notifications/mailer";

function formatMoney(amountCents: number, currency: string) {
  const amount = amountCents / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

async function main() {
  const days = Number(process.env.NOTIFY_DAYS ?? 3);
  const from = startOfDay(new Date());
  const to = endOfDay(addDays(new Date(), Number.isFinite(days) ? days : 3));

  const subs = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      nextBillingDate: { gte: from, lte: to },
    },
    include: { user: { select: { id: true, email: true } } },
    orderBy: { nextBillingDate: "asc" },
  });

  let sent = 0;
  let skipped = 0;

  for (const sub of subs) {
    if (!sub.nextBillingDate) continue;
    const dateKey = sub.nextBillingDate.toISOString().slice(0, 10);
    const dedupeKey = `upcoming:${sub.id}:${dateKey}`;

    const already = await prisma.notificationLog.findUnique({
      where: { dedupeKey },
      select: { id: true },
    });
    if (already) {
      skipped += 1;
      continue;
    }

    const subject = `Nadchodząca płatność: ${sub.providerName}`;
    const text = [
      `Cześć!`,
      ``,
      `Przypomnienie: ${sub.providerName} pobierze opłatę dnia ${dateKey}.`,
      `Kwota: ${formatMoney(sub.amountCents, sub.currency)} (${sub.billingInterval}).`,
      ``,
      `Otwórz dashboard: ${env.APP_BASE_URL}/dashboard`,
      ``,
      `— AI Subscription Manager`,
    ].join("\n");

    await sendMail({ to: sub.user.email, subject, text });

    await prisma.notificationLog.create({
      data: {
        userId: sub.user.id,
        subscriptionId: sub.id,
        type: "UPCOMING_PAYMENT",
        channel: "EMAIL",
        dedupeKey,
      },
    });

    sent += 1;
  }

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      { ok: true, windowDays: days, from: from.toISOString(), to: to.toISOString(), matched: subs.length, sent, skipped },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
