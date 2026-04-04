"use client";

import { errors } from "jose";
import { useState } from "react";

type BillingInterval =
  | "WEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "YEARLY"
  | "UNKNOWN";

export default function AddSubscriptionForm() {
  const [form, setForm] = useState({
    providerName: "",
    amountCents: "",
    currency: "USD",
    billingInterval: "MONTHLY" as BillingInterval,
    nextBillingDate: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          providerName: form.providerName,
          amountCents: Math.round(Number(form.amountCents) * 100),
          currency: form.currency,
          billingInterval: form.billingInterval,
          nextBillingDate: form.nextBillingDate || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Coś poszło nie tak");
      }

      setMessage("✅ Subskrypcja dodana!");
      setForm({
        providerName: "",
        amountCents: "",
        currency: "USD",
        billingInterval: "MONTHLY",
        nextBillingDate: "",
      });
    } catch (err: unknown) {
      setMessage(`❌ ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md space-y-4 p-4 border rounded-xl shadow"
    >
      <h2 className="text-xl font-semibold">Dodaj subskrypcję</h2>

      <input
        type="text"
        name="providerName"
        placeholder="Np. Netflix"
        value={form.providerName}
        onChange={handleChange}
        required
        className="w-full p-2 border rounded"
      />

      <input
        type="number"
        step="0.01"
        name="amountCents"
        placeholder="Kwota (np. 29.99)"
        value={form.amountCents}
        onChange={handleChange}
        required
        className="w-full p-2 border rounded"
      />

      <input
        type="text"
        name="currency"
        placeholder="Waluta (USD)"
        value={form.currency}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      />

      <select
        name="billingInterval"
        value={form.billingInterval}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      >
        <option value="WEEKLY">Tygodniowo</option>
        <option value="MONTHLY">Miesięcznie</option>
        <option value="QUARTERLY">Kwartalnie</option>
        <option value="YEARLY">Rocznie</option>
        <option value="UNKNOWN">Nieznane</option>
      </select>

      <input
        type="date"
        name="nextBillingDate"
        value={form.nextBillingDate}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full p-2 bg-black text-white rounded hover:opacity-90"
      >
        {loading ? "Dodawanie..." : "Dodaj"}
      </button>

      {message && <p className="text-sm">{message}</p>}
    </form>
  );
}
