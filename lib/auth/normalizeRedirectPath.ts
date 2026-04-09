export function normalizeRedirectPath(
  value: string | null | undefined,
  fallback: string,
) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  if (value === "/login" || value === "/register") {
    return fallback;
  }

  return value;
}
