import { prisma } from "../lib/db/prisma";
import { env } from "../lib/env";
import { storeOAuthRefreshToken } from "../lib/auth/refreshToken";

async function main() {
  const rawToken = process.argv[2]?.trim();
  const smtpUser = env.SMTP_USER?.toLowerCase().trim();

  if (!smtpUser) {
    throw new Error("Missing SMTP_USER in environment.");
  }

  if (!rawToken) {
    throw new Error("Pass the Gmail SMTP refresh token as the first argument.");
  }

  const gmailAccount = await prisma.gmailAccount.findFirst({
    where: { gmailAddress: smtpUser },
    orderBy: { updatedAt: "desc" },
    select: {
      userId: true,
      gmailAddress: true,
    },
  });

  const user =
    gmailAccount ??
    (await prisma.user.findUnique({
      where: { email: smtpUser },
      select: {
        id: true,
        email: true,
      },
    }).then((record) =>
      record
        ? { userId: record.id, gmailAddress: record.email.toLowerCase().trim() }
        : null,
    ));

  if (!user) {
    throw new Error(
      `Could not find a user or Gmail account for SMTP_USER=${smtpUser}.`,
    );
  }

  await storeOAuthRefreshToken({
    userId: user.userId,
    rawToken,
    type: "GMAIL_SMTP",
    providerEmail: smtpUser,
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        type: "GMAIL_SMTP",
        providerEmail: smtpUser,
        userId: user.userId,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
