"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SubCard from "@/components/dashboard/SubCard";
import { Input } from "@/components/ui/Input";
import { ApiSubscription } from "./types";
import Image from "next/image";
export default function SubsList({
  formattedSubs,
}: {
  formattedSubs: ApiSubscription[];
}) {
  const router = useRouter();
  const [subs, setSubs] = useState(formattedSubs);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ApiSubscription | null>(null);
  const [creating, setCreating] = useState(false);
  const [newSub, setNewSub] = useState({
    providerName: "",
    amountCents: 0,
    nextBillingDate: "",
  });

  useEffect(() => {
    setSubs(formattedSubs);
  }, [formattedSubs]);

  // 🔍 filter
  const filteredSubs = subs.filter((s) =>
    s.providerName.toLowerCase().includes(search.toLowerCase()),
  );

  //ADD
  const handleAdd = async () => {
    if (!newSub.providerName || !newSub.amountCents) return;

    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerName: newSub.providerName,
          amountCents: Number(newSub.amountCents) * 100,
          currency: "PLN",
          billingInterval: "MONTHLY",
          nextBillingDate: newSub.nextBillingDate || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        alert(err?.error ?? "Błąd dodawania");
        return;
      }

      const data = await res.json();

      // ✅ optimistic update
      setSubs((prev) => [data.subscription, ...prev]);

      // reset form
      setNewSub({
        providerName: "",
        amountCents: 0,
        nextBillingDate: "",
      });

      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Błąd sieci");
    }
  };

  // 🗑 DELETE
  const handleDelete = async (id: string) => {
    const subscriptionToRestore = subs.find((s) => s.id === id);
    if (!subscriptionToRestore) return;

    const restoreIndex = subs.findIndex((s) => s.id === id);

    // ✅ optimistic update: remove from UI immediately
    setSubs((prev) => prev.filter((s) => s.id !== id));
    if (editing?.id === id) setEditing(null);

    try {
      const res = await fetch(`/api/subscriptions/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Delete failed");
      }

      router.refresh();
    } catch (err) {
      console.error(err);

      // rollback on failure
      setSubs((prev) => {
        if (prev.some((s) => s.id === id)) return prev;
        const next = [...prev];
        const index = Math.min(Math.max(restoreIndex, 0), next.length);
        next.splice(index, 0, subscriptionToRestore);
        return next;
      });

      alert("Failed to delete subscription");
    }
  };

  // 💾 SAVE EDIT
  const handleSave = async () => {
    if (!editing) return;

    const res = await fetch(`/api/subscriptions/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerName: editing.providerName,
        amountCents: editing.amountCents,
        nextBillingDate: editing.nextBillingDate
          ? editing.nextBillingDate.slice(0, 10)
          : null,
      }),
    });

    if (!res.ok) {
      alert("Nie udało się zapisać zmian");
      return;
    }

    const updated = await res.json();

    setSubs((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));

    setEditing(null);
    router.refresh();
  };

  return (
    <div>
      {/* SEARCH */}
      <Input
        type="text"
        placeholder="Subskrypcje..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4"
      />

      {/* LIST */}
      <div className="space-y-3 ">
        {filteredSubs.map((s) => (
          <SubCard
            key={s.id}
            sub={s}
            onDelete={handleDelete}
            onEdit={(s) => setEditing(s)}
          />
        ))}
      </div>
      <div
        onClick={() => setCreating(true)}
        className="cursor-pointer mt-3 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 p-6 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
      >
        <span className="text-zinc-500 flex items-center gap-2 text-sm font-medium">
          <span className="text-xl">＋</span>
          Dodaj subskrypcję
        </span>
      </div>

      {/* 🔥 EDIT MODAL */}
      {editing && (
        <div
          onClick={(e) => {
            if (e.currentTarget === e.target) {
              setEditing(null);
            }
          }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4"
        >
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in-95">
            {/* HEADER */}
            <div className="flex flex-col items-center gap-2">
              <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
                Edytuj subskrypcję
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Zaktualizuj dane subskrypcji
              </p>
            </div>

            {/* INPUTY */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Nazwa
                </label>
                <input
                  value={editing.providerName}
                  onChange={(e) =>
                    setEditing({ ...editing, providerName: e.target.value })
                  }
                  className="w-full mt-1 border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Cena (PLN)
                </label>
                <input
                  type="number"
                  value={editing.amountCents / 100}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      amountCents: Number(e.target.value) * 100,
                    })
                  }
                  className="w-full mt-1 border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Następna płatność
                </label>
                <input
                  type="date"
                  value={
                    editing.nextBillingDate
                      ? editing.nextBillingDate.slice(0, 10)
                      : ""
                  }
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      nextBillingDate: e.target.value
                        ? `${e.target.value}T00:00:00.000Z`
                        : null,
                    })
                  }
                  className="w-full mt-1 border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* BUTTONY */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                Anuluj
              </button>

              <button
                onClick={handleSave}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md transition"
              >
                Zapisz
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ➕ ADD NEW SUB */}
      {creating && (
        <div
          onClick={(e) => {
            if (e.currentTarget === e.target) {
              setCreating(false);
            }
          }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4"
        >
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in-95">
            {/* HEADER */}
            <div className="flex flex-col items-center gap-2">
              <Image src="/logo.png" alt="Logo" width={48} height={48} />
              <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
                Dodaj subskrypcję
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Wprowadź dane swojej subskrypcji
              </p>
            </div>

            {/* INPUTY */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Nazwa
                </label>
                <input
                  placeholder="Netflix"
                  value={newSub.providerName}
                  onChange={(e) =>
                    setNewSub({ ...newSub, providerName: e.target.value })
                  }
                  className="w-full mt-1 border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Cena (PLN)
                </label>
                <input
                  type="number"
                  placeholder="29.99"
                  value={newSub.amountCents}
                  onChange={(e) =>
                    setNewSub({
                      ...newSub,
                      amountCents: Number(e.target.value),
                    })
                  }
                  className="w-full mt-1 border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Następna płatność
                </label>
                <input
                  type="date"
                  value={newSub.nextBillingDate}
                  onChange={(e) =>
                    setNewSub({ ...newSub, nextBillingDate: e.target.value })
                  }
                  className="w-full mt-1 border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* BUTTONY */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setCreating(false)}
                className="px-4 py-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                Anuluj
              </button>

              <button
                onClick={handleAdd}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md transition"
              >
                Dodaj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
