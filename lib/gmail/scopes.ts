export const GMAIL_FULL_ACCESS_SCOPE = "https://mail.google.com/" as const;
export const GMAIL_READONLY_SCOPE =
  "https://www.googleapis.com/auth/gmail.readonly" as const;
export const GMAIL_COMPOSE_SCOPE =
  "https://www.googleapis.com/auth/gmail.compose" as const;

export const GOOGLE_IDENTITY_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
] as const;

export const GOOGLE_LOGIN_SCOPES = [...GOOGLE_IDENTITY_SCOPES] as const;

export const GOOGLE_GMAIL_READONLY_SCOPES = [
  ...GOOGLE_IDENTITY_SCOPES,
  GMAIL_READONLY_SCOPE,
] as const;

export const GOOGLE_GMAIL_COMPOSE_SCOPES = [
  ...GOOGLE_IDENTITY_SCOPES,
  GMAIL_READONLY_SCOPE,
  GMAIL_COMPOSE_SCOPE,
] as const;

export const GOOGLE_GMAIL_MAILER_SCOPES = [
  ...GOOGLE_IDENTITY_SCOPES,
  GMAIL_FULL_ACCESS_SCOPE,
] as const;

function splitGrantedScopes(scopes: string | null | undefined) {
  return new Set(
    (scopes ?? "")
      .split(/\s+/)
      .map((scope) => scope.trim())
      .filter(Boolean),
  );
}

export function hasGrantedScope(
  scopes: string | null | undefined,
  requiredScope: string,
) {
  const granted = splitGrantedScopes(scopes);

  if (granted.has(requiredScope)) {
    return true;
  }

  if (
    granted.has(GMAIL_FULL_ACCESS_SCOPE) &&
    requiredScope.startsWith("https://www.googleapis.com/auth/gmail.")
  ) {
    return true;
  }

  return false;
}

export function mergeGrantedScopes(
  ...scopes: Array<string | null | undefined>
) {
  return [...new Set(scopes.flatMap((scope) => [...splitGrantedScopes(scope)]))]
    .filter(Boolean)
    .join(" ");
}

export function canReadGmail(scopes: string | null | undefined) {
  return hasGrantedScope(scopes, GMAIL_READONLY_SCOPE);
}

export function canCreateGmailDrafts(scopes: string | null | undefined) {
  return hasGrantedScope(scopes, GMAIL_COMPOSE_SCOPE);
}

export function getGmailScopeLabel(scopes: string | null | undefined) {
  if (hasGrantedScope(scopes, GMAIL_FULL_ACCESS_SCOPE)) {
    return "Pełny dostęp Gmail";
  }

  if (canReadGmail(scopes) && canCreateGmailDrafts(scopes)) {
    return "Odczyt i szkice Gmail";
  }

  if (canReadGmail(scopes)) {
    return "Tylko odczyt Gmail";
  }

  if (canCreateGmailDrafts(scopes)) {
    return "Szkice Gmail";
  }

  return "Brak dostępu do Gmail";
}
