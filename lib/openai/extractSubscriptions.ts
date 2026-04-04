import { z } from "zod";

import { env } from "@/lib/env";
import { getOpenAI } from "@/lib/openai/client";

const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable()
  .optional();

const ExtractedSubscriptionSchema = z.object({
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
  nextBillingDate: IsoDateSchema,
  lastBilledAt: IsoDateSchema,
  confidence: z.number().min(0).max(1).optional(),
});

const ExtractResultSchema = z.object({
  isSubscriptionEmail: z.boolean(),
  subscriptions: z.array(ExtractedSubscriptionSchema).default([]),
});

export type ExtractResult = z.infer<typeof ExtractResultSchema>;

export async function extractSubscriptionsFromEmail(input: {
  subject: string | null;
  from: string | null;
  date: string | null;
  bodyText: string;
}): Promise<ExtractResult> {
  const client = getOpenAI();

  const messages = [
    {
      role: "system" as const,
      content:
        "You extract subscription billing data from emails. Output ONLY valid JSON matching the requested schema.",
    },
    {
      role: "user" as const,
      content: [
        "Extract subscriptions from the email below. If it's not about a paid subscription/recurring billing, return isSubscriptionEmail=false.",
        "",
        "Return JSON with this shape:",
        "{",
        '  "isSubscriptionEmail": boolean,',
        '  "subscriptions": [',
        "    {",
        '      "providerName": string,',
        '      "amountCents": integer,',
        '      "currency": "USD"|"EUR"|... (ISO-4217),',
        '      "billingInterval": "WEEKLY"|"MONTHLY"|"QUARTERLY"|"YEARLY"|"UNKNOWN",',
        '      "nextBillingDate": "YYYY-MM-DD"|null,',
        '      "lastBilledAt": "YYYY-MM-DD"|null,',
        '      "confidence": number (0..1)',
        "    }",
        "  ]",
        "}",
        "",
        "Rules:",
        "- Prefer amountCents integer (e.g. $9.99 => 999). If missing, use 0 and set confidence low.",
        "- If only a one-time purchase, set isSubscriptionEmail=false.",
        "- Keep providerName short (e.g. Netflix, Spotify, Adobe).",
        "",
        `Email subject: ${input.subject ?? ""}`,
        `From: ${input.from ?? ""}`,
        `Date: ${input.date ?? ""}`,
        "",
        "Body:",
        input.bodyText,
      ].join("\n"),
    },
  ];

  const completion = await client.chat.completions.create({
    model: env.OPENAI_MODEL,
    messages,
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content ?? "{}";
  const json = JSON.parse(content) as unknown;
  return ExtractResultSchema.parse(json);
}

