import { NextResponse, type NextRequest } from "next/server";

import { getGoogleAuthUrl } from "@/lib/gmail/oauth";
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  createGoogleOAuthState,
  googleOAuthCookieOptions,
  serializeGoogleOAuthState,
} from "@/lib/gmail/oauthState";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next");
  const oauthState = createGoogleOAuthState("login", next);
  const authUrl = getGoogleAuthUrl(oauthState.nonce);

  const res = NextResponse.redirect(authUrl);
  res.cookies.set(
    GOOGLE_OAUTH_STATE_COOKIE,
    serializeGoogleOAuthState(oauthState),
    googleOAuthCookieOptions(),
  );
  return res;
}
