import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { withAuth } from "@/lib/auth/withAuth";
import { getGmailForUser } from "@/lib/gmail/client";

export const runtime = "nodejs";

const DraftSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  bodyText: z.string().min(1).max(10000),
});

function toBase64Url(raw: string) {
  return Buffer.from(raw, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    const body = await request.json().catch(() => null);
    const parsed = DraftSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_INPUT", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { gmail } = (await getGmailForUser(user.id)) ?? {};
    if (!gmail) {
      return NextResponse.json(
        { error: "GMAIL_NOT_CONNECTED" },
        { status: 400 },
      );
    }

    const { to, subject, bodyText } = parsed.data;
    const raw = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset="UTF-8"`,
      "",
      bodyText,
    ].join("\r\n");

    const draft = await gmail.users.drafts.create({
      userId: "me",
      requestBody: {
        message: {
          raw: toBase64Url(raw),
        },
      },
    });

    return NextResponse.json(
      { ok: true, draftId: draft.data.id ?? null },
      { status: 200 },
    );
  });
}
