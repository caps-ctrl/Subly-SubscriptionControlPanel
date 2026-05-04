import { NextResponse, type NextRequest } from "next/server";

import { withAuth } from "@/lib/auth/withAuth";
import { prisma } from "@/lib/db/prisma";
import {
  canCreateGmailDrafts,
  canReadGmail,
  getGmailScopeLabel,
} from "@/lib/gmail/scopes";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const account = await prisma.gmailAccount.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { gmailAddress: true, scopes: true },
    });

    return NextResponse.json(
      {
        connected: Boolean(account && canReadGmail(account.scopes)),
        canCompose: Boolean(account && canCreateGmailDrafts(account.scopes)),
        gmailAddress: account?.gmailAddress ?? null,
        scopeLabel: getGmailScopeLabel(account?.scopes),
      },
      { status: 200 },
    );
  });
}
