{
  /* TO DO separate gmail scopes(gmail_send_scopes/google_identity_scopes) */
}

export const GMAIL_SCOPES = ["https://mail.google.com/"] as const;

export const GOOGLE_IDENTITY_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
] as const;

export const GOOGLE_APP_SCOPES = [
  ...GOOGLE_IDENTITY_SCOPES,
  ...GMAIL_SCOPES,
] as const;
