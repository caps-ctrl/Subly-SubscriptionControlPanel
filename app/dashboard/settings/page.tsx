import Link from "next/link";
import Image from "next/image";
import { Mail, CreditCard, Settings } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getServerUser } from "@/lib/auth/getServerUser";
import { prisma } from "@/lib/db/prisma";
import ThemeToggle from "@/components/ThemeToggle";
import LogoutButton from "@/components/LogoutButton";
import { ChangePasswordButton } from "@/components/settings/ChangePasswordButton";

export default async function DashboardSettingsPage() {
  const user = await getServerUser();

  if (!user) {
    return (
      <section className="rounded-3xl border border-zinc-200 bg-white/80 p-8 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70 sm:p-10">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Ustawienia
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
          Zaloguj się, żeby zarządzać ustawieniami konta.
        </p>
      </section>
    );
  }

  const gmailAccount = await prisma.gmailAccount.findFirst({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { gmailAddress: true },
  });

  return (
    <div className="m-4">
      <header className="rounded-3xl border border-zinc-200 bg-white/80 m-4 p-2 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
        <div className="flex justify-center items-center ">
          <div className="flex justify-center items-center ">
            <Image
              className="dark:invert"
              width={40}
              height={40}
              alt="ustawienia "
              src={"/logos/settings.svg"}
            />
            <h1 className="text-2xl font-semibold px-4 tracking-tight sm:text-3xl">
              Ustawienia
            </h1>
          </div>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-3xl bg-white/80 p-6 shadow-lg backdrop-blur-xl border border-zinc-200/50 dark:bg-zinc-950/70 dark:border-zinc-800">
          {/* HEADER */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Twoje konto</h2>
            <Settings className="w-5 h-5 text-zinc-500" />
          </div>

          {/* INFO */}
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <Mail className="w-4 h-4" />
                Email
              </div>
              <span className="font-medium text-zinc-950 dark:text-zinc-50">
                {user.email}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <CreditCard className="w-4 h-4" />
                Plan
              </div>
              <span className="font-medium text-zinc-950 dark:text-zinc-50">
                {user.plan}
              </span>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="mt-6 grid gap-2">
            <ChangePasswordButton />

            <Button variant="secondary" className="justify-start gap-2">
              <CreditCard className="w-4 h-4" />
              Zarządzaj planem
            </Button>
            <LogoutButton />
          </div>
        </Card>

        <Card className="rounded-3xl p-5 bg-white/80 backdrop-blur dark:bg-zinc-950/70">
          <div className="text-sm font-semibold">Gmail</div>
          <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Status:{" "}
            <span className="font-medium text-zinc-950 dark:text-zinc-50">
              {gmailAccount
                ? `podłączony (${gmailAccount.gmailAddress})`
                : "niepodłączony"}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/api/gmail/connect">
              <Button variant={gmailAccount ? "secondary" : "primary"}>
                {gmailAccount ? "Podłącz ponownie" : "Podłącz Gmail"}
              </Button>
            </Link>
            <Link href="/dashboard/subscriptions">
              <Button variant="ghost">Przejdź do subskrypcji</Button>
            </Link>
          </div>
          <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
            Odłączenie konta (revoke) nie jest jeszcze dostępne w aplikacji — w
            razie potrzeby usuń dostęp w ustawieniach Google.
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-3xl p-5 bg-white/80 backdrop-blur dark:bg-zinc-950/70">
          <div className="text-sm font-semibold">Powiadomienia</div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Wkrótce: przypomnienia o nadchodzących płatnościach i raporty o
            wydatkach.
          </div>
        </Card>
        <ThemeToggle />
      </section>
    </div>
  );
}
