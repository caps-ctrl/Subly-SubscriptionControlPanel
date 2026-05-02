import { getServerUser } from "@/lib/auth/getServerUser";
import { prisma } from "@/lib/db/prisma";
import { monthlyCostCents } from "@/lib/subscriptions/cost";
import Image from "next/image";

import { SubscriptionDiag } from "@/components/dashboard/SubscriptionDiag";
import SubsList from "@/components/dashboard/SubsList";
import { UpcomingPayments } from "@/components/dashboard/UpcomingPayments";
export default async function DashboardPage() {
  const user = await getServerUser();

  if (!user) {
    return (
      <section className="rounded-3xl border border-zinc-200 bg-white/80 p-8 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70 sm:p-10">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Start
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
          Zaloguj się, żeby zobaczyć dashboard.
        </p>
      </section>
    );
  }

  const [, activeSubs] = await Promise.all([
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
    }),
  ]);

  const totalsByCurrency = new Map<string, number>();
  for (const s of activeSubs) {
    const monthly = monthlyCostCents(s.amountCents, s.billingInterval);
    if (!monthly) continue;
    totalsByCurrency.set(
      s.currency,
      (totalsByCurrency.get(s.currency) ?? 0) + monthly,
    );
  }

  const formattedSubs = activeSubs.map((s) => ({
    ...s,
    nextBillingDate: s.nextBillingDate?.toISOString() ?? null,
    lastBilledAt: s.lastBilledAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  // ... Twoje dane bez zmian

  return (
    <section className="flex flex-col  p-2">
      {/* HEADER */}
      <header className=" top-0">
        <h1 className="text-4xl px-4 font-bold">Dashboard</h1>

        <div className="py-4">
          <div className="flex justify-between">
            <div className="flex text-center px-4 border-b w-full pb-5 gap-10">
              <h2>Subskrypcje</h2>
            </div>
          </div>
        </div>
      </header>
      {/* GRID */}
      <div className="flex-1  ">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full min-h-0">
          <div
            className="row-span-2 bg-white col-span-1  max-h-[100vh] dark:bg-black   p-1 border-zinc-200 rounded-lg dark:border-zinc-600 overflow-y-auto flex flex-col"
            id="subscriptions"
          >
            <SubsList formattedSubs={formattedSubs} />
          </div>

          <div className="row-span-1 col-span-1 max-h-[50vh]">
            <SubscriptionDiag subscriptions={formattedSubs} />
          </div>

          <div className="relative  rounded-full ">
            <Image
              src="/logo.png"
              alt="Logo"
              className="z-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              width={80}
              height={80}
            />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-indigo-500 dark:bg-indigo-700 rounded-full blur-[120px] w-full h-full opacity-90 dark:opacity-50 " />
          </div>

          <div className="row-span-1 col-span-2 max-h-[50vh] overflow-scroll">
            <UpcomingPayments subscriptions={formattedSubs} />
          </div>
        </div>
      </div>
    </section>
  );
}
