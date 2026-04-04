"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

function NavItem({ href, label, icon }: Item) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "group flex items-center gap-3 rounded-r-xl px-3 py-1 text-sm font-medium transition-colors",
        active
          ? "bg-zinc-300 text-black dark:bg-zinc-50 dark:text-zinc-950"
          : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50",
      ].join(" ")}
    >
      <span
        className={[
          "grid size-8 place-items-center rounded-lg border transition-colors",
          active
            ? "border-zinc-950/10 bg-white/10 text-black dark:border-zinc-950/10 dark:bg-black/10 dark:text-zinc-950"
            : "border-zinc-200 bg-white text-zinc-600 group-hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:group-hover:text-zinc-50",
        ].join(" ")}
      >
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

export default function DashboardNav() {
  const items: Item[] = [
    {
      href: "/dashboard",
      label: "Start",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 10v10h14V10" />
        </svg>
      ),
    },
    {
      href: "/dashboard/subscriptions",
      label: "Subskrypcje",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M8 12a4 4 0 0 1 4-4h6" />
          <path d="M16 12a4 4 0 0 1-4 4H6" />
          <path d="M18 8h3v3" />
          <path d="M6 16H3v-3" />
        </svg>
      ),
    },

    {
      href: "/dashboard/settings",
      label: "Ustawienia",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
          <path d="M19.4 15a7.8 7.8 0 0 0 .1-2l2-1.2-2-3.5-2.3.7a7.9 7.9 0 0 0-1.7-1L15 4h-4l-.5 3a7.9 7.9 0 0 0-1.7 1l-2.3-.7-2 3.5 2 1.2a7.8 7.8 0 0 0 .1 2l-2 1.2 2 3.5 2.3-.7a7.9 7.9 0 0 0 1.7 1l.5 3h4l.5-3a7.9 7.9 0 0 0 1.7-1l2.3.7 2-3.5-2-1.2Z" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="grid gap-1">
      {items.map((item) => (
        <NavItem key={item.href} {...item} />
      ))}
    </nav>
  );
}
