import crypto from "node:crypto";
import { google } from "googleapis";
import { NextResponse, type NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/auth/authenticateRequest";
import { signAccessToken } from "@/lib/auth/jwt";
import {
  issueRefreshToken,
  storeOAuthRefreshToken,
} from "@/lib/auth/refreshToken";
import { hashPassword } from "@/lib/auth/password";
import { setAuthCookies } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { encryptString } from "@/lib/crypto/encryption";
import { getGoogleOAuth2Client } from "@/lib/gmail/oauth";
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  googleOAuthCookieOptions,
  parseGoogleOAuthState,
} from "@/lib/gmail/oauthState";

export const runtime = "nodejs";

function clearOAuthCookie(response: NextResponse) {
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, "", {
    ...googleOAuthCookieOptions(),
    maxAge: 0,
  });
}

function redirectWithParams(
  request: NextRequest,
  pathname: string,
  params: Record<string, string>,
) {
  const url = new URL(pathname, request.url);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url);
}

async function upsertGmailAccount(input: {
  userId: string;
  gmailAddress: string;
  refreshToken?: string;
  accessToken?: string | null;
  expiryDate?: number | null;
  scope?: string | null;
}) {
  const existing = await prisma.gmailAccount.findFirst({
    where: {
      userId: input.userId,
      gmailAddress: input.gmailAddress,
    },
    orderBy: { updatedAt: "desc" },
    select: {
      encryptedRefreshToken: true,
    },
  });

  const refreshToken = input.refreshToken
    ? encryptString(input.refreshToken)
    : existing?.encryptedRefreshToken;

  if (!refreshToken) {
    return false;
  }

  await prisma.gmailAccount.upsert({
    where: {
      userId_gmailAddress: {
        userId: input.userId,
        gmailAddress: input.gmailAddress,
      },
    },
    create: {
      userId: input.userId,
      gmailAddress: input.gmailAddress,
      encryptedRefreshToken: refreshToken,
      encryptedAccessToken: input.accessToken
        ? encryptString(input.accessToken)
        : null,
      accessTokenExpiresAt: input.expiryDate ? new Date(input.expiryDate) : null,
      scopes: (input.scope ?? "").toString(),
    },
    update: {
      encryptedRefreshToken: refreshToken,
      encryptedAccessToken: input.accessToken
        ? encryptString(input.accessToken)
        : null,
      accessTokenExpiresAt: input.expiryDate ? new Date(input.expiryDate) : null,
      scopes: (input.scope ?? "").toString(),
      updatedAt: new Date(),
    },
  });

  if (input.refreshToken) {
    await storeOAuthRefreshToken({
      userId: input.userId,
      rawToken: input.refreshToken,
      type: "GMAIL",
      providerEmail: input.gmailAddress,
    });
  }

  return true;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieValue = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  const cookieState = parseGoogleOAuthState(cookieValue);

  if (!code || !state || !cookieState || state !== cookieState.nonce) {
    const res = redirectWithParams(request, "/login", { google: "error" });
    clearOAuthCookie(res);
    return res;
  }

  const oauth2 = getGoogleOAuth2Client();

  try {
    const { tokens } = await oauth2.getToken(code);
    oauth2.setCredentials(tokens);

    const oauth2Api = google.oauth2({ version: "v2", auth: oauth2 });
    const profile = await oauth2Api.userinfo.get();
    const gmailAddress = profile.data.email?.toLowerCase().trim();

    if (!gmailAddress) {
      const res = redirectWithParams(request, "/login", { google: "error" });
      clearOAuthCookie(res);
      return res;
    }

    if (cookieState.flow === "connect") {
      const auth = await authenticateRequest(request);
      if (!auth) {
        const res = redirectWithParams(request, "/login", { next: "/dashboard" });
        clearOAuthCookie(res);
        return res;
      }

      const accountSaved = await upsertGmailAccount({
        userId: auth.user.id,
        gmailAddress,
        refreshToken: tokens.refresh_token ?? undefined,
        accessToken: tokens.access_token ?? null,
        expiryDate: tokens.expiry_date ?? null,
        scope: tokens.scope ?? null,
      });

      const res = NextResponse.redirect(
        new URL(
          accountSaved
            ? "/dashboard?gmail=connected"
            : "/dashboard?gmail=missing_refresh_token",
          request.url,
        ),
      );

      if (auth.session) {
        setAuthCookies(res, auth.session);
      }

      clearOAuthCookie(res);
      return res;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: gmailAddress },
      select: {
        id: true,
        email: true,
        plan: true,
        isVerified: true,
      },
    });

    let userId = existingUser?.id;

    if (!userId) {
      const randomPasswordHash = await hashPassword(
        crypto.randomUUID() + crypto.randomUUID(),
      );

      const createdUser = await prisma.user.create({
        data: {
          email: gmailAddress,
          passwordHash: randomPasswordHash,
          isVerified: true,
        },
        select: {
          id: true,
        },
      });

      userId = createdUser.id;
    } else if (existingUser && !existingUser.isVerified) {
      await prisma.user.update({
        where: { id: userId },
        data: { isVerified: true },
      });
    }

    const accountSaved = await upsertGmailAccount({
      userId,
      gmailAddress,
      refreshToken: tokens.refresh_token ?? undefined,
      accessToken: tokens.access_token ?? null,
      expiryDate: tokens.expiry_date ?? null,
      scope: tokens.scope ?? null,
    });

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({ id: userId }),
      issueRefreshToken(userId),
    ]);

    const targetUrl = new URL(cookieState.next, request.url);
    if (!accountSaved) {
      targetUrl.searchParams.set("google", "missing_refresh_token");
    }

    const res = NextResponse.redirect(targetUrl);
    setAuthCookies(res, {
      accessToken,
      refreshToken: refreshToken.token,
    });

    clearOAuthCookie(res);
    return res;
  } catch (error) {
    console.error("Google OAuth callback failed", error);
    const res = redirectWithParams(request, "/login", { google: "error" });
    clearOAuthCookie(res);
    return res;
  }
}
