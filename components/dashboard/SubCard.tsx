"use client";

import React, { useEffect } from "react";
import { useState } from "react";
import Image from "next/image";
import { providerIcons } from "@/lib/subscriptions/providerIcons";
import type { ApiSubscription } from "@/components/dashboard/types";
import { set } from "date-fns";

type Props = {
  sub: ApiSubscription;

  onEdit?: (sub: ApiSubscription) => void;
  onDelete?: (id: string) => void;
};

const SubCard = ({ sub, onDelete, onEdit }: Props) => {
  const handleDelete = () => {
    if (!confirm("Na pewno usunąć subskrypcję?")) return;
    onDelete?.(sub.id);
  };

  const price = (sub.amountCents / 100).toFixed(2);

  return (
    <div
      className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 
      p-4 shadow-sm rounded-xl flex justify-between items-center hover:shadow-md transition"
    >
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <Image
          src={
            providerIcons[sub.providerName.toLowerCase()] ??
            "/logos/default.svg"
          }
          alt={sub.providerName}
          width={50}
          height={50}
          className="rounded-xl"
        />

        <div>
          <h3 className="text-lg font-semibold text-black dark:text-white">
            {sub.providerName}
          </h3>

          <p className="text-sm text-zinc-500">Next billing: </p>
          {sub.nextBillingDate
            ? new Date(sub.nextBillingDate).toLocaleDateString("pl-PL")
            : "—"}
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <h4 className="font-semibold text-black dark:text-white">
            {price} {sub.currency}
          </h4>
          <p className="text-xs text-zinc-500">{sub.billingInterval}</p>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit?.(sub)}
            className="px-3 py-1 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200"
          >
            Edit
          </button>

          <button
            onClick={handleDelete}
            className="px-3 py-1 text-sm rounded-lg bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubCard;
