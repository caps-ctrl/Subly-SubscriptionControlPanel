"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/subscriptions", label: "Subskrypcje" },
  { href: "/settings", label: "Ustawienia" },
  { href: "/premium", label: "Get Premium" },
] as const;

export default function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="grid gap-1">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "rounded-2xl px-3 py-2 text-sm font-semibold transition-colors",
              active
                ? "bg-zinc-950 text-zinc-50 dark:bg-white dark:text-zinc-950"
                : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

