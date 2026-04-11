import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { withAuth } from "@/lib/auth/withAuth";
import { extractSubscriptionsFromEmail } from "@/lib/openai/extractSubscriptions";

export const runtime = "nodejs";

const ExtractPreviewSchema = z.object({
  subject: z.string().max(300).nullable().optional(),
  from: z.string().max(300).nullable().optional(),
  date: z.string().max(120).nullable().optional(),
  bodyText: z.string().trim().min(20).max(20000),
});

export async function POST(request: NextRequest) {
  return withAuth(request, async () => {
    const body = await request.json().catch(() => ({}));
    const input = ExtractPreviewSchema.parse(body);

    try {
      const result = await extractSubscriptionsFromEmail({
        subject: input.subject ?? null,
        from: input.from ?? null,
        date: input.date ?? null,
        bodyText: input.bodyText,
      });
      return NextResponse.json({ result }, { status: 200 });
    } catch {
      return NextResponse.json({ error: "OPENAI_FAILED" }, { status: 502 });
    }
  });
}
