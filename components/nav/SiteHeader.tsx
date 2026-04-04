import Link from "next/link";

import { Button } from "@/components/ui/Button";

export function SiteHeader({ user }: { user: { email: string } | null }) {
  return (
    <header className="flex items-center  justify-between mx-auto max-w-6xl px-2 py-10">
      <div className="flex flex-col items-center font-bold">
        <img src="/logo.png" alt="Logo" className="h-10 w-10" />
        <h4 className="text-2xl">Subly</h4>
      </div>
      <div className="flex   gap-3">
        {user ? (
          <Link href="/profile">
            <Button variant="secondary">{user.email}</Button>
          </Link>
        ) : (
          <>
            <Link href="/login" className="cursor-pointer">
              <Button variant="ghost">Logowanie</Button>
            </Link>
            <Link href="/register" className="cursor-pointer">
              <Button variant="cta" className="">
                Rejestracja
              </Button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
