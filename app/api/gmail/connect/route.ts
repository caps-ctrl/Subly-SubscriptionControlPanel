import { NextResponse, type NextRequest } from "next/server";

import { withAuth } from "@/lib/auth/withAuth";
import { getGoogleAuthUrl } from "@/lib/gmail/oauth";
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
      const oauthState = createGoogleOAuthState("connect");
      const authUrl = getGoogleAuthUrl(oauthState.nonce);

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
