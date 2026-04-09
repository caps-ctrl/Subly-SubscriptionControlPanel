"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function CheckoutSuccessPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-3xl font-semibold tracking-tight">
          Platnosc zakonczona pomyslnie
        </h1>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Stripe potwierdzil zakup planu Premium. Jesli dashboard nie pokaze
          zmiany od razu, odswiez go za kilka sekund.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={() => router.push("/dashboard")}>
            Przejdz do dashboardu
          </Button>
          <Button variant="secondary" onClick={() => router.push("/")}>
            Wroc na home page
          </Button>
        </div>
      </div>
    </main>
  );
}
