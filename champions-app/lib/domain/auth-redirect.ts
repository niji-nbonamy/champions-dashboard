export const DEFAULT_POST_AUTH_REDIRECT = "/dictations";

export function sanitizeCallbackUrl(
  callbackUrl: string | null | undefined
): string {
  if (!callbackUrl?.trim()) {
    return DEFAULT_POST_AUTH_REDIRECT;
  }

  const value = callbackUrl.trim();

  if (!value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_POST_AUTH_REDIRECT;
  }

  if (value.includes("://") || value.includes("\\")) {
    return DEFAULT_POST_AUTH_REDIRECT;
  }

  return value;
}

export function buildLoginRedirectPath(callbackPath: string): string {
  const safeCallback = sanitizeCallbackUrl(callbackPath);
  const params = new URLSearchParams({ callbackUrl: safeCallback });
  return `/login?${params.toString()}`;
}
