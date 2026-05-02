"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import DashboardNav from "@/components/dashboard/DashboardNav";
import { cn } from "@/lib/utils";

type MobileDashboardMenuProps = {
  initials: string;
  email: string | null;
  plan: "FREE" | "PRO" | null;
};

export default function MobileDashboardMenu({
  initials,
  email,
  plan,
}: MobileDashboardMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Zamknij menu" : "Otwórz menu"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="fixed left-4 top-4 z-50 inline-flex size-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white/90 shadow-lg shadow-zinc-950/10 backdrop-blur sm:hidden dark:border-zinc-800 dark:bg-zinc-950/90 dark:shadow-black/30"
      >
        <span className="sr-only">{open ? "Zamknij menu" : "Otwórz menu"}</span>
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 text-zinc-950 dark:text-zinc-50"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {open ? (
            <>
              <path d="m6 6 12 12" />
              <path d="m18 6-12 12" />
            </>
          ) : (
            <>
              <path d="M3 6h18" />
              <path d="M3 12h18" />
              <path d="M3 18h18" />
            </>
          )}
        </svg>
      </button>

      <div
        aria-hidden={!open}
        className={cn(
          "fixed inset-0 z-40 bg-black/45 transition-opacity duration-200 sm:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setOpen(false)}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[82vw] max-w-72 flex-col justify-between border-r border-zinc-200 bg-zinc-100 px-3 py-4 shadow-2xl transition-transform duration-300 ease-out sm:hidden dark:border-zinc-800 dark:bg-zinc-950",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div>
          <div className="flex items-center justify-between gap-3 rounded-2xl px-2 py-2">
            <Link href="/" className="mb-4   block">
              <div className="flex items-center gap-2">
                <Image src="/logo.png" alt="Logo" width={36} height={36} />
                <h1 className="text-xl font-bold">Subly</h1>
              </div>
            </Link>
            <div>
              <button
                type="button"
                aria-label={open ? "Zamknij menu" : "Otwórz menu"}
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
                className=" z-50 inline-flex size-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white/90 shadow-lg shadow-zinc-950/10 backdrop-blur sm:hidden dark:border-zinc-800 dark:bg-zinc-950/90 dark:shadow-black/30"
              >
                <span className="sr-only">
                  {open ? "Zamknij menu" : "Otwórz menu"}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 text-zinc-950 dark:text-zinc-50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {open ? (
                    <>
                      <path d="m6 6 12 12" />
                      <path d="m18 6-12 12" />
                    </>
                  ) : (
                    <>
                      <path d="M3 6h18" />
                      <path d="M3 12h18" />
                      <path d="M3 18h18" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          <DashboardNav onNavigate={() => setOpen(false)} />
        </div>

        <Link
          href="/profile"
          onClick={() => setOpen(false)}
          className="mt-4 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white/80 px-3 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80"
        >
          <div className="grid size-10 place-items-center rounded-2xl bg-zinc-950 text-sm font-semibold text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950">
            {initials}
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-semibold">
              {email ?? "Nieznane konto"}
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              {plan ? `Plan: ${plan}` : "Brak aktywnej sesji"}
            </div>
          </div>
        </Link>
      </aside>
    </>
  );
}
