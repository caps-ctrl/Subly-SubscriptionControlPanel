import OpenAI from "openai";

import { env } from "@/lib/env";

let cached: OpenAI | null = null;

export function getOpenAI() {
  if (!env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY.");
  }
  if (!cached) {
    cached = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return cached;
}

