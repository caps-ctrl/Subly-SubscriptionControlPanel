import { z } from "zod";

import { env } from "@/lib/env";
import { getOpenAI } from "@/lib/openai/client";

const CancellationGuideSchema = z.object({
  summary: z.string().min(1).max(800),
  steps: z.array(z.string().min(1).max(400)).min(2).max(12),
  cancellationUrl: z.string().url().nullable().optional(),
  email: z
    .object({
      to: z.string().email().nullable().optional(),
      subject: z.string().min(1).max(200),
      bodyText: z.string().min(1).max(5000),
    })
    .nullable()
    .optional(),
  notes: z.string().max(1200).nullable().optional(),
});

export type CancellationGuide = z.infer<typeof CancellationGuideSchema>;

export async function generateCancellationGuide(input: {
  providerName: string;
  userCountry?: string;
  userLanguage?: "pl" | "en";
}): Promise<{ guide: CancellationGuide; model: string }> {
  const client = getOpenAI();

  const messages = [
    {
      role: "system" as const,
      content:
        "You are a helpful assistant that creates cancellation instructions for subscriptions. Output ONLY valid JSON.",
    },
    {
      role: "user" as const,
      content: [
        "Create step-by-step cancellation instructions for the subscription provider below.",
        "Return JSON with this shape:",
        "{",
        '  "summary": string,',
        '  "steps": string[],',
        '  "cancellationUrl": string|null,',
        '  "email": {"to": string|null, "subject": string, "bodyText": string}|null,',
        '  "notes": string|null',
        "}",
        "",
        "Guidelines:",
        "- Prefer official account/billing/cancel pages. If unknown, set cancellationUrl=null and explain in steps how to find it in-app.",
        "- Provide steps that work in 2026, but avoid claiming certainty about UI labels; write resilient instructions.",
        "- Keep it concise and actionable.",
        "",
        `Provider: ${input.providerName}`,
        `Language: ${input.userLanguage ?? "pl"}`,
        `Country: ${input.userCountry ?? "US"}`,
      ].join("\n"),
    },
  ];

  const completion = await client.chat.completions.create({
    model: env.OPENAI_MODEL,
    messages,
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content ?? "{}";
  const json = JSON.parse(content) as unknown;
  const guide = CancellationGuideSchema.parse(json);
  return { guide, model: env.OPENAI_MODEL };
}

