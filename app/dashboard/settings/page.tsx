import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  CreditCard,
  Link2,
  Mail,
  Palette,
  Settings,
  Shield,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getServerUser } from "@/lib/auth/getServerUser";
import { prisma } from "@/lib/db/prisma";
import ThemeToggle from "@/components/ThemeToggle";
import LogoutButton from "@/components/LogoutButton";
import { ChangePasswordButton } from "@/components/settings/ChangePasswordButton";
import { ManageSubscriptionButton } from "@/components/settings/ManageSubscriptionButton";
import { cn } from "@/lib/utils";

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
  }).format(value);
}

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "Jeszcze niepołączone";

  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function getPlanCopy(plan: "FREE" | "PRO") {
  return plan === "PRO"
    ? {
        label: "PRO",
        price: "10 zł / mies.",
        description:
          "Masz pełny dostęp do większej liczby integracji i wygodniejszego zarządzania płatnościami.",
      }
    : {
        label: "Free",
        price: "0 zł",
        description:
          "Plan startowy do kontroli najważniejszych subskrypcji i ręcznego dodawania pozycji.",
      };
}

function getBillingState(
  status: string | null | undefined,
  plan: "FREE" | "PRO",
) {
  if (!status) {
    return plan === "PRO"
      ? {
          label: "Synchronizacja",
          tone: "blue" as const,
          description:
            "Czekamy jeszcze na pełne dane billingowe z Stripe. Spróbuj odświeżyć stronę za chwilę.",
        }
      : {
          label: "Brak subskrypcji",
          tone: "zinc" as const,
          description:
            "Możesz uruchomić plan PRO w dowolnym momencie z poziomu tej sekcji.",
        };
  }

  switch (status) {
    case "active":
      return {
        label: "Aktywna",
        tone: "emerald" as const,
        description:
          "Subskrypcja działa poprawnie i jest gotowa do zarządzania.",
      };
    case "trialing":
      return {
        label: "Okres próbny",
        tone: "blue" as const,
        description:
          "Subskrypcja jest aktywna w trybie testowym i czeka na kolejne rozliczenie.",
      };
    case "past_due":
      return {
        label: "Wymaga uwagi",
        tone: "amber" as const,
        description:
          "Stripe zgłasza problem z płatnością. Warto sprawdzić metodę płatności w panelu billingowym.",
      };
    case "canceled":
      return {
        label: "Anulowana",
        tone: "zinc" as const,
        description:
          "Subskrypcja została zakończona. Możesz wrócić do planu PRO w dowolnej chwili.",
      };
    default:
      return {
        label: status,
        tone: "zinc" as const,
        description:
          "Status został pobrany ze Stripe i jest dostępny do dalszego zarządzania w panelu billingowym.",
      };
  }
}

function statusBadgeClass(tone: "emerald" | "blue" | "amber" | "zinc") {
  return cn(
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset",
    tone === "emerald" &&
      "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
    tone === "blue" &&
      "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30",
    tone === "amber" &&
      "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
    tone === "zinc" &&
      "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-800",
  );
}

function surfaceClassName(extra = "") {
  return cn(
    "relative overflow-hidden rounded-[28px] border border-zinc-200/70 bg-white/85 p-6 shadow-xl shadow-zinc-950/[0.04] backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/75",
    extra,
  );
}

function DetailRow({
  icon,
  label,
  value,
  valueClassName = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-zinc-200/70 bg-white/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/70">
      <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          {icon}
        </span>
        <span>{label}</span>
      </div>

      <div
        className={cn(
          "max-w-[58%] text-right text-sm font-semibold text-zinc-950 my-auto  dark:text-zinc-50",
          valueClassName,
        )}
      >
        {value}
      </div>
    </div>
  );
}

function QuickStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-lg shadow-zinc-950/[0.03] dark:border-zinc-800/80 dark:bg-zinc-950/70">
      <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        {value}
      </div>
      <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {hint}
      </div>
    </div>
  );
}

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

  const [gmailAccount, billingSubscription, activeSubscriptionsCount] =
    await Promise.all([
      prisma.gmailAccount.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        select: { gmailAddress: true, updatedAt: true },
      }),
      prisma.userSubscription.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        select: {
          stripeCustomerId: true,
          status: true,
          currentPeriodEnd: true,
          updatedAt: true,
        },
      }),
      prisma.subscription.count({
        where: { userId: user.id, status: "ACTIVE" },
      }),
    ]);

  const planCopy = getPlanCopy(user.plan);
  const billingState = getBillingState(billingSubscription?.status, user.plan);
  const hasBillingAccount = Boolean(billingSubscription?.stripeCustomerId);
  const gmailConnected = Boolean(gmailAccount);

  return (
    <section className="relative isolate px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.12),_transparent_32%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.2),_transparent_32%)]" />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className={surfaceClassName("p-7 sm:p-8")}>
          <div className="absolute -right-10 top-8 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl dark:bg-cyan-400/10" />

          <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr] xl:items-start">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-300">
                <Sparkles className="h-3.5 w-3.5" />
                Centrum kontroli
              </div>

              <div className="mt-5 flex items-start gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-3xl bg-zinc-950 text-zinc-50 shadow-lg shadow-zinc-950/15 dark:bg-zinc-50 dark:text-zinc-950">
                  <Settings className="h-6 w-6" />
                </div>

                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
                    Ustawienia dashboardu
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400 sm:text-base">
                    Tutaj ogarniesz konto, billing, połączenie z Gmailem i
                    wygląd aplikacji. Wszystko w jednym, bardziej czytelnym
                    miejscu.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/dashboard#subscriptions">
                  <Button variant="cta" className="gap-2">
                    Przejdź do subskrypcji
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>

                <Link href="/api/gmail/connect">
                  <Button variant="secondary" className="gap-2">
                    {gmailConnected
                      ? "Odśwież połączenie Gmail"
                      : "Podłącz Gmail"}
                    <Link2 className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
              <QuickStat
                label="Plan"
                value={planCopy.label}
                hint={planCopy.price}
              />
              <QuickStat
                label="Aktywne"
                value={String(activeSubscriptionsCount)}
                hint="subskrypcji w monitoringu"
              />
              <QuickStat
                label="Gmail"
                value={gmailConnected ? "Połączony" : "Niepodłączony"}
                hint={
                  gmailConnected
                    ? (gmailAccount?.gmailAddress ?? "Konto aktywne")
                    : "Brak autoryzacji"
                }
              />
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          {/* Konto i Bezpieczenstwo*/}
          <div className={surfaceClassName()}>
            <div className="z-0  absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-indigo-500 rounded-full blur-[150px] opacity-30 dark:opacity-20" />
            {/* Glow 2 */}
            <div className="z-0  absolute top-0 left-1/2 w-[400px] h-[400px] bg-cyan-400 rounded-full blur-[120px] opacity-10 dark:opacity-20" />
            {/* Glow 3 */}
            <div className="z-0  absolute top-0 left-0 w-[300px] h-[300px] bg-violet-600 rounded-full blur-[100px] opacity-30 dark:opacity-20" />
            <div className="flex  items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                  <Shield className="h-3.5 w-3.5" />
                  Konto i bezpieczeństwo
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                  Twoje konto
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                  Szybki podgląd najważniejszych danych logowania oraz akcji,
                  które najczęściej są potrzebne po wejściu do ustawień.
                </p>
              </div>

              <div className="hidden rounded-3xl border border-zinc-200/70 bg-white/80 p-4 text-right dark:border-zinc-800 dark:bg-zinc-950/80 sm:block">
                <div className="text-xs uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                  Konto
                </div>
                <div className="mt-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                  {user.email}
                </div>
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              <DetailRow
                icon={<Mail className="h-4 w-4" />}
                label="Adres e-mail"
                value={user.email}
                valueClassName="break-all"
              />
              <DetailRow
                icon={<CreditCard className="h-4 w-4" />}
                label="Aktywny plan"
                value={
                  <span
                    className={statusBadgeClass(
                      user.plan === "PRO" ? "emerald" : "zinc",
                    )}
                  >
                    {planCopy.label}
                  </span>
                }
              />
              <DetailRow
                icon={<Link2 className="h-4 w-4" />}
                label="Połączenie Gmail"
                value={
                  gmailConnected
                    ? (gmailAccount?.gmailAddress ?? "Połączone")
                    : "Brak połączenia"
                }
                valueClassName="break-all"
              />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <ChangePasswordButton className="w-full justify-center sm:justify-start" />
              <LogoutButton className="w-full z-10  rounded-2xl px-4 py-3 bg-red-500" />
            </div>
          </div>
          {/*Plan i Subksrypcja */}
          <div
            className={surfaceClassName(
              "bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(244,244,245,0.84))] dark:bg-[linear-gradient(145deg,rgba(9,9,11,0.94),rgba(24,24,27,0.82))]",
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                  <CreditCard className="h-3.5 w-3.5" />
                  Billing
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                  Plan i subskrypcja
                </h2>
              </div>

              <span className={statusBadgeClass(billingState.tone)}>
                {billingState.label}
              </span>
            </div>

            <div className="mt-5  relative rounded-[24px] border border-zinc-200/70 bg-white/85 p-5 dark:border-zinc-800 dark:bg-zinc-950/80">
              <div className="  absolute top-1/2 right-1/2  w-[500px] h-[500px] bg-indigo-700 rounded-full blur-[120px] opacity-30 dark:opacity-20 z-0" />
              {/* Glow 2 */}{" "}
              <div className=" absolute top-0 right-1/2  w-[400px] h-[400px] bg-cyan-400 rounded-full blur-[120px] opacity-10 dark:opacity-20  z-0" />
              {/* Glow 3 */}
              <div className="  absolute top-2/3 right-0  w-[300px] h-[300px] bg-violet-400 rounded-full blur-[100px] opacity-30 dark:opacity-20 z-0 " />
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    Aktualny pakiet
                  </div>
                  <div className="mt-2  text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
                    {planCopy.label}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    Cena
                  </div>
                  <div className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                    {planCopy.price}
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                {planCopy.description}
              </p>
            </div>

            <div className="mt-5 grid  gap-3">
              <DetailRow
                icon={<CalendarClock className="h-4 w-4" />}
                label="Kolejne rozliczenie"
                value={formatDate(billingSubscription?.currentPeriodEnd)}
              />
              <DetailRow
                icon={<CreditCard className="h-4 w-4" />}
                label="Status w Stripe"
                value={
                  <span className={statusBadgeClass(billingState.tone)}>
                    {billingState.label}
                  </span>
                }
              />
            </div>

            <p className="mt-5 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
              {billingState.description}
            </p>

            <div className="relative z-10">
              <ManageSubscriptionButton
                hasBillingAccount={hasBillingAccount}
                plan={user.plan}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Google Gmail */}
          <div className={surfaceClassName()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                  <Mail className="h-3.5 w-3.5" />
                  Integracje
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                  Gmail
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                  Połącz skrzynkę, żeby automatycznie wykrywać subskrypcje z
                  maili, odświeżać listę usług i ograniczyć ręczne wpisywanie
                  danych.
                </p>
              </div>

              <span
                className={statusBadgeClass(
                  gmailConnected ? "emerald" : "zinc",
                )}
              >
                {gmailConnected ? "Połączono" : "Niepołączono"}
              </span>
            </div>

            <div className="mt-6 grid gap-3">
              <div className="relative overflow-hidden ">
                <div className="absolute top-1/2 left-1/2 right-1/2  -translate-x-1/2 -translate-y-1/2 w-45 h-30 bg-lime-500 rounded-full blur-[40px] opacity-30 dark:opacity-20" />
                <DetailRow
                  icon={<Mail className="h-4 w-4" />}
                  label="Adres Gmail"
                  value={gmailAccount?.gmailAddress ?? "Brak autoryzacji"}
                  valueClassName="break-all"
                />
              </div>
              <div className="relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 right-1/2  -translate-x-1/2 -translate-y-1/2 w-45 h-30 bg-lime-500 rounded-full blur-[40px] opacity-30 dark:opacity-20" />
                <DetailRow
                  icon={<CalendarClock className="h-4 w-4" />}
                  label="Ostatnia autoryzacja"
                  value={formatDateTime(gmailAccount?.updatedAt)}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/api/gmail/connect">
                <Button variant={gmailConnected ? "secondary" : "primary"}>
                  {gmailConnected ? "Połącz ponownie" : "Podłącz Gmail"}
                </Button>
              </Link>
              <Link href="/dashboard#subscriptions">
                <Button variant="ghost" className="gap-2">
                  Otwórz listę subskrypcji
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <p className="mt-4 text-xs leading-6 text-zinc-500 dark:text-zinc-500">
              Odłączenie konta Google nie jest jeszcze dostępne bezpośrednio w
              aplikacji. W razie potrzeby możesz cofnąć dostęp z poziomu
              ustawień bezpieczeństwa Google.
            </p>
          </div>

          <div className={surfaceClassName()}>
            <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
              <Palette className="h-3.5 w-3.5" />
              Personalizacja
            </div>

            <h2 className="mt-4 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
              Wygląd aplikacji
            </h2>
            <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
              Zmień motyw interfejsu i dopasuj dashboard do tego, jak lubisz
              pracować w dzień albo wieczorem.
            </p>

            <div className="mt-6 rounded-[24px] border border-zinc-200/70 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),_transparent_48%),linear-gradient(180deg,rgba(255,255,255,0.9),rgba(244,244,245,0.78))] p-5 dark:border-zinc-800 dark:bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_48%),linear-gradient(180deg,rgba(9,9,11,0.92),rgba(24,24,27,0.86))]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                    Motyw dashboardu
                  </div>
                  <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Auto, jasny albo ciemny. Zmiana zapisuje się od razu.
                  </div>
                </div>

                <ThemeToggle showLabel={false} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
