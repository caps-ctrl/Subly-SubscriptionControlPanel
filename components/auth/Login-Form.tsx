"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/Input";
import { normalizeRedirectPath } from "@/lib/auth/normalizeRedirectPath";
import { cn } from "@/lib/utils";

const ERROR_MESSAGES: Record<string, string> = {
  EMAIL_NOT_VERIFIED:
    "Potwierdź adres email przed zalogowaniem. Możesz wysłać link ponownie poniżej.",
  INVALID_CREDENTIALS: "Nieprawidłowy email lub hasło.",
  INVALID_INPUT: "Uzupełnij poprawnie formularz logowania.",
  LOGIN_FAILED: "Nie udało się zalogować. Spróbuj ponownie.",
  VERIFICATION_EMAIL_FAILED:
    "Nie udało się wysłać nowego linku weryfikacyjnego. Spróbuj ponownie.",
};

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const params = useSearchParams();
  const next = useMemo(
    () => normalizeRedirectPath(params.get("next"), "/dashboard"),
    [params],
  );
  const registerHref =
    next === "/dashboard"
      ? "/register"
      : `/register?next=${encodeURIComponent(next)}`;
  const emailFromParams = params.get("email") ?? "";
  const queryInfo = useMemo(() => {
    if (params.get("verified") === "1") {
      return "Email został potwierdzony. Możesz się teraz zalogować.";
    }

    if (params.get("verify_sent") === "1") {
      return "Wysłaliśmy link weryfikacyjny na Twój adres email.";
    }

    if (params.get("verification") === "invalid") {
      return "Link weryfikacyjny jest nieprawidłowy albo wygasł. Wyślij nowy link poniżej.";
    }

    if (params.get("google") === "missing_refresh_token") {
      return "Google zalogował konto, ale nie zwrócił nowego refresh tokena do Gmaila. Po zalogowaniu połącz Gmail ponownie.";
    }

    if (params.get("google") === "error") {
      return "Logowanie przez Google nie powiodło się. Spróbuj ponownie.";
    }

    return null;
  }, [params]);

  const [email, setEmail] = useState(emailFromParams);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(queryInfo);

  useEffect(() => {
    setEmail(emailFromParams);
  }, [emailFromParams]);

  useEffect(() => {
    setInfo(queryInfo);
  }, [queryInfo]);

  function getErrorMessage(code?: string) {
    if (!code) return ERROR_MESSAGES.LOGIN_FAILED;
    return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.LOGIN_FAILED;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setError(getErrorMessage(data?.error));
        return;
      }

      router.push(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function onResendVerification() {
    setError(null);
    setInfo(null);

    if (!email.trim()) {
      setError("Wpisz email, na który mamy wysłać link weryfikacyjny.");
      return;
    }

    setResendLoading(true);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setError(getErrorMessage(data?.error));
        return;
      }

      setInfo(
        "Jeśli konto istnieje i nie jest jeszcze potwierdzone, wysłaliśmy nowy link weryfikacyjny.",
      );
    } finally {
      setResendLoading(false);
    }
  }

  function onGoogleLogin() {
    window.location.assign(
      `/api/auth/google/connect?next=${encodeURIComponent(next)}`,
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center font-bold">
            <Image
              src="/logo.png"
              alt="Logo"
              width={30}
              height={30}
              className="mr-2"
            />
            <CardTitle className="text-xl">Welcome back</CardTitle>
          </div>
          <CardDescription>Zaloguj się, aby przejść do dashboardu.</CardDescription>
        </CardHeader>
        <CardContent>
          {info ? (
            <p className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
              {info}
            </p>
          ) : null}

          <form onSubmit={onSubmit}>
            <FieldGroup>
              <Field>
                <Button className="" variant="outline" type="button" disabled>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={25}
                    height={25}
                    viewBox="0 0 24 24"
                    className="mr-2"
                  >
                    <path
                      d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                      fill="currentColor"
                    />
                  </svg>
                  Login with Apple
                </Button>
                <Button variant="outline" type="button" onClick={onGoogleLogin}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={25}
                    height={25}
                    viewBox="0 0 24 24"
                    className="mr-2"
                  >
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Login with Google
                </Button>
                <FieldDescription className="text-center">
                  Apple jeszcze nie jest dostępne. Google jest już aktywne.
                </FieldDescription>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="m@example.com"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <span className="ml-auto text-sm text-zinc-500 dark:text-zinc-400">
                    Wprowadź swoje hasło
                  </span>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </Field>
              <FieldError>{error}</FieldError>
              <Field>
                <Button type="submit" disabled={loading}>
                  {loading ? "Logowanie..." : "Login"}
                </Button>
                {error === ERROR_MESSAGES.EMAIL_NOT_VERIFIED ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={resendLoading}
                    onClick={onResendVerification}
                  >
                    {resendLoading
                      ? "Wysyłanie linku..."
                      : "Wyślij link weryfikacyjny ponownie"}
                  </Button>
                ) : null}
                <FieldDescription className="text-center">
                  Don&apos;t have an account?{" "}
                  <Link href={registerHref}>Sign up</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our Terms of Service and Privacy
        Policy.
      </FieldDescription>
    </div>
  );
}
