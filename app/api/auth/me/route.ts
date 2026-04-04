import { NextResponse, type NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/auth/authenticateRequest";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    const res = NextResponse.json({ user: null }, { status: 200 });
    clearAuthCookies(res);
    return res;
  }

  const res = NextResponse.json({ user: auth.user }, { status: 200 });
  if (auth.session) {
    setAuthCookies(res, auth.session);
  }

  return res;
}
