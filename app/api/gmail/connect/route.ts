import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { withAuth } from "@/lib/auth/withAuth";
import { getGoogleAuthUrl } from "@/lib/gmail/oauth";

export const runtime = "nodejs";

const OAUTH_STATE_COOKIE = "asm_google_oauth_state";

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      const state = crypto.randomBytes(16).toString("hex");
      const authUrl = getGoogleAuthUrl(state);

      const res = NextResponse.redirect(authUrl);
      res.cookies.set(OAUTH_STATE_COOKIE, state, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 10,
      });
      return res;
    },
    {
      onUnauthorized: () => NextResponse.redirect(new URL("/login", request.url)),
    },
  );
}
