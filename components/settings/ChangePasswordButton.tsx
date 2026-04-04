"use client";

import { Shield } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

const ERROR_MESSAGES: Record<string, string> = {
  CHANGE_PASSWORD_FAILED: "Nie udało się zmienić hasła. Spróbuj ponownie.",
  INVALID_CURRENT_PASSWORD: "Obecne hasło jest nieprawidłowe.",
  INVALID_INPUT: "Sprawdź formularz i spróbuj ponownie.",
  PASSWORD_UNCHANGED: "Nowe hasło musi różnić się od obecnego.",
  UNAUTHORIZED: "Sesja wygasła. Zaloguj się ponownie.",
};

function getErrorMessage(error?: string) {
  if (!error) {
    return ERROR_MESSAGES.CHANGE_PASSWORD_FAILED;
  }

  return ERROR_MESSAGES[error] ?? ERROR_MESSAGES.CHANGE_PASSWORD_FAILED;
}

export function ChangePasswordButton() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function resetForm() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  }

  function openModal() {
    setSuccess(null);
    setError(null);
    setOpen(true);
  }

  function closeModal() {
    if (loading) return;

    resetForm();
    setOpen(false);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 8) {
      setError("Nowe hasło musi mieć co najmniej 8 znaków.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Nowe hasła nie są takie same.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("Nowe hasło musi różnić się od obecnego.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setError(getErrorMessage(data?.error));
        return;
      }

      resetForm();
      setOpen(false);
      setSuccess("Hasło zostało zmienione.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="grid gap-2">
        <Button
          type="button"
          variant="secondary"
          className="justify-start gap-2"
          onClick={openModal}
        >
          <Shield className="w-4 h-4" />
          Zmień hasło
        </Button>

        {success ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
            {success}
          </p>
        ) : null}
      </div>

      {open ? (
        <Modal title="Zmień hasło" onClose={closeModal}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Obecne hasło</label>
              <Input
                autoComplete="current-password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Obecne hasło"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nowe hasło</label>
              <Input
                autoComplete="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Minimum 8 znaków"
                minLength={8}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Powtórz nowe hasło</label>
              <Input
                autoComplete="new-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Powtórz nowe hasło"
                minLength={8}
                required
              />
            </div>

            {error ? (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
                {error}
              </p>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={closeModal}
                disabled={loading}
              >
                Anuluj
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Zapisywanie…" : "Zapisz nowe hasło"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  );
}
