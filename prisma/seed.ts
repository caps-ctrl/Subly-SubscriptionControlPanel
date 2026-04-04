import {
  PrismaClient,
  Plan,
  SubscriptionStatus,
  SubscriptionSource,
  BillingInterval,
} from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const password = "zaq1@WSX";
const hashedPassword = await bcrypt.hash(password, 10);

async function main() {
  console.log("🌱 Rozpoczynam seedowanie bazy...");

  const now = new Date();

  function monthsAgo(n: number) {
    const d = new Date();
    d.setMonth(d.getMonth() - n);
    return d;
  }

  function daysAgo(n: number) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
  }

  // 👇 LISTA USERÓW
  const usersData = [
    {
      email: "gusiew9@gmail.com",
      plan: Plan.PRO,
    },
    {
      email: "test1@gmail.com",
      plan: Plan.FREE,
    },
    {
      email: "test2@gmail.com",
      plan: Plan.PRO,
    },
  ];

  // 👇 SUBSKRYPCJE TEMPLATE
  const subscriptionsTemplate = [
    {
      providerName: "netflix",
      amountCents: 4300,
      billingInterval: BillingInterval.MONTHLY,
      createdAt: daysAgo(10),
      nextBillingDate: new Date(now.getFullYear(), now.getMonth(), 20),
    },
    {
      providerName: "spotify",
      amountCents: 2399,
      billingInterval: BillingInterval.MONTHLY,
      createdAt: daysAgo(5),
      nextBillingDate: new Date(now.getFullYear(), now.getMonth(), 15),
    },
    {
      providerName: "youtube",
      amountCents: 2599,
      billingInterval: BillingInterval.MONTHLY,
      createdAt: monthsAgo(1),
      nextBillingDate: new Date(now.getFullYear(), now.getMonth(), 10),
    },
    {
      providerName: "gym",
      amountCents: 1500,
      billingInterval: BillingInterval.WEEKLY,
      createdAt: monthsAgo(2),
      nextBillingDate: daysAgo(3),
    },
  ];

  for (const userData of usersData) {
    // 👇 UPSERT USERA
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        passwordHash: hashedPassword,
        plan: userData.plan,
      },
    });

    console.log(`\n👤 User: ${user.email}`);

    // 👇 LOSOWA LICZBA SUBSKRYPCJI (bardziej realistyczne)
    const userSubscriptions = subscriptionsTemplate.slice(
      0,
      Math.floor(Math.random() * subscriptionsTemplate.length) + 1,
    );

    for (const sub of userSubscriptions) {
      const created = await prisma.subscription.create({
        data: {
          userId: user.id,
          providerName: sub.providerName,
          status: SubscriptionStatus.ACTIVE,
          amountCents: sub.amountCents,
          currency: "PLN",
          billingInterval: sub.billingInterval,
          source: SubscriptionSource.MANUAL,
          nextBillingDate: sub.nextBillingDate,
          lastBilledAt: sub.createdAt,
          createdAt: sub.createdAt,
          notes: "Seed test subscription",
        },
      });

      console.log(`   ✅ ${created.providerName}`);
    }
  }

  console.log("\n🚀 Seedowanie zakończone!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
