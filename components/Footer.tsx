"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-indigo-700 border-2 p-10  dark:border-zinc-800 bg-white dark:bg-black text-zinc-600 dark:text-zinc-400">
      <div className="flex justify-evenly w-screen">
        {/* LOGO + DESC */}
        <div className="flex flex-col  justify-center items-center">
          <img src="logo.png" alt="Subly Logo" className="h-20 w-20" />
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
            Subly
          </h3>
          <p className="text-sm">
            Kontroluj swoje subskrypcje, oszczędzaj pieniądze i miej wszystko w
            jednym miejscu.
          </p>
        </div>

        {/* PRODUKT */}
        <div>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">
            Produkt
          </h4>
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="#">Funkcje</Link>
            </li>
            <li>
              <Link href="#">Pricing</Link>
            </li>
            <li>
              <Link href="#">Bezpieczeństwo</Link>
            </li>
          </ul>
        </div>

        {/* FIRMA */}
        <div>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">
            Firma
          </h4>
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="#">O nas</Link>
            </li>
            <li>
              <Link href="#">Kontakt</Link>
            </li>
          </ul>
        </div>

        {/* LEGAL */}
        <div>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">
            Legal
          </h4>
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="#">Polityka prywatności</Link>
            </li>
            <li>
              <Link href="#">Regulamin</Link>
            </li>
          </ul>
        </div>
      </div>

      {/* BOTTOM */}
    </footer>
  );
}
