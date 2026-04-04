"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { ApiSubscription } from "@/components/dashboard/types";
import { formatMoney } from "@/components/dashboard/utils";

const DAY_MS = 24 * 60 * 60 * 1000;

function parseIsoDate(dateIso: string | null): Date | null {
  if (!dateIso) return null;
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function startOfTodayUtcMs(now: Date) {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

function formatDateUtc(date: Date) {
  return new Intl.DateTimeFormat("pl-PL", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

function daysInMonthUtc(year: number, monthIndex0: number) {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

function addMonthsUtc(date: Date, months: number) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const second = date.getUTCSeconds();
  const ms = date.getUTCMilliseconds();

  const totalMonths = month + months;
  const newYear = year + Math.floor(totalMonths / 12);
  const newMonth = ((totalMonths % 12) + 12) % 12;
  const maxDay = daysInMonthUtc(newYear, newMonth);
  const newDay = Math.min(day, maxDay);

  return new Date(
    Date.UTC(newYear, newMonth, newDay, hour, minute, second, ms),
  );
}

function relativeLabel(daysUntil: number) {
  if (daysUntil === 0) return "dziś";
  if (daysUntil === 1) return "jutro";
  if (daysUntil < 0) return "po terminie";
  return `za ${daysUntil} dni`;
}

export function UpcomingPayments({
  subscriptions,
  limit = 8,
}: {
  subscriptions: ApiSubscription[];
  limit?: number;
}) {
  const router = useRouter();
  const [localSubs, setLocalSubs] = useState(subscriptions);
  const [pendingById, setPendingById] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLocalSubs(subscriptions);
  }, [subscriptions]);

  const now = new Date();
  const todayStartUtcMs = startOfTodayUtcMs(now);

  const markPaid = async (id: string) => {
    if (pendingById[id]) return;
    const current = localSubs.find((s) => s.id === id);
    if (!current?.nextBillingDate) return;

    if (!confirm(`Oznaczyć ${current.providerName} jako opłacone?`)) return;

    const currentNext = parseIsoDate(current.nextBillingDate);
    if (!currentNext) return;

    const previous = {
      nextBillingDate: current.nextBillingDate,
      lastBilledAt: current.lastBilledAt,
    };
    const optimisticNext = addMonthsUtc(currentNext, 1).toISOString();

    setPendingById((prev) => ({ ...prev, [id]: true }));
    setLocalSubs((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              lastBilledAt: previous.nextBillingDate,
              nextBillingDate: optimisticNext,
            }
          : s,
      ),
    );

    try {
      const res = await fetch(`/api/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markPaid: true }),
      });

      if (!res.ok) {
        throw new Error("Mark paid failed");
      }

      const updated = (await res
        .json()
        .catch(() => null)) as Partial<ApiSubscription> | null;

      if (updated?.id === id) {
        setLocalSubs((prev) =>
          prev.map((s) =>
            s.id === id
              ? {
                  ...s,
                  nextBillingDate: updated.nextBillingDate ?? s.nextBillingDate,
                  lastBilledAt: updated.lastBilledAt ?? s.lastBilledAt,
                }
              : s,
          ),
        );
      }

      router.refresh();
    } catch (err) {
      console.error(err);

      setLocalSubs((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                nextBillingDate: previous.nextBillingDate,
                lastBilledAt: previous.lastBilledAt,
              }
            : s,
        ),
      );

      alert("Nie udało się oznaczyć jako opłacone");
    } finally {
      setPendingById(({ [id]: _removed, ...rest }) => rest);
    }
  };

  const upcoming = localSubs
    .filter((s) => s.status === "ACTIVE")
    .map((s) => {
      const next = parseIsoDate(s.nextBillingDate);
      if (!next) return null;
      const daysUntil = Math.floor((next.getTime() - todayStartUtcMs) / DAY_MS);
      return {
        id: s.id,
        providerName: s.providerName,
        billingInterval: s.billingInterval,
        amountCents: s.amountCents,
        currency: (s.currency || "USD").toUpperCase(),
        nextBillingDate: next,
        daysUntil,
      };
    })
    .filter(
      (
        v,
      ): v is {
        id: string;
        providerName: string;
        billingInterval: ApiSubscription["billingInterval"];
        amountCents: number;
        currency: string;
        nextBillingDate: Date;
        daysUntil: number;
      } => Boolean(v),
    )
    .filter((v) => v.amountCents > 0)
    .sort((a, b) => a.nextBillingDate.getTime() - b.nextBillingDate.getTime());

  const visible = upcoming.slice(0, limit);

  const totalsNext30d = new Map<string, number>();
  for (const row of upcoming) {
    if (row.daysUntil < 0 || row.daysUntil > 30) continue;
    totalsNext30d.set(
      row.currency,
      (totalsNext30d.get(row.currency) ?? 0) + row.amountCents,
    );
  }
  const totalsNext30dArr = Array.from(totalsNext30d.entries())
    .map(([currency, cents]) => ({ currency, cents }))
    .sort((a, b) => b.cents - a.cents);

  return (
    <div className=" rounded-3xl border border-zinc-200 bg-white/80 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <div>
          <div className="text-sm font-semibold">Nadchodzące płatności</div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            {upcoming.length} aktywnych subskrypcji z datą płatności
          </div>
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-500">
          {totalsNext30dArr.length > 0
            ? `Najbliższe 30 dni: ${totalsNext30dArr
                .map((t) => formatMoney(t.cents, t.currency))
                .join(", ")}`
            : "—"}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50/70 text-xs text-zinc-600 dark:bg-zinc-950/60 dark:text-zinc-400">
            <tr>
              <th className="px-5 py-3 font-medium">Usługa</th>
              <th className="px-5 py-3 font-medium">Kiedy</th>
              <th className="px-5 py-3 font-medium">Data</th>
              <th className="px-5 py-3 text-right font-medium">Kwota</th>
              <th className="px-5 py-3 text-right font-medium">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p, idx) => (
              <tr
                key={p.id}
                className={[
                  "border-t border-zinc-200 dark:border-zinc-800",
                  idx % 2 === 0
                    ? "bg-white/40 dark:bg-zinc-950/30"
                    : "bg-transparent",
                  "hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40",
                ].join(" ")}
              >
                <td className="px-5 py-3">
                  <div className="font-medium">{p.providerName}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-500">
                    {p.billingInterval}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={[
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      p.daysUntil <= 3
                        ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-200"
                        : "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
                    ].join(" ")}
                  >
                    {relativeLabel(p.daysUntil)}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {formatDateUtc(p.nextBillingDate)}
                </td>
                <td className="px-5 py-3 text-right">
                  {formatMoney(p.amountCents, p.currency)}
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => markPaid(p.id)}
                    disabled={Boolean(pendingById[p.id])}
                    className="inline-flex items-center rounded-lg bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-200 disabled:opacity-50 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-950/60"
                  >
                    {pendingById[p.id] ? "..." : "Opłacone"}
                  </button>
                </td>
              </tr>
            ))}

            {visible.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-8 text-center text-sm text-zinc-600 dark:text-zinc-400"
                >
                  Brak nadchodzących płatności — dodaj `nextBillingDate` do
                  subskrypcji.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
