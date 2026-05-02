import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

import { SiteHeader } from "@/components/nav/SiteHeader";
import { getServerUser } from "@/lib/auth/getServerUser";
import ProblemS from "@/components/home/ProblemS";
import Pricing from "@/components/home/Pricing";
import Footer from "@/components/Footer";

export default async function HomePage() {
  const user = await getServerUser();

  return (
    <>
      <div className="relative isolate bg-white dark:bg-black">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_12%,_rgba(99,102,241,0.18),_transparent_28%),radial-gradient(circle_at_14%_38%,_rgba(99,102,241,0.14),_transparent_24%),radial-gradient(circle_at_18%_70%,_rgba(99,102,241,0.1),_transparent_18%),radial-gradient(circle_at_88%_36%,_rgba(34,211,238,0.14),_transparent_24%),radial-gradient(circle_at_82%_74%,_rgba(34,211,238,0.1),_transparent_20%)] dark:bg-[radial-gradient(circle_at_12%_12%,_rgba(99,102,241,0.28),_transparent_28%),radial-gradient(circle_at_14%_38%,_rgba(99,102,241,0.22),_transparent_24%),radial-gradient(circle_at_18%_70%,_rgba(99,102,241,0.16),_transparent_18%),radial-gradient(circle_at_88%_36%,_rgba(34,211,238,0.18),_transparent_24%),radial-gradient(circle_at_82%_74%,_rgba(34,211,238,0.14),_transparent_20%)]"
        />

        {/* HERO */}
        <Image
          src="/logo.png"
          alt="Subly"
          width={48}
          height={48}
          className="fixed top-1/2 bottom-1/2 z-50 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-zinc-200/70 bg-white/85 p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80"
        />
        <section id="Hero" className="relative overflow-visible isolate">
          <div className="relative min-h-screen text-zinc-900 dark:text-zinc-50">
            <SiteHeader user={user ? { email: user.email } : null} />

            <div className="absolute top-1/2 -right-100 z-10 h-[500px] w-[828px] -translate-y-1/2 rounded-2xl">
              <Image
                src="/heroNew.png"
                alt="Hero"
                layout="fill"
                className="z-10 hidden rounded-2xl object-contain lg:inline"
              />
            </div>
            <div className="absolute top-1/2 -right-40 z-1 h-[70%] w-[50%] -translate-y-1/2 rounded-2xl object-cover">
              <div className="absolute top-1/2 right-1/2 h-[500px] w-[500px] rounded-full bg-indigo-700 opacity-70 blur-[150px]" />
              {/* Glow 2 */}{" "}
              <div className="absolute top-0 right-1/2 h-[400px] w-[400px] rounded-full bg-cyan-400 opacity-50 blur-[120px]" />
              {/* Glow 3 */}
              <div className="absolute top-2/3 right-0 h-[300px] w-[300px] rounded-full bg-violet-400 blur-[100px]" />
            </div>

            {/* CONTENT */}
            <div className="relative z-10 mx-auto max-w-6xl px-6">
              <div className="mt-16 grid gap-10 lg:grid-cols-2 lg:items-center">
                <div>
                  <h1 className="text-balance text-2xl font-bold leading-tight tracking-tight text-black drop-shadow-lg dark:text-white sm:text-5xl">
                    Ogarnij subskrypcje. Zobacz wydatki. Anuluj szybciej.
                  </h1>

                  <p className="mt-5 max-w-xl text-pretty text-lg text-zinc-700 drop-shadow-sm dark:text-zinc-200">
                    Aplikacja analizuje Twoje maile z Gmaila, wykrywa
                    subskrypcje i pomaga kontrolować koszty. Jedno miejsce do
                    listy usług, dat płatności i instrukcji rezygnacji.
                  </p>

                  <div className="flex flex-col gap-3 p-5 sm:flex-row">
                    {user ? (
                      <Link href="/dashboard">
                        <Button className="w-full sm:w-auto">
                          Przejdź do dashboardu
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/register">
                        <Button variant="cta" className="w-full sm:w-auto">
                          Zacznij za darmo
                        </Button>
                      </Link>
                    )}

                    {user ? (
                      <Link href="/profile">
                        <Button
                          variant="secondary"
                          className="w-full sm:w-auto"
                        >
                          Mój profil
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/login">
                        <Button variant="cta1" className="w-full">
                          Mam już konto
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PROBLEM */}
        <div className="relative py-20 text-zinc-900 dark:text-zinc-50 sm:py-24">
          <ProblemS />
        </div>

        <div className="relative">
          <Pricing user={user ? { plan: user.plan } : null} />
        </div>
      </div>
      <Footer />
    </>
  );
}
