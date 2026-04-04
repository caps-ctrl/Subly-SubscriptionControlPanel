import type { BillingInterval } from "@prisma/client";

export function monthlyCostCents(amountCents: number, interval: BillingInterval) {
  if (amountCents <= 0) return 0;
  switch (interval) {
    case "WEEKLY":
      return Math.round(amountCents * 4.345);
    case "MONTHLY":
      return amountCents;
    case "QUARTERLY":
      return Math.round(amountCents / 3);
    case "YEARLY":
      return Math.round(amountCents / 12);
    case "UNKNOWN":
    default:
      return 0;
  }
}

