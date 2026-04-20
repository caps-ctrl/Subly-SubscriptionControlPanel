import crypto from "node:crypto";

import { normalizeRedirectPath } from "@/lib/auth/normalizeRedirectPath";

export const GOOGLE_OAUTH_STATE_COOKIE = "asm_google_oauth_state";

export type GoogleOAuthFlow = "login" | "connect";

export type GoogleOAuthState = {
  nonce: string;
  flow: GoogleOAuthFlow;
  next: string;
};

export function createGoogleOAuthState(
  flow: GoogleOAuthFlow,
  next?: string | null,
): GoogleOAuthState {
  return {
    nonce: crypto.randomBytes(16).toString("hex"),
    flow,
    next:
      flow === "login"
        ? normalizeRedirectPath(next, "/dashboard")
        : "/dashboard",
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
      (parsed.flow !== "login" && parsed.flow !== "connect")
    ) {
      return null;
    }

    return {
      nonce: parsed.nonce,
      flow: parsed.flow,
      next:
        parsed.flow === "login"
          ? normalizeRedirectPath(parsed.next, "/dashboard")
          : "/dashboard",
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
