"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { ApiSubscription } from "@/components/dashboard/types";
import { formatDate, formatMoney } from "@/components/dashboard/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type SavingsInsights = {
  summary: string;
  suggestions: Array<{
    title: string;
    details: string;
    estimatedMonthlySavingsCents?: number;
    currency?: string;
    actionSteps: string[];
  }>;
};

type CancellationGuide = {
  summary: string;
  steps: string[];
  cancellationUrl?: string | null;
  email?: { to?: string | null; subject: string; bodyText: string } | null;
  notes?: string | null;
};

type ExtractPreviewResult = {
  isSubscriptionEmail: boolean;
  subscriptions: Array<{
    providerName: string;
    amountCents: number;
    currency: string;
    billingInterval: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "UNKNOWN";
    nextBillingDate?: string | null;
    lastBilledAt?: string | null;
    confidence?: number;
  }>;
};

type ScanSummary = {
  ok?: boolean;
  scanned?: number;
  processed?: number;
  created?: number;
  updated?: number;
  skipped?: number;
  error?: string;
};

function intervalLabel(interval: ApiSubscription["billingInterval"]) {
  switch (interval) {
    case "WEEKLY":
      return "co tydzień";
    case "MONTHLY":
      return "co miesiąc";
    case "QUARTERLY":
      return "co kwartał";
    case "YEARLY":
      return "co rok";
    case "UNKNOWN":
    default:
      return "niestandardowo";
  }
}

function extractionIntervalLabel(
  interval: ExtractPreviewResult["subscriptions"][number]["billingInterval"],
) {
  switch (interval) {
    case "WEEKLY":
      return "Tygodniowo";
    case "MONTHLY":
      return "Miesięcznie";
    case "QUARTERLY":
      return "Kwartalnie";
    case "YEARLY":
      return "Rocznie";
    case "UNKNOWN":
    default:
      return "Nieznany cykl";
  }
}

function surfaceClassName(extra = "") {
  return [
    "rounded-[28px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <div className="text-[11px] uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        {hint}
      </p>
    </div>
  );
}

function ToolBadge({
  label,
  tone,
}: {
  label: string;
  tone: "sky" | "amber" | "emerald";
}) {
  const styles =
    tone === "sky"
      ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/80 dark:bg-sky-950/40 dark:text-sky-200"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/80 dark:bg-amber-950/40 dark:text-amber-200"
        : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/80 dark:bg-emerald-950/40 dark:text-emerald-200";

  return (
    <div
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium",
        styles,
      ].join(" ")}
    >
      <span className="h-2 w-2 rounded-full bg-current opacity-70" />
      {label}
    </div>
  );
}

export function AiHelpWorkspace({
  subscriptions,
  gmailAddress,
  plan,
}: {
  subscriptions: ApiSubscription[];
  gmailAddress: string | null;
  plan: "FREE" | "PRO";
}) {
  const router = useRouter();

  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState(
    subscriptions[0]?.id ?? "",
  );
  const [savingsInsights, setSavingsInsights] =
    useState<SavingsInsights | null>(null);
  const [savingsError, setSavingsError] = useState<string | null>(null);
  const [savingsLoading, setSavingsLoading] = useState(false);

  const [cancelGuide, setCancelGuide] = useState<CancellationGuide | null>(
    null,
  );
  const [cancelModel, setCancelModel] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [draftStatus, setDraftStatus] = useState<string | null>(null);

  const [scanSummary, setScanSummary] = useState<ScanSummary | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [maxMessages, setMaxMessages] = useState("12");

  const [extractResult, setExtractResult] =
    useState<ExtractPreviewResult | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractLoading, setExtractLoading] = useState(false);
  const [emailForm, setEmailForm] = useState({
    subject: "",
    from: "",
    date: "",
    bodyText: "",
  });

  const selectedSubscription =
    subscriptions.find((sub) => sub.id === selectedSubscriptionId) ?? null;

  async function runSavingsInsights() {
    setSavingsLoading(true);
    setSavingsError(null);

    try {
      const res = await fetch("/api/insights/savings", {
        method: "POST",
      });
      const data = (await res.json().catch(() => null)) as {
        insights?: SavingsInsights;
        error?: string;
      } | null;

      if (!res.ok || !data?.insights) {
        if (data?.error === "PRO_REQUIRED") {
          setSavingsError("Ten moduł jest dostępny w planie PRO.");
        } else {
          setSavingsError("Nie udało się wygenerować sugestii oszczędności.");
        }
        return;
      }

      setSavingsInsights(data.insights);
    } finally {
      setSavingsLoading(false);
    }
  }

  async function runCancellationGuide() {
    if (!selectedSubscriptionId) {
      setCancelError(
        "Wybierz subskrypcję, dla której agent ma przygotować plan.",
      );
      return;
    }

    setCancelLoading(true);
    setCancelError(null);
    setDraftStatus(null);

    try {
      const res = await fetch("/api/ai/cancel-help", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subscriptionId: selectedSubscriptionId,
          userLanguage: "pl",
          userCountry: "PL",
        }),
      });

      const data = (await res.json().catch(() => null)) as {
        guide?: CancellationGuide;
        model?: string | null;
        error?: string;
      } | null;

      if (!res.ok || !data?.guide) {
        setCancelError("Nie udało się przygotować instrukcji anulowania.");
        return;
      }

      setCancelGuide(data.guide);
      setCancelModel(data.model ?? null);
    } finally {
      setCancelLoading(false);
    }
  }

  async function copyGuide() {
    if (!cancelGuide) return;

    const composed = [
      cancelGuide.summary,
      "",
      ...cancelGuide.steps.map((step, index) => `${index + 1}. ${step}`),
      cancelGuide.cancellationUrl
        ? `\nLink: ${cancelGuide.cancellationUrl}`
        : "",
      cancelGuide.notes ? `\nUwagi: ${cancelGuide.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    await navigator.clipboard.writeText(composed);
    setDraftStatus("Instrukcja skopiowana do schowka.");
  }

  async function createDraft() {
    if (!cancelGuide?.email) return;

    setDraftStatus("Tworzenie szkicu...");
    try {
      const res = await fetch("/api/gmail/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          to: cancelGuide.email.to ?? "support@example.com",
          subject: cancelGuide.email.subject,
          bodyText: cancelGuide.email.bodyText,
        }),
      });

      const data = (await res.json().catch(() => null)) as {
        error?: string;
        draftId?: string | null;
      } | null;

      if (!res.ok) {
        setDraftStatus(data?.error ?? "Nie udało się utworzyć szkicu.");
        return;
      }

      setDraftStatus(
        data?.draftId
          ? `Szkic gotowy. Id: ${data.draftId}.`
          : "Szkic został utworzony.",
      );
    } catch {
      setDraftStatus("Wystąpił problem podczas tworzenia szkicu.");
    }
  }

  async function runMailboxScan() {
    setScanLoading(true);
    setScanError(null);

    try {
      const parsed = Number(maxMessages);
      const res = await fetch("/api/subscriptions/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          maxMessages: Number.isFinite(parsed) ? parsed : 12,
        }),
      });

      const data = (await res.json().catch(() => null)) as ScanSummary | null;

      if (!res.ok) {
        if (data?.error === "GMAIL_NOT_CONNECTED") {
          setScanError("Najpierw podłącz Gmail, żeby uruchomić skan.");
        } else {
          setScanError("Skan skrzynki nie powiódł się.");
        }
        return;
      }

      setScanSummary(data);
      router.refresh();
    } finally {
      setScanLoading(false);
    }
  }

  async function runManualEmailAnalysis() {
    if (emailForm.bodyText.trim().length < 20) {
      setExtractError(
        "Wklej trochę więcej treści maila, żebym miał co analizować.",
      );
      return;
    }

    setExtractLoading(true);
    setExtractError(null);

    try {
      const res = await fetch("/api/ai/extract-preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subject: emailForm.subject || null,
          from: emailForm.from || null,
          date: emailForm.date || null,
          bodyText: emailForm.bodyText,
        }),
      });

      const data = (await res.json().catch(() => null)) as {
        result?: ExtractPreviewResult;
        error?: string;
      } | null;

      if (!res.ok || !data?.result) {
        setExtractError("Nie udało się zinterpretować tego maila.");
        return;
      }

      setExtractResult(data.result);
    } finally {
      setExtractLoading(false);
    }
  }

  return (
    <section className="flex min-h-screen flex-col gap-6 p-4 sm:p-6">
      <div className="relative overflow-hidden rounded-[34px] border border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-zinc-100 p-6 shadow-sm dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 sm:p-8">
        <div className="absolute -right-12 -top-10 h-48 w-48 rounded-full bg-sky-200/60 blur-3xl dark:bg-sky-900/30" />
        <div className="absolute bottom-0 left-1/3 h-44 w-44 rounded-full bg-amber-200/60 blur-3xl dark:bg-amber-900/20" />

        <div className="relative grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="text-[11px] uppercase tracking-[0.34em] text-zinc-500 dark:text-zinc-400">
              AI Help Workspace
            </div>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
              Agent pomocy dla subskrypcji, zasilany przez Twoje gotowe funkcje
              OpenAI.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
              Jedno miejsce do wykrywania subskrypcji z maili, szukania
              oszczędności i przygotowania instrukcji anulowania bez skakania po
              kilku ekranach.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <ToolBadge label="Analiza kosztów" tone="sky" />
              <ToolBadge label="Instrukcje anulowania" tone="amber" />
              <ToolBadge label="Detekcja subskrypcji z maili" tone="emerald" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <StatCard
              label="Aktywne suby"
              value={String(subscriptions.length)}
              hint="Agent może pracować na obecnej liście albo pomóc Ci ją uzupełnić."
            />
            <StatCard
              label="Plan"
              value={plan}
              hint={
                plan === "PRO"
                  ? "Masz pełny dostęp do modułu sugestii oszczędności."
                  : "Sugestie oszczędności odpalą się po wejściu na plan PRO."
              }
            />
            <StatCard
              label="Gmail"
              value={gmailAddress ? "Połączony" : "Niepodłączony"}
              hint={
                gmailAddress
                  ? `Skan użyje skrzynki ${gmailAddress}.`
                  : "Połącz skrzynkę, a agent przeskanuje ostatnie maile rozliczeniowe."
              }
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className={surfaceClassName("p-6")}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold">Radar oszczędności</div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  Ten moduł bierze Twoją aktualną listę subskrypcji i szuka
                  miejsc, gdzie można ściąć koszt albo uprościć stack.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {plan === "FREE" ? (
                  <a
                    href="/checkout"
                    className="text-sm font-medium text-zinc-600 underline underline-offset-4 dark:text-zinc-300"
                  >
                    Odblokuj PRO
                  </a>
                ) : null}
                <Button
                  variant={plan === "PRO" ? "primary" : "secondary"}
                  disabled={plan !== "PRO" || savingsLoading || true} // --- IGNORE: wyłączamy tymczasowo, bo moduł jest niedostępny ---
                  onClick={runSavingsInsights}
                >
                  {savingsLoading ? "Analizuję..." : "Znajdź oszczędności"}
                </Button>
              </div>
            </div>

            {savingsError ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
                {savingsError}
              </div>
            ) : null}

            {savingsInsights ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-[24px] border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                  <div className="text-xs uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                    Podsumowanie
                  </div>
                  <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                    {savingsInsights.summary}
                  </p>
                </div>

                <div className="grid gap-3">
                  {savingsInsights.suggestions.map((suggestion) => (
                    <div
                      key={suggestion.title}
                      className="rounded-[24px] border border-zinc-200 p-4 dark:border-zinc-800"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold">
                            {suggestion.title}
                          </div>
                          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                            {suggestion.details}
                          </p>
                        </div>

                        {typeof suggestion.estimatedMonthlySavingsCents ===
                          "number" && suggestion.currency ? (
                          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900/80 dark:bg-emerald-950/40 dark:text-emerald-200">
                            Potencjał:{" "}
                            {formatMoney(
                              suggestion.estimatedMonthlySavingsCents,
                              suggestion.currency,
                            )}
                            /mies.
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-4 grid gap-2">
                        {suggestion.actionSteps.map((step, index) => (
                          <div
                            key={`${suggestion.title}-${index}`}
                            className="flex gap-3 rounded-2xl bg-zinc-50 px-3 py-3 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                          >
                            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                              {index + 1}
                            </div>
                            <div>{step}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-[24px] border border-dashed border-zinc-300 px-4 py-6 text-sm leading-6 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                Agent pokaże tutaj konkretne rekomendacje po uruchomieniu
                analizy kosztów.
              </div>
            )}
          </div>

          <div className={surfaceClassName("p-6")}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold">Interpreter maili</div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  Wklej treść wiadomości, a agent sprawdzi, czy to subskrypcja i
                  jakie dane rozliczeniowe da się z niej wyciągnąć.
                </p>
              </div>

              <Button
                variant="primary"
                onClick={runManualEmailAnalysis}
                disabled={true} // --- IGNORE: wyłączamy tymczasowo, bo moduł jest niedostępny ---
                // disabled={extractLoading}
              >
                {extractLoading ? "Czytam mail..." : "Przeanalizuj wiadomość"}
              </Button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Input
                value={emailForm.subject}
                onChange={(event) =>
                  setEmailForm((current) => ({
                    ...current,
                    subject: event.target.value,
                  }))
                }
                placeholder="Temat maila"
              />
              <Input
                value={emailForm.from}
                onChange={(event) =>
                  setEmailForm((current) => ({
                    ...current,
                    from: event.target.value,
                  }))
                }
                placeholder="Nadawca, np. billing@netflix.com"
              />
              <Input
                value={emailForm.date}
                onChange={(event) =>
                  setEmailForm((current) => ({
                    ...current,
                    date: event.target.value,
                  }))
                }
                placeholder="Data z nagłówka maila"
                className="sm:col-span-2"
              />
            </div>

            <textarea
              value={emailForm.bodyText}
              onChange={(event) =>
                setEmailForm((current) => ({
                  ...current,
                  bodyText: event.target.value,
                }))
              }
              placeholder="Wklej treść maila..."
              className="mt-3 min-h-52 w-full rounded-[24px] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800 dark:bg-black dark:text-zinc-50 dark:placeholder:text-zinc-500"
            />

            {extractError ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
                {extractError}
              </div>
            ) : null}

            {extractResult ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-[24px] border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                  <div className="text-xs uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                    Werdykt
                  </div>
                  <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                    {extractResult.isSubscriptionEmail
                      ? "Wygląda na mail związany z płatną subskrypcją lub cyklicznym rozliczeniem."
                      : "To raczej nie jest wiadomość o cyklicznej subskrypcji."}
                  </p>
                </div>

                {extractResult.subscriptions.length > 0 ? (
                  <div className="grid gap-3">
                    {extractResult.subscriptions.map((item, index) => (
                      <div
                        key={`${item.providerName}-${index}`}
                        className="rounded-[24px] border border-zinc-200 p-4 dark:border-zinc-800"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold">
                              {item.providerName}
                            </div>
                            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                              {formatMoney(item.amountCents, item.currency)} •{" "}
                              {extractionIntervalLabel(item.billingInterval)}
                            </p>
                          </div>

                          {typeof item.confidence === "number" ? (
                            <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:border-sky-900/80 dark:bg-sky-950/40 dark:text-sky-200">
                              Pewność: {Math.round(item.confidence * 100)}%
                            </div>
                          ) : null}
                        </div>

                        <div className="mt-4 grid gap-2 text-sm text-zinc-600 dark:text-zinc-400 sm:grid-cols-2">
                          <div className="rounded-2xl bg-zinc-50 px-3 py-3 dark:bg-zinc-900">
                            Następne obciążenie:{" "}
                            {formatDate(item.nextBillingDate ?? null)}
                          </div>
                          <div className="rounded-2xl bg-zinc-50 px-3 py-3 dark:bg-zinc-900">
                            Ostatnia płatność:{" "}
                            {formatDate(item.lastBilledAt ?? null)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-6 rounded-[24px] border border-dashed border-zinc-300 px-4 py-6 text-sm leading-6 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                Tutaj zobaczysz, co model odczytał z pojedynczej wiadomości,
                zanim cokolwiek zapiszesz do bazy.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className={surfaceClassName("p-6")}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold">
                  Przewodnik anulowania
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  Wybierz subskrypcję, a agent przygotuje kroki anulowania oraz
                  gotowy szkic wiadomości do supportu, jeśli to ma sens.
                </p>
              </div>

              <Button
                variant="primary"
                onClick={runCancellationGuide}
                disabled={!subscriptions.length || cancelLoading || true} // --- IGNORE: wyłączamy tymczasowo, bo moduł jest niedostępny ---
              >
                {cancelLoading ? "Przygotowuję..." : "Generuj plan anulowania"}
              </Button>
            </div>

            <div className="mt-5">
              <select
                value={selectedSubscriptionId}
                onChange={(event) =>
                  setSelectedSubscriptionId(event.target.value)
                }
                className="h-11 w-full rounded-[18px] border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-black dark:text-zinc-50"
                disabled={!subscriptions.length}
              >
                {subscriptions.length ? (
                  subscriptions.map((subscription) => (
                    <option key={subscription.id} value={subscription.id}>
                      {subscription.providerName} •{" "}
                      {formatMoney(
                        subscription.amountCents,
                        subscription.currency,
                      )}{" "}
                      • {intervalLabel(subscription.billingInterval)}
                    </option>
                  ))
                ) : (
                  <option value="">Brak aktywnych subskrypcji</option>
                )}
              </select>
            </div>

            {selectedSubscription ? (
              <div className="mt-4 rounded-[24px] border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                <div className="text-xs uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                  Wybrana subskrypcja
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold">
                      {selectedSubscription.providerName}
                    </div>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {formatMoney(
                        selectedSubscription.amountCents,
                        selectedSubscription.currency,
                      )}{" "}
                      • {intervalLabel(selectedSubscription.billingInterval)}
                    </p>
                  </div>
                  <div className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                    Następna płatność:{" "}
                    {formatDate(selectedSubscription.nextBillingDate)}
                  </div>
                </div>
              </div>
            ) : null}

            {cancelError ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
                {cancelError}
              </div>
            ) : null}

            {cancelGuide ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-[24px] border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                      Odpowiedź agenta
                    </div>
                    {cancelModel ? (
                      <div className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                        model: {cancelModel}
                      </div>
                    ) : null}
                  </div>

                  <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                    {cancelGuide.summary}
                  </p>
                </div>

                <div className="grid gap-2">
                  {cancelGuide.steps.map((step, index) => (
                    <div
                      key={`${step}-${index}`}
                      className="flex gap-3 rounded-[22px] border border-zinc-200 px-4 py-3 dark:border-zinc-800"
                    >
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>

                {cancelGuide.cancellationUrl ? (
                  <a
                    href={cancelGuide.cancellationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 transition hover:bg-amber-100 dark:border-amber-900/80 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-950/60"
                  >
                    <span className="truncate">Otwórz stronę anulowania</span>
                    <span className="ml-4 shrink-0">↗</span>
                  </a>
                ) : null}

                {cancelGuide.notes ? (
                  <div className="rounded-[22px] border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      Uwagi:
                    </span>{" "}
                    {cancelGuide.notes}
                  </div>
                ) : null}

                {cancelGuide.email ? (
                  <div className="rounded-[24px] border border-zinc-200 p-4 dark:border-zinc-800">
                    <div className="text-sm font-semibold">
                      Szkic wiadomości do supportu
                    </div>
                    <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                      <div>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          Temat:
                        </span>{" "}
                        {cancelGuide.email.subject}
                      </div>
                      <pre className="mt-3 whitespace-pre-wrap rounded-[20px] bg-zinc-50 p-4 text-xs leading-6 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                        {cancelGuide.email.bodyText}
                      </pre>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="ghost" onClick={copyGuide}>
                        Kopiuj instrukcję
                      </Button>
                      {gmailAddress ? (
                        <Button variant="secondary" onClick={createDraft}>
                          Utwórz szkic w Gmail
                        </Button>
                      ) : (
                        <a
                          href="/api/gmail/connect"
                          className="inline-flex items-center justify-center rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
                        >
                          Podłącz Gmail do szkicu
                        </a>
                      )}
                    </div>

                    {draftStatus ? (
                      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                        {draftStatus}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-6 rounded-[24px] border border-dashed border-zinc-300 px-4 py-6 text-sm leading-6 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                Po wygenerowaniu planu zobaczysz tutaj gotowe kroki anulowania i
                ewentualną wersję wiadomości do supportu.
              </div>
            )}
          </div>

          <div className={surfaceClassName("p-6")}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold">Skan skrzynki Gmail</div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  Ten tryb używa istniejącego pipeline’u ekstrakcji i przegląda
                  ostatnie wiadomości rozliczeniowe, żeby wykryć nowe
                  subskrypcje.
                </p>
              </div>

              {gmailAddress ? (
                <Button
                  variant="primary"
                  onClick={runMailboxScan}
                  disabled={true} // --- IGNORE: wyłączamy tymczasowo, bo moduł jest niedostępny ---
                  //disabled={scanLoading}
                >
                  {scanLoading ? "Skanuję..." : "Uruchom skan"}
                </Button>
              ) : (
                <a
                  href="/api/gmail/connect"
                  className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  Podłącz Gmail
                </a>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <label className="text-sm text-zinc-600 dark:text-zinc-400">
                Ile maili sprawdzić:
              </label>
              <Input
                type="number"
                min={1}
                max={30}
                value={maxMessages}
                onChange={(event) => setMaxMessages(event.target.value)}
                className="w-28"
              />
              {gmailAddress ? (
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Połączone konto: {gmailAddress}
                </div>
              ) : null}
            </div>

            {scanError ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
                {scanError}
              </div>
            ) : null}

            {scanSummary ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                  <div className="text-xs uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                    Sprawdzone
                  </div>
                  <div className="mt-3 text-3xl font-semibold tracking-tight">
                    {scanSummary.scanned ?? 0}
                  </div>
                </div>
                <div className="rounded-[24px] border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                  <div className="text-xs uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                    Przetworzone
                  </div>
                  <div className="mt-3 text-3xl font-semibold tracking-tight">
                    {scanSummary.processed ?? 0}
                  </div>
                </div>
                <div className="rounded-[24px] border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    Utworzone
                  </div>
                  <div className="mt-2 text-2xl font-semibold">
                    {scanSummary.created ?? 0}
                  </div>
                </div>
                <div className="rounded-[24px] border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    Zaktualizowane
                  </div>
                  <div className="mt-2 text-2xl font-semibold">
                    {scanSummary.updated ?? 0}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-[24px] border border-dashed border-zinc-300 px-4 py-6 text-sm leading-6 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                Po skanie agent pokaże tutaj, ile wiadomości przejrzał i ile
                subskrypcji udało się znaleźć lub odświeżyć.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
