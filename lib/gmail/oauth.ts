import { google } from "googleapis";

import { env } from "@/lib/env";
import { GOOGLE_APP_SCOPES } from "@/lib/gmail/scopes";

export function getGoogleOAuth2Client() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new Error("Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET.");
  }
  const redirectUri =
    env.GOOGLE_REDIRECT_URI ?? `${env.APP_BASE_URL}/api/gmail/callback`;

  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  );
}

export function getGoogleAuthUrl(state: string, scopes = GOOGLE_APP_SCOPES) {
  const oauth2 = getGoogleOAuth2Client();
  return oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [...scopes],
    state,
  });
}
