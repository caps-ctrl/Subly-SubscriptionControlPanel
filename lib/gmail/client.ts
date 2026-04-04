import { google } from "googleapis";

import { prisma } from "@/lib/db/prisma";
import { decryptString } from "@/lib/crypto/encryption";
import { getGoogleOAuth2Client } from "@/lib/gmail/oauth";

export async function getGmailForUser(userId: string) {
  const account = await prisma.gmailAccount.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  if (!account) return null;

  const oauth2 = getGoogleOAuth2Client();
  oauth2.setCredentials({
    refresh_token: decryptString(account.encryptedRefreshToken),
    access_token: account.encryptedAccessToken
      ? decryptString(account.encryptedAccessToken)
      : undefined,
    expiry_date: account.accessTokenExpiresAt?.getTime(),
  });

  const gmail = google.gmail({ version: "v1", auth: oauth2 });
  return { gmail, account };
}

