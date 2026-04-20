import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export const authUserSelect = {
  id: true,
  email: true,
  plan: true,
} satisfies Prisma.UserSelect;

export type AuthUser = {
  id: string;
  email: string;
  plan: "FREE" | "PRO";
};

export type AuthUserRecord = AuthUser & {
  isVerified: boolean;
};

export const authUserWithVerificationSelect = {
  id: true,
  email: true,
  plan: true,
  isVerified: true,
} satisfies Prisma.UserSelect;

export function toVerifiedAuthUser(
  user: AuthUserRecord | null | undefined,
): AuthUser | null {
  if (!user || !user.isVerified) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    plan: user.plan,
  };
}

export async function getAuthUserById(id: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: authUserWithVerificationSelect,
  });

  return toVerifiedAuthUser(user);
}
