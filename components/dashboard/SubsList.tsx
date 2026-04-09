"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SubCard from "@/components/dashboard/SubCard";
import { Input } from "@/components/ui/Input";
import { ApiSubscription } from "./types";

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
        <div className="fixed inset-0  z-20 bg-black/40 flex items-center justify-center">
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl w-[400px] space-y-4">
            <h2 className="text-lg font-bold">Edit subscription</h2>

            <input
              value={editing.providerName}
              onChange={(e) =>
                setEditing({ ...editing, providerName: e.target.value })
              }
              className="w-full border p-2 rounded"
            />

            <input
              type="number"
              value={editing.amountCents / 100}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  amountCents: Number(e.target.value) * 100,
                })
              }
              className="w-full border p-2 rounded"
            />

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
              className="w-full border p-2 rounded"
              aria-label="Następna płatność"
            />

            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)}>Cancel</button>

              <button
                onClick={handleSave}
                className="bg-black text-white px-4 py-2 rounded"
              >
                Save
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
          className="fixed inset-0 z-20 bg-black/40 flex items-center justify-center"
        >
          <div className="bg-white dark:bg-black z-21 flex flex-col  space-y-4 min-w-[30vw] p-6 rounded-2xl ">
            <h3 className="font-semibold">Dodaj subskrypcję</h3>

            <input
              placeholder="Nazwa (np. Netflix)"
              value={newSub.providerName}
              onChange={(e) =>
                setNewSub({ ...newSub, providerName: e.target.value })
              }
              className="w-full border  p-2 rounded"
            />

            <input
              type="number"
              placeholder="Kwota (PLN)"
              value={newSub.amountCents}
              onChange={(e) =>
                setNewSub({ ...newSub, amountCents: Number(e.target.value) })
              }
              className="w-full border p-2 rounded"
            />

            <input
              type="date"
              value={newSub.nextBillingDate}
              onChange={(e) =>
                setNewSub({ ...newSub, nextBillingDate: e.target.value })
              }
              className="w-full border p-2 rounded"
            />

            <button
              onClick={handleAdd}
              className="w-full bg-black dark:border rounded-2xl text-white py-2 rounded"
            >
              Dodaj
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
