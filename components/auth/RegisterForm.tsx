"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { normalizeRedirectPath } from "@/lib/auth/normalizeRedirectPath";

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = useMemo(
    () => normalizeRedirectPath(params.get("next"), "/dashboard"),
    [params],
  );
  const loginHref =
    next === "/dashboard"
      ? "/login"
      : `/login?next=${encodeURIComponent(next)}`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        setError(data?.error ?? "REGISTER_FAILED");
        return;
      }
      router.push(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full p-6 border border-black dark:border-white max-w-md">
      <div className="mb-6 ">
        <div className="flex gap-2 items-center">
          <Image src="/logo.png" alt="Logo" width={48} height={48} />
          <h1 className="text-2xl font-semibold tracking-tight">
            Utwórz konto
          </h1>{" "}
        </div>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Wersja Free pozwala śledzić do 3 subskrypcji.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input
            autoComplete="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Hasło</label>
          <Input
            autoComplete="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="min. 8 znaków"
            required
            minLength={8}
          />
        </div>

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Tworzenie konta…" : "Zarejestruj się"}
        </Button>

        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Masz już konto?{" "}
          <Link href={loginHref} className="font-medium underline">
            Zaloguj się
          </Link>
        </p>
      </form>
    </Card>
  );
}
