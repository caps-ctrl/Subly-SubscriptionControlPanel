import { env } from "@/lib/env";

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
};

export async function sendMail(input: SendMailInput) {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM) {
    throw new Error("Missing RESEND_API_KEY/RESEND_FROM.");
  }

  const { Resend } = await import("resend");
  const resend = new Resend(env.RESEND_API_KEY);

  const result = await resend.emails.send({
    from: env.RESEND_FROM,
    to: input.to,
    subject: input.subject,
    text: input.text,
  });

  if (result.error) {
    throw new Error(`Resend error: ${result.error.message}`);
  }

  return { id: result.data?.id ?? null };
}
