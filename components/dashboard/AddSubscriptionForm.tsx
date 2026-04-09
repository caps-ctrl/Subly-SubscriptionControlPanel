"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const INTERVALS = [
  "MONTHLY",
  "YEARLY",
  "WEEKLY",
  "QUARTERLY",
  "UNKNOWN",
] as const;

export function AddSubscriptionForm({
  onCreated,
}: {
  onCreated: () => Promise<void> | void;
}) {
  const [providerName, setProviderName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [billingInterval, setBillingInterval] =
    useState<(typeof INTERVALS)[number]>("MONTHLY");
  const [nextBillingDate, setNextBillingDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const parsed = Number.parseFloat(amount.replace(",", "."));
      const amountCents = Number.isFinite(parsed)
        ? Math.round(parsed * 100)
        : 0;
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          providerName,
          amountCents,
          currency,
          billingInterval,
          nextBillingDate: nextBillingDate ? nextBillingDate : null,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        setMessage(data?.error ?? "CREATE_FAILED");
        return;
      }
      setProviderName("");
      setAmount("");
      setNextBillingDate("");
      setMessage("Dodano subskrypcję.");
      await onCreated();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="rounded-3xl bg-white/80  max-w-20 backdrop-blur dark:bg-zinc-950/70">
      <div className="mb-4 text-sm font-semibold">Dodaj ręcznie</div>
      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Nazwa usługi
          </label>
          <Input
            value={providerName}
            onChange={(e) => setProviderName(e.target.value)}
            placeholder="np. Netflix"
            required
          />
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Kwota
          </label>
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="np. 49.99"
            inputMode="decimal"
            required
          />
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Waluta
          </label>
          <Input
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            placeholder="USD"
            maxLength={3}
            required
          />
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Częstotliwość
          </label>
          <select
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none dark:border-zinc-800 dark:bg-black"
            value={billingInterval}
            onChange={(e) =>
              setBillingInterval(e.target.value as (typeof INTERVALS)[number])
            }
          >
            {INTERVALS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Następna płatność (opcjonalnie)
          </label>
          <Input
            type="date"
            value={nextBillingDate}
            onChange={(e) => setNextBillingDate(e.target.value)}
          />
        </div>

        <div className="sm:col-span-2 flex items-center justify-between gap-3">
          <div className="text-xs text-zinc-500 dark:text-zinc-500">
            Free: limit 3 aktywnych subskrypcji.
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Dodawanie…" : "Dodaj"}
          </Button>
        </div>

        {message ? (
          <p className="sm:col-span-2 text-sm text-zinc-600 dark:text-zinc-400">
            {message}
          </p>
        ) : null}
      </form>
    </Card>
  );
}
