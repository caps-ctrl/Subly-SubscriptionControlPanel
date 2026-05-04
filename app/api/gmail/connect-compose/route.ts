import { NextResponse, type NextRequest } from "next/server";

import { withAuth } from "@/lib/auth/withAuth";
import { prisma } from "@/lib/db/prisma";
import { getGoogleAuthUrl } from "@/lib/gmail/oauth";
import { GOOGLE_GMAIL_COMPOSE_SCOPES } from "@/lib/gmail/scopes";
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
    async (user) => {
      const [next, existingAccount] = await Promise.all([
        Promise.resolve(request.nextUrl.searchParams.get("next")),
        prisma.gmailAccount.findFirst({
          where: { userId: user.id },
          orderBy: { updatedAt: "desc" },
          select: { gmailAddress: true },
        }),
      ]);

      const oauthState = createGoogleOAuthState("compose", next);
      const authUrl = getGoogleAuthUrl(oauthState.nonce, {
        scopes: GOOGLE_GMAIL_COMPOSE_SCOPES,
        includeGrantedScopes: true,
        loginHint: existingAccount?.gmailAddress ?? undefined,
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
