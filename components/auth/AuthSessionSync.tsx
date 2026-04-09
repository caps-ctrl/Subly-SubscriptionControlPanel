"use client";

import { useEffect, useEffectEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";
import { normalizeRedirectPath } from "@/lib/auth/normalizeRedirectPath";

const SESSION_SYNC_INTERVAL_MS = 60 * 1000;

export function AuthSessionSync() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const redirectAfterAuth = normalizeRedirectPath(
    searchParams.get("next"),
    "/dashboard",
  );
  const isAuthPage = pathname === "/login" || pathname === "/register";

  const syncSession = useEffectEvent(async () => {
    try {
      const response = await fetchWithAuth("/api/auth/me", {
        method: "GET",
      });

      const data = (await response.json().catch(() => null)) as {
        user?: {
          id: string;
        } | null;
      } | null;

      if (isAuthPage && data?.user) {
        router.replace(redirectAfterAuth);
        router.refresh();
      }
    } catch {
      // Ignore transient network failures during background session sync.
    }
  });

  useEffect(() => {
    void syncSession();
  }, [pathname, search]);

  useEffect(() => {
    function handleFocus() {
      void syncSession();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void syncSession();
      }
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void syncSession();
      }
    }, SESSION_SYNC_INTERVAL_MS);

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}
