import type { ApiSubscription } from "@/components/dashboard/types";

export function formatMoney(amountCents: number, currency: string) {
  const amount = (amountCents ?? 0) / 100;
  try {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function monthlyCostCents(sub: ApiSubscription) {
  if (sub.amountCents <= 0) return 0;
  switch (sub.billingInterval) {
    case "WEEKLY":
      return Math.round(sub.amountCents * 4.345);
    case "MONTHLY":
      return sub.amountCents;
    case "QUARTERLY":
      return Math.round(sub.amountCents / 3);
    case "YEARLY":
      return Math.round(sub.amountCents / 12);
    case "UNKNOWN":
    default:
      return 0;
  }
}

export function formatDate(dateIso: string | null) {
  if (!dateIso) return "—";
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pl-PL", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}
