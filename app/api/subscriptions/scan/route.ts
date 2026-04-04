import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";

import { withAuth } from "@/lib/auth/withAuth";
import { prisma } from "@/lib/db/prisma";
import { FREE_ACTIVE_SUBSCRIPTIONS_LIMIT } from "@/lib/billing/limits";
import { getGmailForUser } from "@/lib/gmail/client";
import { extractEmailText, getHeader } from "@/lib/gmail/message";
import { extractSubscriptionsFromEmail } from "@/lib/openai/extractSubscriptions";

export const runtime = "nodejs";

const ScanSchema = z.object({
  maxMessages: z.number().int().min(1).max(30).default(15),
});

function parseISODate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function safeJson(
  value: unknown,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === undefined || value === null) return Prisma.JsonNull;
  try {
    const serialized = JSON.parse(JSON.stringify(value)) as unknown;
    if (serialized === null) return Prisma.JsonNull;
    return serialized as Prisma.InputJsonValue;
  } catch {
    return { error: "JSON_SERIALIZE_FAILED" } as Prisma.InputJsonValue;
  }
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    const body = await request.json().catch(() => ({}));
    const { maxMessages } = ScanSchema.parse(body);

    const gmailCtx = await getGmailForUser(user.id);
    if (!gmailCtx) {
      return NextResponse.json(
        { error: "GMAIL_NOT_CONNECTED" },
        { status: 400 },
      );
    }

    const { gmail } = gmailCtx;
    const q =
      'newer_than:365d (subscription OR "your subscription" OR renewal OR "recurring" OR invoice OR receipt)';

    const list = await gmail.users.messages.list({
      userId: "me",
      q,
      maxResults: maxMessages,
    });
    const messageIds = (list.data.messages ?? [])
      .map((m) => m.id)
      .filter((id): id is string => Boolean(id));

    if (messageIds.length === 0) {
      return NextResponse.json(
        { ok: true, scanned: 0, created: 0, updated: 0, skipped: 0 },
        { status: 200 },
      );
    }

    const existingScans = await prisma.gmailMessageScan.findMany({
      where: { userId: user.id, gmailMessageId: { in: messageIds } },
      select: { gmailMessageId: true },
    });
    const scannedSet = new Set(existingScans.map((s) => s.gmailMessageId));
    const toProcess = messageIds.filter((id) => !scannedSet.has(id));

    let activeCount =
      user.plan === "FREE"
        ? await prisma.subscription.count({
            where: { userId: user.id, status: "ACTIVE" },
          })
        : 0;

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let processed = 0;

    for (const id of toProcess) {
      const msg = await gmail.users.messages.get({
        userId: "me",
        id,
        format: "full",
      });

      const subject = getHeader(msg.data, "subject");
      const from = getHeader(msg.data, "from");
      const date = getHeader(msg.data, "date");
      const bodyText = extractEmailText(msg.data);

      let extracted: unknown = null;
      try {
        extracted = await extractSubscriptionsFromEmail({
          subject,
          from,
          date,
          bodyText,
        });
      } catch {
        extracted = { error: "OPENAI_EXTRACT_FAILED" };
      }

      await prisma.gmailMessageScan.create({
        data: {
          userId: user.id,
          gmailMessageId: id,
          gmailThreadId: msg.data.threadId ?? null,
          fromEmail: from,
          subject,
          snippet: msg.data.snippet ?? null,
          internalDate: msg.data.internalDate
            ? new Date(Number(msg.data.internalDate))
            : null,
          extracted: safeJson(extracted),
        },
      });

      processed += 1;

      if (
        !extracted ||
        typeof extracted !== "object" ||
        !("isSubscriptionEmail" in extracted)
      ) {
        continue;
      }

      const result = extracted as {
        isSubscriptionEmail: boolean;
        subscriptions?: Array<{
          providerName: string;
          amountCents: number;
          currency: string;
          billingInterval:
            | "WEEKLY"
            | "MONTHLY"
            | "QUARTERLY"
            | "YEARLY"
            | "UNKNOWN";
          nextBillingDate?: string | null;
          lastBilledAt?: string | null;
        }>;
      };

      if (!result.isSubscriptionEmail || !result.subscriptions?.length) continue;

      for (const s of result.subscriptions) {
        const existing = await prisma.subscription.findFirst({
          where: {
            userId: user.id,
            providerName: { equals: s.providerName, mode: "insensitive" },
            status: "ACTIVE",
          },
        });

        if (existing) {
          await prisma.subscription.update({
            where: { id: existing.id },
            data: {
              amountCents:
                s.amountCents > 0 ? s.amountCents : existing.amountCents,
              currency: s.currency?.toUpperCase?.() ?? existing.currency,
              billingInterval:
                s.billingInterval !== "UNKNOWN"
                  ? s.billingInterval
                  : existing.billingInterval,
              nextBillingDate: s.nextBillingDate
                ? parseISODate(s.nextBillingDate)
                : existing.nextBillingDate,
              lastBilledAt: s.lastBilledAt
                ? parseISODate(s.lastBilledAt)
                : existing.lastBilledAt,
              source: "GMAIL",
            },
          });
          updated += 1;
          continue;
        }

        if (
          user.plan === "FREE" &&
          activeCount >= FREE_ACTIVE_SUBSCRIPTIONS_LIMIT
        ) {
          skipped += 1;
          continue;
        }

        await prisma.subscription.create({
          data: {
            userId: user.id,
            providerName: s.providerName,
            amountCents: s.amountCents,
            currency: (s.currency ?? "USD").toUpperCase(),
            billingInterval: s.billingInterval,
            nextBillingDate: s.nextBillingDate
              ? parseISODate(s.nextBillingDate)
              : null,
            lastBilledAt: s.lastBilledAt ? parseISODate(s.lastBilledAt) : null,
            source: "GMAIL",
          },
        });
        created += 1;
        if (user.plan === "FREE") activeCount += 1;
      }
    }

    return NextResponse.json(
      {
        ok: true,
        scanned: messageIds.length,
        processed,
        created,
        updated,
        skipped,
      },
      { status: 200 },
    );
  });
}
