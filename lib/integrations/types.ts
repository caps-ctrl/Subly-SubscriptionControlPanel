export type IntegrationId = "gmail" | "stripe" | "apple" | "google_play";

export type SubscriptionCandidate = {
  providerName: string;
  amountCents: number;
  currency: string;
  billingInterval: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "UNKNOWN";
  nextBillingDate?: string | null;
  source: IntegrationId | "manual";
  evidence?: { kind: string; id?: string; snippet?: string }[];
};

export interface SubscriptionIntegration {
  id: IntegrationId;
  displayName: string;
  isConnected(userId: string): Promise<boolean>;
  scan(userId: string): Promise<SubscriptionCandidate[]>;
}

