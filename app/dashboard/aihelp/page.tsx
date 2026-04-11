import { AiHelpWorkspace } from "@/components/dashboard/AiHelpWorkspace";
import { getServerUser } from "@/lib/auth/getServerUser";
import { prisma } from "@/lib/db/prisma";

export default async function AiHelpPage() {
  const user = await getServerUser();

  if (!user) {
    return (
      <section className="rounded-3xl border border-zinc-200 bg-white/80 p-8 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70 sm:p-10">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Pomoc AI
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
          Zaloguj się, żeby uruchomić agenta pomocy dla swoich subskrypcji.
        </p>
      </section>
    );
  }

  const [gmailAccount, subscriptions] = await Promise.all([
    prisma.gmailAccount.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { gmailAddress: true },
    }),
    prisma.subscription.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      select: {
        id: true,
        providerName: true,
        status: true,
        amountCents: true,
        currency: true,
        billingInterval: true,
        nextBillingDate: true,
        lastBilledAt: true,
        source: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ amountCents: "desc" }, { providerName: "asc" }],
    }),
  ]);

  const formattedSubscriptions = subscriptions.map((subscription) => ({
    ...subscription,
    nextBillingDate: subscription.nextBillingDate?.toISOString() ?? null,
    lastBilledAt: subscription.lastBilledAt?.toISOString() ?? null,
    createdAt: subscription.createdAt.toISOString(),
    updatedAt: subscription.updatedAt.toISOString(),
  }));

  return (
    <AiHelpWorkspace
      subscriptions={formattedSubscriptions}
      gmailAddress={gmailAccount?.gmailAddress ?? null}
      plan={user.plan}
    />
  );
}
