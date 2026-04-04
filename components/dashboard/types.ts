export type SessionUser = {
  id: string;
  email: string;
  plan: "FREE" | "PRO";
};

export type ApiSubscription = {
  id: string;
  providerName: string;
  status: "ACTIVE" | "PAUSED" | "CANCELED";
  amountCents: number;
  currency: string;
  billingInterval: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "UNKNOWN";
  nextBillingDate: string | null;
  lastBilledAt: string | null;
  source: "MANUAL" | "GMAIL";
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CancellationGuide = {
  summary: string;
  steps: string[];
  cancellationUrl?: string | null;
  email?: { to?: string | null; subject: string; bodyText: string } | null;
  notes?: string | null;
};

