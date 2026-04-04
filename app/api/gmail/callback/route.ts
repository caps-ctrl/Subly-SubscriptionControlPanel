import { NextResponse, type NextRequest } from "next/server";

import { withAuth } from "@/lib/auth/withAuth";
import { prisma } from "@/lib/db/prisma";
import { encryptString } from "@/lib/crypto/encryption";
import { getGoogleOAuth2Client } from "@/lib/gmail/oauth";

export const runtime = "nodejs";

const OAUTH_STATE_COOKIE = "asm_google_oauth_state";

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (user) => {
      const url = new URL(request.url);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const cookieState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;

      if (!code || !state || !cookieState || state !== cookieState) {
        const res = NextResponse.redirect(
          new URL("/dashboard?gmail=error", request.url),
        );
        res.cookies.set(OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
        return res;
      }

      const oauth2 = getGoogleOAuth2Client();
      const { tokens } = await oauth2.getToken(code);
      oauth2.setCredentials(tokens);

      const gmail = (await import("googleapis")).google.gmail({
        version: "v1",
        auth: oauth2,
      });
      const profile = await gmail.users.getProfile({ userId: "me" });
      const gmailAddress = profile.data.emailAddress;
      if (!gmailAddress) {
        const res = NextResponse.redirect(
          new URL("/dashboard?gmail=error", request.url),
        );
        res.cookies.set(OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
        return res;
      }

      const refreshToken = tokens.refresh_token;
      if (!refreshToken) {
        const res = NextResponse.redirect(
          new URL("/dashboard?gmail=missing_refresh_token", request.url),
        );
        res.cookies.set(OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
        return res;
      }

      await prisma.gmailAccount.upsert({
        where: { userId_gmailAddress: { userId: user.id, gmailAddress } },
        create: {
          userId: user.id,
          gmailAddress,
          encryptedRefreshToken: encryptString(refreshToken),
          encryptedAccessToken: tokens.access_token
            ? encryptString(tokens.access_token)
            : null,
          accessTokenExpiresAt: tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : null,
          scopes: (tokens.scope ?? "").toString(),
        },
        update: {
          encryptedRefreshToken: encryptString(refreshToken),
          encryptedAccessToken: tokens.access_token
            ? encryptString(tokens.access_token)
            : null,
          accessTokenExpiresAt: tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : null,
          scopes: (tokens.scope ?? "").toString(),
          updatedAt: new Date(),
        },
      });

      const res = NextResponse.redirect(
        new URL("/dashboard?gmail=connected", request.url),
      );
      res.cookies.set(OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
      return res;
    },
    {
      onUnauthorized: () => NextResponse.redirect(new URL("/login", request.url)),
    },
  );
}
