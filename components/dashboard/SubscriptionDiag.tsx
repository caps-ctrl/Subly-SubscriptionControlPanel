"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ApiSubscription } from "@/components/dashboard/types";
import { formatMoney } from "@/components/dashboard/utils";

type ChargeEvent = {
  subscriptionId: string;
  providerName: string;
  billingInterval: ApiSubscription["billingInterval"];
  currency: string;
  amountCents: number;
  chargedAt: Date;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

function parseIsoDate(dateIso: string | null): Date | null {
  if (!dateIso) return null;
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function daysInUtcMonth(year: number, month0: number) {
  return new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
}

function addMonthsUtc(monthStartUtc: Date, months: number) {
  return new Date(
    Date.UTC(
      monthStartUtc.getUTCFullYear(),
      monthStartUtc.getUTCMonth() + months,
      1,
    ),
  );
}

function monthLabel(monthStartUtc: Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(monthStartUtc);
}

function monthKey(monthStartUtc: Date) {
  const y = monthStartUtc.getUTCFullYear();
  const m = String(monthStartUtc.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthShort(monthStartUtc: Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    timeZone: "UTC",
  }).format(monthStartUtc);
}

function monthShortWithYear(monthStartUtc: Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(monthStartUtc);
}

function getChargeEventsForMonth(
  subscriptions: ApiSubscription[],
  monthStartUtc: Date,
): ChargeEvent[] {
  const monthEndUtc = addMonthsUtc(monthStartUtc, 1);
  const monthStartMs = monthStartUtc.getTime();
  const monthEndMs = monthEndUtc.getTime();

  const targetYear = monthStartUtc.getUTCFullYear();
  const targetMonth0 = monthStartUtc.getUTCMonth();
  const targetMonthIndex = targetYear * 12 + targetMonth0;

  const events: ChargeEvent[] = [];

  for (const sub of subscriptions) {
    if (sub.status !== "ACTIVE") continue;
    if (sub.amountCents <= 0) continue;
    if (sub.billingInterval === "UNKNOWN") continue;

    const anchor =
      parseIsoDate(sub.nextBillingDate) ?? parseIsoDate(sub.lastBilledAt);
    if (!anchor) continue;
    const day = Math.min(
      anchor.getUTCDate(),
      daysInUtcMonth(targetYear, targetMonth0),
    );
    const chargedAt = new Date(
      Date.UTC(
        targetYear,
        targetMonth0,
        day,
        anchor.getUTCHours(),
        anchor.getUTCMinutes(),
        anchor.getUTCSeconds(),
        anchor.getUTCMilliseconds(),
      ),
    );

    const start = parseIsoDate(sub.createdAt) ?? anchor;

    if (monthEndMs < start.getTime()) continue;
    const chargedAtMs = chargedAt.getTime();
    if (chargedAtMs < monthStartMs || chargedAtMs >= monthEndMs) continue;

    const currency = (sub.currency || "USD").toUpperCase();

    if (sub.billingInterval === "WEEKLY") {
      const anchorMs = anchor.getTime();
      const n = Math.ceil((monthStartMs - anchorMs) / WEEK_MS);
      let t = anchorMs + n * WEEK_MS;
      for (; t < monthEndMs; t += WEEK_MS) {
        if (t < monthStartMs) continue;

        events.push({
          subscriptionId: sub.id,
          providerName: sub.providerName,
          billingInterval: sub.billingInterval,
          currency,
          amountCents: sub.amountCents,
          chargedAt: new Date(t),
        });
      }
      continue;
    }

    const stepMonths =
      sub.billingInterval === "MONTHLY"
        ? 1
        : sub.billingInterval === "QUARTERLY"
          ? 3
          : sub.billingInterval === "YEARLY"
            ? 12
            : 0;
    if (!stepMonths) continue;

    const anchorMonthIndex =
      anchor.getUTCFullYear() * 12 + anchor.getUTCMonth();
    const diff = targetMonthIndex - anchorMonthIndex;
    const normalizedMod = ((diff % stepMonths) + stepMonths) % stepMonths;
    if (normalizedMod !== 0) continue;

    events.push({
      subscriptionId: sub.id,
      providerName: sub.providerName,
      billingInterval: sub.billingInterval,
      currency,
      amountCents: sub.amountCents,
      chargedAt,
    });
  }

  events.sort((a, b) => a.chargedAt.getTime() - b.chargedAt.getTime());
  return events;
}

export function SubscriptionDiag({
  subscriptions,
}: {
  subscriptions: ApiSubscription[];
}) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");

  const monthStartUtc = useMemo(() => {
    const now = new Date();
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthOffset, 1),
    );
  }, [monthOffset]);

  const currencies = useMemo(() => {
    const set = new Set<string>();
    for (const s of subscriptions) {
      if (s.status !== "ACTIVE") continue;
      if (s.amountCents <= 0) continue;
      set.add((s.currency || "USD").toUpperCase());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [subscriptions]);

  useEffect(() => {
    if (currencies.length === 0) return;
    setSelectedCurrency((current) =>
      current && currencies.includes(current) ? current : currencies[0]!,
    );
  }, [currencies]);

  const monthEvents = useMemo(
    () => getChargeEventsForMonth(subscriptions, monthStartUtc),
    [subscriptions, monthStartUtc],
  );

  const { rows, totalCents, otherCurrencyTotals, ignoredCount } =
    useMemo(() => {
      const rowsBySubId = new Map<
        string,
        {
          subscriptionId: string;
          providerName: string;
          billingInterval: ApiSubscription["billingInterval"];
          currency: string;
          paymentCount: number;
          totalCents: number;
          days: number[];
        }
      >();

      const otherTotals = new Map<string, number>();

      for (const ev of monthEvents) {
        if (selectedCurrency && ev.currency !== selectedCurrency) {
          otherTotals.set(
            ev.currency,
            (otherTotals.get(ev.currency) ?? 0) + ev.amountCents,
          );
          continue;
        }

        const existing = rowsBySubId.get(ev.subscriptionId);
        if (!existing) {
          rowsBySubId.set(ev.subscriptionId, {
            subscriptionId: ev.subscriptionId,
            providerName: ev.providerName,
            billingInterval: ev.billingInterval,
            currency: ev.currency,
            paymentCount: 1,
            totalCents: ev.amountCents,
            days: [ev.chargedAt.getUTCDate()],
          });
        } else {
          existing.paymentCount += 1;
          existing.totalCents += ev.amountCents;
          existing.days.push(ev.chargedAt.getUTCDate());
        }
      }

      const resultRows = Array.from(rowsBySubId.values())
        .map((r) => ({
          ...r,
          days: Array.from(new Set(r.days)).sort((a, b) => a - b),
        }))
        .sort((a, b) => a.totalCents);

      const total = resultRows.reduce((acc, r) => acc + r.totalCents, 0);
      const otherTotalsArr = Array.from(otherTotals.entries())
        .map(([currency, cents]) => ({ currency, cents }))
        .sort((a, b) => b.cents - a.cents);

      const ignored = subscriptions.filter((s) => {
        if (s.status !== "ACTIVE") return false;
        if (s.amountCents <= 0) return true;
        if (s.billingInterval === "UNKNOWN") return true;
        const anchor =
          parseIsoDate(s.nextBillingDate) ?? parseIsoDate(s.lastBilledAt);
        return !anchor;
      }).length;

      return {
        rows: resultRows,
        totalCents: total,
        otherCurrencyTotals: otherTotalsArr,
        ignoredCount: ignored,
      };
    }, [monthEvents, selectedCurrency, subscriptions]);

  const chartData = useMemo(() => {
    if (!selectedCurrency) return [];
    const points: Array<{
      month: string;
      label: string;
      fullLabel: string;
      totalCents: number;
    }> = [];
    for (let i = 5; i >= 0; i -= 1) {
      const m = addMonthsUtc(monthStartUtc, -i);
      const events = getChargeEventsForMonth(subscriptions, m);
      const now = Date.now();
      console.log("Miesiac" + monthLabel(m));
      console.log(events);

      const total = events
        .filter(
          (e) =>
            e.currency === selectedCurrency && e.chargedAt.getTime() <= now,
        )
        .reduce((acc, e) => acc + e.amountCents, 0);
      points.push({
        month: monthKey(m),
        label: monthShort(m),
        fullLabel: monthShortWithYear(m),
        totalCents: total,
      });
    }
    return points;
  }, [monthStartUtc, selectedCurrency, subscriptions]);
  const sum6Months = chartData.reduce((acc, p) => acc + p.totalCents, 0);
  return (
    <div className="grid gap-6">
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white/80 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div>
            <div className="text-sm font-semibold">Wydatki w miesiącu</div>
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
              Sprawdz ile zaplaciles w ciagu ostatnich 6 miesiecy.
            </div>
          </div>

          <div className="flex items-center gap-2"></div>
        </div>

        <div className="grid gap-4 px-5 py-4">
          <div className="flex dark:text-white flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-xs  text-zinc-500 dark:text-zinc-500">
                Razem ({selectedCurrency || "—"})
              </div>
              <div className="mt-1 text-2xl font-semibold">
                {selectedCurrency
                  ? formatMoney(sum6Months, selectedCurrency)
                  : "—"}
              </div>
              {ignoredCount > 0 ? (
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                  Pominięto {ignoredCount} subskrypcji (brak daty, kwoty lub
                  częstotliwości).
                </div>
              ) : null}
            </div>

            {currencies.length > 1 ? (
              <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                Waluta:
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:ring-zinc-700"
                >
                  {currencies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          {chartData.length > 0 ? (
            <div className="h-40 ">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: 8, right: 8 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v: unknown) =>
                      selectedCurrency && typeof v === "number"
                        ? formatMoney(Math.round(v), selectedCurrency)
                        : ""
                    }
                    width={84}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--tooltip-bg)" }}
                    formatter={(value: unknown) => {
                      const cents = typeof value === "number" ? value : 0;
                      return selectedCurrency
                        ? [
                            formatMoney(Math.round(cents), selectedCurrency),
                            "Razem",
                          ]
                        : ["—", "Razem"];
                    }}
                    labelFormatter={(_label: unknown, payload: unknown) => {
                      const first = Array.isArray(payload) ? payload[0] : null;
                      const data =
                        first && typeof first === "object" && first
                          ? (first as { payload?: unknown }).payload
                          : null;
                      if (
                        data &&
                        typeof data === "object" &&
                        "fullLabel" in data &&
                        typeof (data as { fullLabel?: unknown }).fullLabel ===
                          "string"
                      ) {
                        return (data as { fullLabel: string }).fullLabel;
                      }
                      return "";
                    }}
                  />
                  <Bar
                    dataKey="totalCents"
                    fill="currentColor"
                    className="text-indigo-700   dark:text-indigo-500"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
