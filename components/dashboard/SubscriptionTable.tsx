"use client";

import { Button } from "@/components/ui/Button";
import type { ApiSubscription } from "@/components/dashboard/types";
import { formatDate, formatMoney } from "@/components/dashboard/utils";

export function SubscriptionTable({
  subscriptions,
  onCancelHelp,
}: {
  subscriptions: ApiSubscription[];
  onCancelHelp: (sub: ApiSubscription) => void;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white/80 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <div className="text-sm font-semibold">Subskrypcje</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-500">
          {subscriptions.length} pozycji
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50/70 text-xs text-zinc-600 dark:bg-zinc-950/60 dark:text-zinc-400">
            <tr>
              <th className="px-5 py-3 font-medium">Usługa</th>
              <th className="px-5 py-3 font-medium">Cena</th>
              <th className="px-5 py-3 font-medium">Częstotliwość</th>
              <th className="px-5 py-3 font-medium">Następna płatność</th>
              <th className="px-5 py-3 font-medium">Źródło</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((s) => (
              <tr
                key={s.id}
                className="border-t border-zinc-200 dark:border-zinc-800"
              >
                <td className="px-5 py-3">
                  <div className="font-medium">{s.providerName}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-500">
                    {s.status}
                  </div>
                </td>
                <td className="px-5 py-3">{formatMoney(s.amountCents, s.currency)}</td>
                <td className="px-5 py-3">{s.billingInterval}</td>
                <td className="px-5 py-3">{formatDate(s.nextBillingDate)}</td>
                <td className="px-5 py-3">{s.source}</td>
                <td className="px-5 py-3 text-right">
                  <Button variant="secondary" onClick={() => onCancelHelp(s)}>
                    Pomóż mi zrezygnować
                  </Button>
                </td>
              </tr>
            ))}
            {subscriptions.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-8 text-center text-sm text-zinc-600 dark:text-zinc-400"
                >
                  Brak subskrypcji. Dodaj ręcznie lub podłącz Gmail i uruchom skan.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
