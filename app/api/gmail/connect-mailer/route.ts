import { NextResponse, type NextRequest } from "next/server";

import { withAuth } from "@/lib/auth/withAuth";
import { env } from "@/lib/env";
import { getGoogleAuthUrl } from "@/lib/gmail/oauth";
import { GOOGLE_GMAIL_MAILER_SCOPES } from "@/lib/gmail/scopes";
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  createGoogleOAuthState,
  googleOAuthCookieOptions,
  serializeGoogleOAuthState,
} from "@/lib/gmail/oauthState";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async () => {
      const next = request.nextUrl.searchParams.get("next");
      const oauthState = createGoogleOAuthState("mailer", next);
      const authUrl = getGoogleAuthUrl(oauthState.nonce, {
        scopes: GOOGLE_GMAIL_MAILER_SCOPES,
        includeGrantedScopes: true,
        loginHint: env.SMTP_USER ?? undefined,
        prompt: "consent",
      });

      const res = NextResponse.redirect(authUrl);
      res.cookies.set(
        GOOGLE_OAUTH_STATE_COOKIE,
        serializeGoogleOAuthState(oauthState),
        googleOAuthCookieOptions(),
      );
      return res;
    },
    {
      onUnauthorized: () => NextResponse.redirect(new URL("/login", request.url)),
    },
  );
}
