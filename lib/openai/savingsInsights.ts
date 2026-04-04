import { z } from "zod";

import { env } from "@/lib/env";
import { getOpenAI } from "@/lib/openai/client";

const SuggestionSchema = z.object({
  title: z.string().min(1).max(120),
  details: z.string().min(1).max(800),
  estimatedMonthlySavingsCents: z.number().int().nonnegative().optional(),
  currency: z.string().min(3).max(3).optional(),
  actionSteps: z.array(z.string().min(1).max(200)).min(1).max(8),
});

const InsightsSchema = z.object({
  summary: z.string().min(1).max(800),
  suggestions: z.array(SuggestionSchema).min(1).max(12),
});

export type SavingsInsights = z.infer<typeof InsightsSchema>;

export async function generateSavingsInsights(input: {
  subscriptions: Array<{
    providerName: string;
    amountCents: number;
    currency: string;
    billingInterval: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "UNKNOWN";
  }>;
}): Promise<SavingsInsights> {
  const client = getOpenAI();

  const messages = [
    {
      role: "system" as const,
      content:
        "You are a cost-optimization assistant. You analyze subscription lists and propose savings ideas. Output ONLY valid JSON.",
    },
    {
      role: "user" as const,
      content: [
        "Given the subscriptions list, propose savings suggestions (duplicates, rarely used, annual vs monthly, bundle opportunities, etc.).",
        "Return JSON with shape:",
        "{",
        '  "summary": string,',
        '  "suggestions": [',
        "    {",
        '      "title": string,',
        '      "details": string,',
        '      "estimatedMonthlySavingsCents"?: integer,',
        '      "currency"?: string,',
        '      "actionSteps": string[]',
        "    }",
        "  ]",
        "}",
        "",
        "Rules:",
        "- Keep it realistic. If you can't estimate savings, omit estimatedMonthlySavingsCents/currency.",
        "- Write in Polish.",
        "",
        "Subscriptions:",
        JSON.stringify(input.subscriptions, null, 2),
      ].join("\n"),
    },
  ];

  const completion = await client.chat.completions.create({
    model: env.OPENAI_MODEL,
    messages,
    temperature: 0.4,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content ?? "{}";
  const json = JSON.parse(content) as unknown;
  return InsightsSchema.parse(json);
}

