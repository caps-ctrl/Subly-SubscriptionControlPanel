"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";

type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "theme";
const COOKIE_KEY = "theme";
const THEME_EVENT = "subly-theme-change";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function getSystemPrefersDark() {
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
}

function getThemeFromCookie(): ThemeMode | undefined {
  const match = document.cookie.match(/(?:^|; )theme=(light|dark|system)/);
  return match ? (match[1] as ThemeMode) : undefined;
}

function applyTheme(mode: ThemeMode) {
  const cookieTheme = getThemeFromCookie();

  const finalMode = cookieTheme ?? mode;

  const isDark =
    finalMode === "dark" || (finalMode === "system" && getSystemPrefersDark());

  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.dataset.theme = finalMode;
}
function readMode(): ThemeMode {
  const fromDom = document.documentElement.dataset.theme;
  if (fromDom === "light" || fromDom === "dark") return fromDom;
  if (fromDom === "system") return "system";

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // ignore
  }
  return "system";
}

function persistMode(mode: ThemeMode) {
  try {
    if (mode === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore
  }

  try {
    if (mode === "system") {
      document.cookie = `${COOKIE_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
    } else {
      document.cookie = `${COOKIE_KEY}=${mode}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
    }
  } catch {
    // ignore
  }
}

function subscribe(onStoreChange: () => void) {
  const onCustom = () => onStoreChange();
  window.addEventListener(THEME_EVENT, onCustom);

  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) onStoreChange();
  };
  window.addEventListener("storage", onStorage);

  const media = window.matchMedia?.("(prefers-color-scheme: dark)");
  if (!media) {
    return () => {
      window.removeEventListener(THEME_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }

  const onMedia = () => {
    if (readMode() === "system") applyTheme("system");
    onStoreChange();
  };

  if (media.addEventListener) {
    media.addEventListener("change", onMedia);
    return () => {
      window.removeEventListener(THEME_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
      media.removeEventListener("change", onMedia);
    };
  }

  // Safari fallback
  media.addListener?.(onMedia);
  return () => {
    window.removeEventListener(THEME_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
    media.removeListener?.(onMedia);
  };
}

function getSnapshot(): ThemeMode {
  return readMode();
}

function getServerSnapshot(): ThemeMode {
  return "system";
}

export default function ThemeToggle({
  showLabel = true,
  className = "",
}: {
  showLabel?: boolean;
  className?: string;
}) {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  const label = useMemo(() => {
    if (mode === "dark") return "Ciemny";
    if (mode === "light") return "Jasny";
    return "Auto";
  }, [mode]);

  function setTheme(next: ThemeMode) {
    persistMode(next);
    applyTheme(next);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  const activeIndex = mode === "system" ? 0 : mode === "dark" ? 1 : 2;

  return (
    <div className={className}>
      <div className="relative rounded-2xl border border-zinc-200/70 bg-white/70 p-1 shadow-lg shadow-black/5 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-zinc-800/70 dark:bg-zinc-950/60">
        <div
          className="pointer-events-none absolute inset-y-1 w-[calc((100%-0.5rem)/3)] rounded-xl bg-zinc-950 transition-transform duration-200 ease-out dark:bg-white"
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
        />

        <div className="relative grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => setTheme("system")}
            aria-pressed={mode === "system"}
            title="Auto (system)"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-zinc-600 transition-colors hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-400 dark:hover:text-zinc-50 dark:focus-visible:ring-zinc-700"
          >
            <span className="sr-only">Auto</span>
            <svg
              viewBox="0 0 24 24"
              className={
                mode === "system"
                  ? "h-5 w-5 text-white dark:text-zinc-950"
                  : "h-5 w-5"
              }
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="12" rx="2" />
              <path d="M7 20h10" />
              <path d="M9 16v4" />
              <path d="M15 16v4" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setTheme("dark")}
            aria-pressed={mode === "dark"}
            title="Ciemny"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-zinc-600 transition-colors hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-400 dark:hover:text-zinc-50 dark:focus-visible:ring-zinc-700"
          >
            <span className="sr-only">Ciemny</span>
            <svg
              viewBox="0 0 24 24"
              className={
                mode === "dark"
                  ? "h-5 w-5 text-white dark:text-zinc-950"
                  : "h-5 w-5"
              }
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8Z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setTheme("light")}
            aria-pressed={mode === "light"}
            title="Jasny"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-zinc-600 transition-colors hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-400 dark:hover:text-zinc-50 dark:focus-visible:ring-zinc-700"
          >
            <span className="sr-only">Jasny</span>
            <svg
              viewBox="0 0 24 24"
              className={
                mode === "light"
                  ? "h-5 w-5 text-white dark:text-zinc-950"
                  : "h-5 w-5"
              }
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="M4.93 4.93l1.41 1.41" />
              <path d="M17.66 17.66l1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="M4.93 19.07l1.41-1.41" />
              <path d="M17.66 6.34l1.41-1.41" />
            </svg>
          </button>
        </div>
      </div>

      {showLabel ? (
        <div className="mt-1 text-center text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
          {label}
        </div>
      ) : null}
    </div>
  );
}
