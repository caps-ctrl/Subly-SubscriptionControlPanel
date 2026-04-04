import { SignJWT, jwtVerify } from "jose";

import { env } from "@/lib/env";

export type AccessTokenClaims = {
  id: string;
};

type AccessTokenPayload = {
  sub: string;
  type: "access";
};

function getSecretKey() {
  return new TextEncoder().encode(env.JWT_SECRET);
}

export async function signAccessToken(user: AccessTokenClaims): Promise<string> {
  const payload: AccessTokenPayload = {
    sub: user.id,
    type: "access",
  };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(
      Math.floor(Date.now() / 1000) + env.ACCESS_TOKEN_TTL_SECONDS,
    )
    .sign(getSecretKey());
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenClaims | null> {
  try {
    const { payload } = await jwtVerify<AccessTokenPayload>(
      token,
      getSecretKey(),
    );

    if (!payload.sub || payload.type !== "access") return null;
    return { id: payload.sub };
  } catch {
    return null;
  }
}

export const signSessionToken = signAccessToken;
export const verifySessionToken = verifyAccessToken;
