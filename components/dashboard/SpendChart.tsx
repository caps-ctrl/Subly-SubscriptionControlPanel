"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ApiSubscription } from "@/components/dashboard/types";
import { formatMoney, monthlyCostCents } from "@/components/dashboard/utils";

export function SpendChart({ subscriptions }: { subscriptions: ApiSubscription[] }) {
  const data = subscriptions
    .filter((s) => s.status === "ACTIVE")
    .map((s) => ({
      name: s.providerName,
      monthlyCents: monthlyCostCents(s),
      currency: s.currency,
    }))
    .filter((d) => d.monthlyCents > 0)
    .sort((a, b) => b.monthlyCents - a.monthlyCents)
    .slice(0, 10)
    .map((d) => ({
      ...d,
      monthly: Math.round(d.monthlyCents) / 100,
    }));

  if (data.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white/80 p-6 text-sm text-zinc-600 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-400">
        Brak danych do wykresu (dodaj subskrypcje z kwotą i częstotliwością).
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
      <div className="mb-4 flex items-baseline justify-between">
        <div className="text-sm font-semibold">Miesięczny koszt (szacunek)</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-500">
          Top 10 subskrypcji
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 8, right: 8 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(_value: unknown, _name: unknown, props: { payload?: unknown }) => {
                const payload = props.payload as
                  | { monthlyCents?: unknown; currency?: unknown }
                  | undefined;
                const cents =
                  typeof payload?.monthlyCents === "number" ? payload.monthlyCents : 0;
                const currency =
                  typeof payload?.currency === "string" ? payload.currency : "USD";
                return [formatMoney(cents, currency), "Miesięcznie"];
              }}
            />
            <Bar
              dataKey="monthly"
              fill="currentColor"
              className="text-zinc-950 dark:text-zinc-50"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
