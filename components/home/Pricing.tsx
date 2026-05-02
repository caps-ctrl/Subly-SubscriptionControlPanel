"use client";

import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";

type PricingProps = {
  user: {
    plan: "FREE" | "PRO";
  } | null;
};

export default function Pricing({ user }: PricingProps) {
  const router = useRouter();
  const isPro = user?.plan === "PRO";
  const freeLabel = user ? "Przejdź do dashboardu" : "Zacznij za darmo";
  const premiumLabel = isPro ? "Masz już Premium" : "Kup Premium";

  return (
    <section className="py-20 px-6  text-zinc-900 dark:text-white">
      <div className="max-w-6xl mx-auto text-center mb-16">
        <h2 className="text-4xl font-bold mb-4">Wybierz swój plan</h2>
        <p className="text-zinc-500">
          Zacznij za darmo lub odblokuj pełną kontrolę nad subskrypcjami
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
        {/* FREE */}
        <div className="border rounded-2xl p-8 flex flex-col justify-between bg-zinc-50 dark:bg-zinc-900">
          <div>
            <h3 className="text-2xl font-semibold mb-2">Free</h3>
            <p className="text-zinc-500 mb-6">Dla podstawowej kontroli</p>

            <div className="text-4xl font-bold mb-6">0 zł</div>

            <ul className="space-y-3 text-left">
              <li>✔️ Do 5 subskrypcji</li>
              <li>✔️ Podstawowy dashboard</li>
              <li>✔️ Ręczne dodawanie subskrypcji</li>
              <li>✔️ Podgląd miesięcznych kosztów</li>
              <li className="text-zinc-400">❌ Brak powiadomień</li>
            </ul>
          </div>

          <Button
            variant="secondary"
            className="mt-8"
            onClick={() => router.push(user ? "/dashboard" : "/register")}
          >
            {freeLabel}
          </Button>
        </div>

        {/* PREMIUM */}
        <div className="relative border-2 border-indigo-600 rounded-2xl p-8 flex flex-col justify-between bg-white dark:bg-zinc-900 shadow-xl">
          {/* badge */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm">
            Najlepszy wybór
          </div>

          <div>
            <h3 className="text-2xl font-semibold mb-2">Premium</h3>
            <p className="text-zinc-500 mb-6">Pełna kontrola i automatyzacja</p>

            <div className="text-4xl font-bold mb-6">
              10 zł{" "}
              <span className="text-base font-normal text-zinc-500">
                / mies.
              </span>
            </div>

            <ul className="space-y-3 text-left">
              <li>✔️ Nielimitowane subskrypcje</li>
              <li>✔️ Automatyczne przypomnienia</li>
              <li>✔️ Zaawansowany dashboard</li>
              <li>✔️ Statystyki i analiza wydatków</li>
              <li>✔️ Kategorie i organizacja</li>
              <li>✔️ Priorytetowe wsparcie</li>
            </ul>
          </div>

          <Button
            variant="cta"
            className="mt-8 text-base py-3"
            onClick={() => router.push(isPro ? "/dashboard" : "/checkout")}
          >
            {premiumLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}
