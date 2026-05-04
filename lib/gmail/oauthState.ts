import crypto from "node:crypto";

import { normalizeRedirectPath } from "@/lib/auth/normalizeRedirectPath";

export const GOOGLE_OAUTH_STATE_COOKIE = "asm_google_oauth_state";

export type GoogleOAuthFlow = "login" | "connect" | "compose" | "mailer";

export type GoogleOAuthState = {
  nonce: string;
  flow: GoogleOAuthFlow;
  next: string;
};

export function createGoogleOAuthState(
  flow: GoogleOAuthFlow,
  next?: string | null,
): GoogleOAuthState {
  const fallbackNext =
    flow === "login"
      ? "/dashboard"
      : flow === "mailer"
        ? "/dashboard/settings"
        : "/dashboard";

  return {
    nonce: crypto.randomBytes(16).toString("hex"),
    flow,
    next: normalizeRedirectPath(next, fallbackNext),
  };
}

export function serializeGoogleOAuthState(state: GoogleOAuthState) {
  return JSON.stringify(state);
}

export function parseGoogleOAuthState(
  value: string | undefined,
): GoogleOAuthState | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<GoogleOAuthState>;
    if (
      typeof parsed.nonce !== "string" ||
      (parsed.flow !== "login" &&
        parsed.flow !== "connect" &&
        parsed.flow !== "compose" &&
        parsed.flow !== "mailer")
    ) {
      return null;
    }

    const fallbackNext =
      parsed.flow === "login"
        ? "/dashboard"
        : parsed.flow === "mailer"
          ? "/dashboard/settings"
          : "/dashboard";

    return {
      nonce: parsed.nonce,
      flow: parsed.flow,
      next: normalizeRedirectPath(parsed.next, fallbackNext),
    };
  } catch {
    return null;
  }
}

export function googleOAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  };
}
