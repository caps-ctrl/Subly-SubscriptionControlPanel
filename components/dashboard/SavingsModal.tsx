"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export type SavingsInsights = {
  summary: string;
  suggestions: Array<{
    title: string;
    details: string;
    estimatedMonthlySavingsCents?: number;
    currency?: string;
    actionSteps: string[];
  }>;
};

export function SavingsModal({
  insights,
  onClose,
}: {
  insights: SavingsInsights;
  onClose: () => void;
}) {
  return (
    <Modal title="Sugestie oszczędności" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          {insights.summary}
        </p>

        <div className="space-y-3">
          {insights.suggestions.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="text-sm font-semibold">{s.title}</div>
              <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                {s.details}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
                {s.actionSteps.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Zamknij
          </Button>
        </div>
      </div>
    </Modal>
  );
}

