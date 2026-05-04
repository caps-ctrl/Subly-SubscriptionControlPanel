import { google } from "googleapis";

import { env } from "@/lib/env";

type GoogleAuthUrlOptions = {
  scopes: readonly string[];
  includeGrantedScopes?: boolean;
  loginHint?: string;
  prompt?: "consent" | "select_account";
};

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

export function getGoogleAuthUrl(
  state: string,
  options: GoogleAuthUrlOptions,
) {
  const oauth2 = getGoogleOAuth2Client();
  return oauth2.generateAuthUrl({
    access_type: "offline",
    include_granted_scopes: options.includeGrantedScopes,
    login_hint: options.loginHint,
    prompt: options.prompt,
    scope: [...options.scopes],
    state,
  });
}
