import { SignJWT, jwtVerify } from "jose";

import { env } from "@/lib/env";
import { sendMail } from "@/lib/notifications/mailer";

type EmailVerificationClaims = {
  email: string;
  type: "email-verification";
};

function getSecretKey() {
  return new TextEncoder().encode(env.JWT_SECRET);
}

export async function signEmailVerificationToken(user: {
  id: string;
  email: string;
}) {
  return new SignJWT({
    email: user.email,
    type: "email-verification",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(
      Math.floor(Date.now() / 1000) + env.EMAIL_VERIFICATION_TTL_SECONDS,
    )
    .sign(getSecretKey());
}

export async function verifyEmailVerificationToken(token: string): Promise<{
  id: string;
  email: string;
} | null> {
  try {
    const { payload } = await jwtVerify<EmailVerificationClaims>(
      token,
      getSecretKey(),
    );

    if (
      payload.type !== "email-verification" ||
      !payload.sub ||
      typeof payload.email !== "string"
    ) {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

export async function sendAccountVerificationEmail(user: {
  id: string;
  email: string;
}) {
  const token = await signEmailVerificationToken(user);
  const verificationUrl = new URL("/api/auth/verify-email", env.APP_BASE_URL);
  verificationUrl.searchParams.set("token", token);

  const expiresHours = Math.max(
    1,
    Math.round(env.EMAIL_VERIFICATION_TTL_SECONDS / 3600),
  );

  await sendMail({
    to: user.email,
    subject: "Potwierdz adres email w Subly",
    text: [
      "Czesc!",
      "",
      "Dziekujemy za zalozenie konta w Subly.",
      `Potwierdz swoj adres email, klikajac w link: ${verificationUrl.toString()}`,
      "",
      `Link wygasa za okolo ${expiresHours} h.`,
      "",
      "Jesli to nie Ty tworzyles konto, zignoruj te wiadomosc.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Potwierdz adres email w Subly</h2>
        <p>Dziekujemy za zalozenie konta. Kliknij przycisk ponizej, aby aktywowac konto:</p>
        <p>
          <a
            href="${verificationUrl.toString()}"
            style="display:inline-block;padding:12px 20px;border-radius:12px;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:600;"
          >
            Potwierdz email
          </a>
        </p>
        <p>Jesli przycisk nie dziala, otworz ten link:</p>
        <p><a href="${verificationUrl.toString()}">${verificationUrl.toString()}</a></p>
        <p>Link wygasa za okolo ${expiresHours} h.</p>
      </div>
    `,
  });

  return {
    verificationUrl: verificationUrl.toString(),
  };
}
