import { NextResponse, type NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/auth/authenticateRequest";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/session";
import type { AuthUser } from "@/lib/auth/user";

type WithAuthOptions = {
  onUnauthorized?: () => Promise<NextResponse> | NextResponse;
};

export async function withAuth(
  request: NextRequest,
  handler: (user: AuthUser) => Promise<NextResponse> | NextResponse,
  options?: WithAuthOptions,
): Promise<NextResponse> {
  const auth = await authenticateRequest(request);
  if (!auth) {
    const response = options?.onUnauthorized
      ? await options.onUnauthorized()
      : NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    clearAuthCookies(response);
    return response;
  }

  const response = await handler(auth.user);
  if (auth.session) {
    setAuthCookies(response, auth.session);
  }

  return response;
}
