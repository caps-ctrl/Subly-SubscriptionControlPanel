import SubsList from "@/components/dashboard/SubsList";
import { prisma } from "@/lib/db/prisma";
import { getServerUser } from "@/lib/auth/getServerUser";

const page = async () => {
  const user = await getServerUser();
  if (!user) return null;

  const [gmailAccount, activeSubs] = await Promise.all([
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

  const formattedSubs = activeSubs.map((s) => ({
    ...s,
    nextBillingDate: s.nextBillingDate?.toISOString() ?? null,
    lastBilledAt: s.lastBilledAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));
  return (
    <>
      <header>
        <h1>Subscriptions</h1>
        <span />
      </header>
      <div className="flex justify-between">
        <SubsList formattedSubs={formattedSubs} />
      </div>
    </>
  );
};

export default page;
