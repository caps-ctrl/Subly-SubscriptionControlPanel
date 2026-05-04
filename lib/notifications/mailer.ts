import { env } from "@/lib/env";
import nodemailer from "nodemailer";

import { getStoredOAuthRefreshToken } from "@/lib/auth/refreshToken";

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

async function getTransporter() {
  if (
    !env.SMTP_HOST ||
    !env.SMTP_PORT ||
    !env.SMTP_USER ||
    !env.GOOGLE_CLIENT_ID ||
    !env.GOOGLE_CLIENT_SECRET
  ) {
    throw new Error(
      "Missing SMTP_HOST/SMTP_PORT/SMTP_USER/GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET.",
    );
  }

  const refreshToken = await getStoredOAuthRefreshToken({
    type: "GMAIL_SMTP",
    providerEmail: env.SMTP_USER!,
  });

  if (!refreshToken) {
    throw new Error(
      `Missing stored Gmail SMTP refresh token for SMTP_USER=${env.SMTP_USER}.`,
    );
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      type: "OAuth2",
      user: env.SMTP_USER,
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      refreshToken,
    },
  });
}

export async function sendMail(input: SendMailInput) {
  if (!env.SMTP_FROM) {
    throw new Error("Missing SMTP_FROM.");
  }

  const transport = await getTransporter();

  const result = await transport.sendMail({
    from: env.SMTP_FROM,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });

  return { id: result.messageId ?? null };
}
