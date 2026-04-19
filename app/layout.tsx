import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import LoadingScreen from "@/components/LoadingScreen";
import { AuthSessionSync } from "@/components/auth/AuthSessionSync";
import { Suspense } from "react";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Subscription Manager",
  description:
    "Zarządzaj subskrypcjami, wydatkami i anulowaniami w jednym miejscu.",
};

function normalizeTheme(value: string | undefined) {
  if (value === "light" || value === "dark") return value;
  return "system" as const;
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const mode = normalizeTheme(cookieStore.get("theme")?.value);
  const htmlClass = mode === "dark" ? "dark" : undefined;

  return (
    <html
      lang="pl"
      className={mode == "dark" ? "dark" : undefined}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function () {
  try {
    var match = document.cookie.match(/theme=(light|dark)/);
    var mode = match ? match[1] : 'system';

    var prefersDark = window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    var isDark = (mode === 'dark') || (mode === 'system' && prefersDark);

    document.documentElement.classList.toggle('dark', !!isDark);
    document.documentElement.dataset.theme = mode;
  } catch (e) {}
})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${htmlClass} overflow-x-hidden antialiased dark:bg-black`}
      >
        <Suspense fallback={<LoadingScreen />}>
          <AuthSessionSync />
          {children}
        </Suspense>
      </body>
    </html>
  );
}
