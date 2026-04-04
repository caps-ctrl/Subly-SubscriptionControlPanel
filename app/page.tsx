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
      {/* HERO */}
      <section id="Hero" className="relative  ">
        <div className="relative min-h-screen     text-zinc-900 dark:text-zinc-50 ">
          {/* Background image */}

          <SiteHeader user={user ? { email: user.email } : null} />

          <div className="absolute top-1/2 -right-100   z-10  rounded-2xl -translate-y-1/2    w-[828px] h-[500px] ">
            <Image
              src="/heroNew.png"
              alt="Hero"
              layout="fill"
              className="z-10 rounded-2xl object-contain"
            />
          </div>
          <div className="absolute top-1/2 -right-40  z-1 -translate-y-1/2 object-cover rounded-2xl  w-[50%] h-[70%] ">
            <div className="absolute top-1/2 right-1/2  w-[500px] h-[500px] bg-indigo-700 rounded-full blur-[150px] opacity-70" />
            {/* Glow 2 */}{" "}
            <div className="absolute top-0 right-1/2  w-[400px] h-[400px] bg-cyan-400 rounded-full blur-[120px] opacity-50 " />
            {/* Glow 3 */}
            <div className="absolute top-2/3 right-0  w-[300px] h-[300px] bg-violet-400 rounded-full blur-[100px] " />
          </div>

          {/* CONTENT */}
          <div className="relative z-10 mx-auto max-w-6xl px-6 ">
            <div className="mt-16 grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <h1 className="text-balance text-8xl font-bold leading-tight tracking-tight sm:text-5xl text-black dark:text-white drop-shadow-lg">
                  Ogarnij subskrypcje. Zobacz wydatki. Anuluj szybciej.
                </h1>

                <p className="mt-5 max-w-xl text-pretty text-lg text-zinc-700 dark:text-zinc-200 drop-shadow-sm">
                  Aplikacja analizuje Twoje maile z Gmaila, wykrywa subskrypcje
                  i pomaga kontrolować koszty. Jedno miejsce do listy usług, dat
                  płatności i instrukcji rezygnacji.
                </p>

                <div className="flex flex-col p-5 gap-3 sm:flex-row">
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
                      <Button variant="secondary" className="w-full sm:w-auto">
                        Mój profil
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/login">
                      <Button variant="cta1" className="w-full ">
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
      <section>
        {" "}
        <ProblemS />
      </section>
      <section>
        <Pricing />
      </section>
      <Footer />
    </>
  );
}
