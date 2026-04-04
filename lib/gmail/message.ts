import type { gmail_v1 } from "googleapis";

function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  const padded =
    normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

function findPart(
  payload: gmail_v1.Schema$MessagePart | undefined,
  mimeType: string,
): gmail_v1.Schema$MessagePart | undefined {
  if (!payload) return undefined;
  if (payload.mimeType === mimeType) return payload;
  const parts = payload.parts ?? [];
  for (const part of parts) {
    const found = findPart(part, mimeType);
    if (found) return found;
  }
  return undefined;
}

export function getHeader(
  message: gmail_v1.Schema$Message,
  name: string,
): string | null {
  const headers = message.payload?.headers ?? [];
  const found = headers.find((h) => (h.name ?? "").toLowerCase() === name);
  return found?.value ?? null;
}

export function extractEmailText(message: gmail_v1.Schema$Message): string {
  const snippet = message.snippet ?? "";
  const payload = message.payload;
  const plain = findPart(payload, "text/plain")?.body?.data;
  const html = findPart(payload, "text/html")?.body?.data;

  const bodyRaw = plain ?? html ?? "";
  const body = bodyRaw ? decodeBase64Url(bodyRaw) : "";
  const safeBody = body
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const combined = [snippet, safeBody].filter(Boolean).join("\n\n");
  return combined.slice(0, 6000);
}

