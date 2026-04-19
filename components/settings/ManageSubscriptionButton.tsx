"use client";

import { ArrowUpRight, CreditCard, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";

type ManageSubscriptionButtonProps = {
  hasBillingAccount: boolean;
  plan: "FREE" | "PRO";
  className?: string;
};

const ERROR_MESSAGES: Record<string, string> = {
  BILLING_PORTAL_UNAVAILABLE:
    "Panel płatności jest chwilowo niedostępny. Spróbuj ponownie za moment.",
  NO_BILLING_ACCOUNT:
    "Nie znaleziono konta billingowego. Jeśli dopiero aktywowałeś PRO, odśwież stronę za chwilę.",
  UNAUTHORIZED: "Sesja wygasła. Zaloguj się ponownie.",
};

function getErrorMessage(error?: string) {
  if (!error) {
    return ERROR_MESSAGES.BILLING_PORTAL_UNAVAILABLE;
  }

  return ERROR_MESSAGES[error] ?? ERROR_MESSAGES.BILLING_PORTAL_UNAVAILABLE;
}

export function ManageSubscriptionButton({
  hasBillingAccount,
  plan,
  className = "",
}: ManageSubscriptionButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUpgrade = !hasBillingAccount && plan === "FREE";

  async function handleClick() {
    setError(null);

    if (isUpgrade) {
      router.push("/checkout");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
      });
      const data = (await response.json().catch(() => null)) as {
        url?: string;
        error?: string;
      } | null;

      if (!response.ok || !data?.url) {
        setError(getErrorMessage(data?.error));
        return;
      }

      window.location.assign(data.url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <Button
        type="button"
        variant={isUpgrade ? "cta" : "secondary"}
        className="w-full justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-semibold"
        onClick={handleClick}
        disabled={loading}
      >
        <span className="inline-flex items-center gap-2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isUpgrade ? (
            <Sparkles className="h-4 w-4" />
          ) : (
            <CreditCard className="h-4 w-4" />
          )}
          {loading
            ? "Otwieranie panelu..."
            : isUpgrade
              ? "Przejdź na PRO"
              : "Zarządzaj subskrypcją"}
        </span>

        {!loading ? <ArrowUpRight className="h-4 w-4" /> : null}
      </Button>

      {error ? (
        <p className="mt-2 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}
