"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";

type CheckoutResponse = {
  url?: string;
  error?: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const startCheckout = useCallback(async (resetError = true) => {
    if (resetError) {
      setError(null);
    }

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        credentials: "include",
      });
      const data = (await response.json().catch(() => null)) as
        | CheckoutResponse
        | null;

      if (response.status === 401) {
        router.replace("/login?next=/checkout");
        return;
      }

      if (response.status === 409 && data?.error === "ALREADY_PRO") {
        router.replace("/dashboard");
        return;
      }

      if (!response.ok || !data?.url) {
        setError(
          data?.error
            ? "Nie udało się rozpocząć checkoutu Stripe."
            : "Wystąpił nieoczekiwany błąd podczas uruchamiania płatności.",
        );
        return;
      }

      window.location.assign(data.url);
    } catch {
      setError("Nie udało się połączyć z serwerem płatności.");
    }
  }, [router]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void startCheckout(false);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [startCheckout]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight">
          Przekierowanie do Stripe
        </h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Przygotowujemy bezpieczny checkout dla planu Premium.
        </p>

        {error ? (
          <div className="mt-6 space-y-3">
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
              {error}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={() => void startCheckout()}>Spróbuj ponownie</Button>
              <Button variant="secondary" onClick={() => router.push("/")}>
                Wróć na stronę główną
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
            Jeśli nic się nie stanie w ciągu kilku sekund, spróbujemy ponownie
            po odświeżeniu strony.
          </p>
        )}
      </div>
    </main>
  );
}
