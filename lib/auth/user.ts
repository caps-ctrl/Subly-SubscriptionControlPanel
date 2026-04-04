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

export async function getAuthUserById(id: string): Promise<AuthUser | null> {
  return prisma.user.findUnique({
    where: { id },
    select: authUserSelect,
  });
}
