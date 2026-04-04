"use client";

import { useMemo, useState } from "react";

import type {
  ApiSubscription,
  CancellationGuide,
} from "@/components/dashboard/types";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export function CancelHelpModal({
  subscription,
  guide,
  gmailConnected,
  onClose,
}: {
  subscription: ApiSubscription;
  guide: CancellationGuide;
  gmailConnected: boolean;
  onClose: () => void;
}) {
  const [draftStatus, setDraftStatus] = useState<string | null>(null);

  const stepsText = useMemo(
    () =>
      [
        guide.summary,
        "",
        ...guide.steps.map((s, i) => `${i + 1}. ${s}`),
        guide.cancellationUrl ? `\nLink: ${guide.cancellationUrl}` : "",
        guide.notes ? `\nUwagi: ${guide.notes}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    [guide],
  );

  async function copy() {
    await navigator.clipboard.writeText(stepsText);
  }

  async function createDraft() {
    if (!guide.email) return;
    setDraftStatus("Tworzenie szkicu…");
    try {
      const res = await fetch("/api/gmail/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          to: guide.email.to ?? "support@example.com",
          subject: guide.email.subject,
          bodyText: guide.email.bodyText,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { error?: string; draftId?: string | null }
        | null;
      if (!res.ok) {
        setDraftStatus(data?.error ?? "DRAFT_FAILED");
        return;
      }
      setDraftStatus(
        data?.draftId ? `Utworzono szkic (id: ${data.draftId}).` : "Utworzono szkic.",
      );
    } finally {
      // noop
    }
  }

  return (
    <Modal title={`Anulowanie: ${subscription.providerName}`} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <div className="text-sm font-semibold">Podsumowanie</div>
          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
            {guide.summary}
          </p>
        </div>

        <div>
          <div className="text-sm font-semibold">Kroki</div>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
            {guide.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>

        {guide.cancellationUrl ? (
          <div>
            <div className="text-sm font-semibold">Link</div>
            <a
              href={guide.cancellationUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block break-all text-sm underline"
            >
              {guide.cancellationUrl}
            </a>
          </div>
        ) : null}

        {guide.email ? (
          <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="text-sm font-semibold">Gotowy email</div>
            <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
              <div>
                <span className="font-medium">Temat:</span> {guide.email.subject}
              </div>
              <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-zinc-50 p-3 text-xs text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                {guide.email.bodyText}
              </pre>
              <div className="mt-3 flex flex-wrap gap-2">
                {gmailConnected ? (
                  <Button variant="secondary" onClick={createDraft}>
                    Utwórz szkic w Gmail
                  </Button>
                ) : (
                  <Button variant="secondary" disabled>
                    Podłącz Gmail, aby utworzyć szkic
                  </Button>
                )}
                <Button variant="ghost" onClick={copy}>
                  Kopiuj wszystko
                </Button>
              </div>
              {draftStatus ? (
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                  {draftStatus}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={copy}>
              Kopiuj instrukcję
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

