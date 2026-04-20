import crypto from "node:crypto";
import type { Prisma, RefreshTokenType } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { env } from "@/lib/env";
import { decryptString, encryptString } from "@/lib/crypto/encryption";
import {
  authUserWithVerificationSelect,
  toVerifiedAuthUser,
  type AuthUser,
  type AuthUserRecord,
} from "@/lib/auth/user";

type RefreshSession = {
  tokenId: string;
  user: AuthUser;
  expiresAt: Date;
};

type RotatedRefreshSession = RefreshSession & {
  refreshToken: string;
};

type DbClient = Prisma.TransactionClient | typeof prisma;

type RefreshTokenRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  type: RefreshTokenType;
  providerEmail: string | null;
  encryptedToken: string | null;
  tokenUsed: boolean;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByTokenId: string | null;
  user: AuthUserRecord;
};

const GMAIL_REFRESH_TOKEN_EXPIRY = new Date("9999-12-31T23:59:59.999Z");

function hashTokenSecret(secret: string) {
  return crypto.createHash("sha256").update(secret).digest("hex");
}

function createRefreshTokenSecret() {
  return crypto.randomBytes(32).toString("base64url");
}

function buildRefreshTokenValue(id: string, secret: string) {
  return `${id}.${secret}`;
}

function parseRefreshTokenValue(token: string) {
  const separatorIndex = token.indexOf(".");
  if (separatorIndex <= 0 || separatorIndex === token.length - 1) {
    return null;
  }

  return {
    id: token.slice(0, separatorIndex),
    secret: token.slice(separatorIndex + 1),
  };
}

function getRefreshTokenExpiry() {
  return new Date(Date.now() + env.REFRESH_TOKEN_TTL_SECONDS * 1000);
}

async function getRefreshTokenRecord(
  db: DbClient,
  id: string,
): Promise<RefreshTokenRecord | null> {
  return db.refreshToken.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      tokenHash: true,
      type: true,
      providerEmail: true,
      encryptedToken: true,
      tokenUsed: true,
      expiresAt: true,
      revokedAt: true,
      replacedByTokenId: true,
      user: {
        select: authUserWithVerificationSelect,
      },
    },
  }) as Promise<RefreshTokenRecord | null>;
}

async function revokeRefreshTokenChain(db: DbClient, startId: string) {
  const ids: string[] = [];
  let currentId: string | null = startId;

  while (currentId) {
    const currentToken: {
      id: string;
      replacedByTokenId: string | null;
    } | null = await db.refreshToken.findUnique({
      where: { id: currentId },
      select: {
        id: true,
        replacedByTokenId: true,
      },
    });

    if (!currentToken) break;
    ids.push(currentToken.id);
    currentId = currentToken.replacedByTokenId;
  }

  if (ids.length === 0) return;

  await db.refreshToken.updateMany({
    where: {
      id: { in: ids },
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

export async function issueRefreshToken(
  userId: string,
): Promise<{ token: string; expiresAt: Date }> {
  const secret = createRefreshTokenSecret();
  const expiresAt = getRefreshTokenExpiry();

  const refreshToken = await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashTokenSecret(secret),
      type: "AUTH",
      providerEmail: null,
      encryptedToken: null,
      expiresAt,
    },
    select: {
      id: true,
      expiresAt: true,
    },
  });

  return {
    token: buildRefreshTokenValue(refreshToken.id, secret),
    expiresAt: refreshToken.expiresAt,
  };
}

export async function validateRefreshToken(
  token: string,
): Promise<RefreshSession | null> {
  const parsed = parseRefreshTokenValue(token);
  if (!parsed) return null;

  return prisma.$transaction(async (tx) => {
    const refreshToken = await getRefreshTokenRecord(tx, parsed.id);
    if (!refreshToken) return null;
    if (refreshToken.type !== "AUTH") return null;
    if (refreshToken.tokenHash !== hashTokenSecret(parsed.secret)) return null;

    if (refreshToken.tokenUsed) {
      await revokeRefreshTokenChain(tx, refreshToken.id);
      return null;
    }

    if (refreshToken.revokedAt) return null;
    if (refreshToken.expiresAt.getTime() <= Date.now()) return null;

    const verifiedUser = toVerifiedAuthUser(refreshToken.user);
    if (!verifiedUser) return null;

    return {
      tokenId: refreshToken.id,
      user: verifiedUser,
      expiresAt: refreshToken.expiresAt,
    };
  });
}

export async function rotateRefreshToken(
  token: string,
): Promise<RotatedRefreshSession | null> {
  const parsed = parseRefreshTokenValue(token);
  if (!parsed) return null;

  return prisma.$transaction(async (tx) => {
    const refreshToken = await getRefreshTokenRecord(tx, parsed.id);

    if (!refreshToken) return null;
    if (refreshToken.type !== "AUTH") return null;
    if (refreshToken.tokenHash !== hashTokenSecret(parsed.secret)) return null;
    if (refreshToken.tokenUsed) {
      await revokeRefreshTokenChain(tx, refreshToken.id);
      return null;
    }
    if (refreshToken.revokedAt) return null;
    if (refreshToken.expiresAt.getTime() <= Date.now()) return null;

    const verifiedUser = toVerifiedAuthUser(refreshToken.user);
    if (!verifiedUser) return null;

    const revokedAt = new Date();
    const claimed = await tx.refreshToken.updateMany({
      where: {
        id: refreshToken.id,
        tokenHash: refreshToken.tokenHash,
        tokenUsed: false,
        revokedAt: null,
      },
      data: {
        tokenUsed: true,
        revokedAt: revokedAt,
      },
    });

    if (claimed.count !== 1) {
      await revokeRefreshTokenChain(tx, refreshToken.id);
      return null;
    }

    const nextSecret = createRefreshTokenSecret();
    const nextExpiresAt = getRefreshTokenExpiry();

    const nextRefreshToken = await tx.refreshToken.create({
      data: {
        userId: refreshToken.userId,
        tokenHash: hashTokenSecret(nextSecret),
        type: "AUTH",
        providerEmail: null,
        encryptedToken: null,
        expiresAt: nextExpiresAt,
      },
      select: {
        id: true,
        expiresAt: true,
      },
    });

    await tx.refreshToken.update({
      where: { id: refreshToken.id },
      data: {
        replacedByTokenId: nextRefreshToken.id,
      },
    });

    return {
      tokenId: nextRefreshToken.id,
      user: verifiedUser,
      expiresAt: nextRefreshToken.expiresAt,
      refreshToken: buildRefreshTokenValue(nextRefreshToken.id, nextSecret),
    };
  });
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const parsed = parseRefreshTokenValue(token);
  if (!parsed) return;

  await prisma.refreshToken.updateMany({
    where: {
      id: parsed.id,
      tokenHash: hashTokenSecret(parsed.secret),
      type: "AUTH",
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

export async function storeOAuthRefreshToken(input: {
  userId: string;
  rawToken: string;
  type: Exclude<RefreshTokenType, "AUTH">;
  providerEmail: string;
}) {
  const tokenHash = hashTokenSecret(input.rawToken);
  const encryptedToken = encryptString(input.rawToken);
  const revokedAt = new Date();

  await prisma.$transaction(async (tx) => {
    const existing = await tx.refreshToken.findFirst({
      where: {
        userId: input.userId,
        type: input.type,
        providerEmail: input.providerEmail,
        revokedAt: null,
      },
      select: {
        id: true,
        tokenHash: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    if (existing?.tokenHash === tokenHash) {
      await tx.refreshToken.update({
        where: { id: existing.id },
        data: {
          encryptedToken,
          tokenUsed: false,
          replacedByTokenId: null,
          expiresAt: GMAIL_REFRESH_TOKEN_EXPIRY,
        },
      });
      return;
    }

    await tx.refreshToken.updateMany({
      where: {
        userId: input.userId,
        type: input.type,
        providerEmail: input.providerEmail,
        revokedAt: null,
      },
      data: {
        revokedAt,
      },
    });

    await tx.refreshToken.upsert({
      where: { tokenHash },
      update: {
        userId: input.userId,
        type: input.type,
        providerEmail: input.providerEmail,
        encryptedToken,
        tokenUsed: false,
        revokedAt: null,
        replacedByTokenId: null,
        expiresAt: GMAIL_REFRESH_TOKEN_EXPIRY,
      },
      create: {
        userId: input.userId,
        tokenHash,
        type: input.type,
        providerEmail: input.providerEmail,
        encryptedToken,
        expiresAt: GMAIL_REFRESH_TOKEN_EXPIRY,
      },
    });
  });
}

export async function getStoredOAuthRefreshToken(input: {
  type: Exclude<RefreshTokenType, "AUTH">;
  providerEmail: string;
}) {
  const token = await prisma.refreshToken.findFirst({
    where: {
      type: input.type,
      providerEmail: input.providerEmail,
      revokedAt: null,
      encryptedToken: {
        not: null,
      },
    },
    select: {
      encryptedToken: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!token?.encryptedToken) {
    return null;
  }

  return decryptString(token.encryptedToken);
}
