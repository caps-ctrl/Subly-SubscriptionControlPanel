import Link from "next/link";

import DashboardNav from "@/components/dashboard/DashboardNav";

import { getServerUser } from "@/lib/auth/getServerUser";

function initialsFromEmail(email: string) {
  const local = email.split("@")[0] ?? "";
  const cleaned = local.replace(/[^a-zA-Z0-9]/g, "");
  const two = cleaned.slice(0, 2).toUpperCase();
  return two.length > 0 ? two : "U";
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();
  const initials = user?.email ? initialsFromEmail(user.email) : "U";

  return (
    <div className="relative bg-zinc-100 min-h-screen overflow-scroll font-sans text-zinc-950 dark:bg-black dark:text-zinc-50">
      <div>
        <div className="fixed top-0 left-0 ">
          <aside className="min-h-screen   max-w-50 border-r border-zinc-200 flex flex-col justify-between bg-zinc-200  shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:self-start">
            <div>
              <div className="flex items-center justify-center     p-5 ">
                {" "}
                <img src="/logo.png" alt="Logo" className="h-10 w-10" />
                <h1 className="text-2xl mr-10 font-bold">ubly</h1>
              </div>
              <DashboardNav />
            </div>

            <div className="mt-4 ">
              <Link
                href="/settings"
                className="inline-flex my-4 h-9 w-full rounded-r-xl items-center    px-3 text-sm font-semibold text-zinc-950   hover:bg-zinc-50  dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
              >
                Ustawienia
              </Link>
              <Link
                href="/profile"
                className="flex  items-center gap-3 rounded-xl px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <div className="grid size-9 place-items-center rounded-xl bg-zinc-950 text-sm font-semibold text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950">
                  {initials}
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold">
                    Konto:{user?.email}
                  </div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">
                    {user ? `Plan: ${user.plan}` : "—"}
                  </div>
                </div>
              </Link>
            </div>
          </aside>
        </div>

        <main className="ml-50  overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
