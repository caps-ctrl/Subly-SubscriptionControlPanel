"use client";

import Image from "next/image";
import { useRef } from "react";
import {
  FaBell,
  FaChartLine,
  FaDollarSign,
  FaLayerGroup,
  FaList,
  FaSlidersH,
} from "react-icons/fa";
import { motion, useInView } from "framer-motion";

import CardProblem from "../ui/CardProblem";

const problemCards = [
  {
    title: "Przestań gubić pieniądze w subskrypcjach.",
    description:
      "Zobacz wszystkie swoje abonamenty w jednym miejscu i kontroluj miesięczne wydatki bez ręcznego liczenia.",
    icon: <FaDollarSign size={30} className="text-emerald-500" />,
  },
  {
    title: "Koniec z zapominaniem o odnowieniach.",
    description:
      "Subly przypomina o zbliżających się płatnościach, zanim subskrypcja odnowi się automatycznie.",
    icon: <FaBell size={30} className="text-amber-500" />,
  },
  {
    title: "Wiesz dokładnie, za co płacisz.",
    description:
      "Przejrzysta lista usług i kosztów pomaga szybko wyłapać niepotrzebne albo zdublowane opłaty.",
    icon: <FaList size={30} className="text-sky-500" />,
  },
  {
    title: "Mniej chaosu. Więcej kontroli.",
    description:
      "Uporządkuj subskrypcje i zarządzaj nimi z jednego prostego panelu zamiast przeklikiwać się przez maile i konta.",
    icon: <FaSlidersH size={30} className="text-fuchsia-500" />,
  },
  {
    title: "Subskrypcje pod kontrolą.",
    description:
      "Śledź swoje wydatki i miej pewność, że żadna opłata nie zaskoczy Cię w najmniej odpowiednim momencie.",
    icon: <FaChartLine size={30} className="text-rose-500" />,
  },
  {
    title: "Twoje subskrypcje. Jedno miejsce.",
    description:
      "Netflix, Spotify, AI tools i inne usługi trafiają do jednego dashboardu, który naprawdę da się ogarnąć.",
    icon: <FaLayerGroup size={30} className="text-indigo-500" />,
  },
] as const;

const insightPills = [
  "Jeden panel zamiast pięciu aplikacji",
  "Lepszy wgląd w miesięczne koszty",
  "Szybsze decyzje o anulowaniu",
] as const;

export default function ProblemS() {
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="problem">
      <div className="pointer-events-none   absolute inset-x-0 top-0 -z-10 h-full " />

      <div className="mx-auto max-w-7xl px-6" ref={ref}>
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center rounded-full border border-zinc-200/70 bg-white/75 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-zinc-600 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-300">
            Problem, który znasz
          </div>

          <h2 className="mt-6 text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Subskrypcje łatwo się mnożą. Kontrola zwykle nie nadąża.
          </h2>

          <p className="mt-5 text-pretty text-base leading-7 text-zinc-600 dark:text-zinc-300 sm:text-lg">
            Subly porządkuje chaos wokół abonamentów, opłat i odnowień. Zamiast
            szukać wszystkiego po skrzynce mailowej, dostajesz jeden czytelny
            widok i szybsze decyzje.
          </p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {problemCards.slice(0, 2).map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.1 + index * 0.08 }}
            >
              <CardProblem
                title={card.title}
                description={card.description}
                icon={card.icon}
              />
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.28 }}
            className="relative overflow-hidden rounded-[32px] border border-zinc-200/70 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.16),_transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.9),rgba(244,244,245,0.78))] p-6 shadow-xl shadow-zinc-950/5 backdrop-blur dark:border-zinc-800 dark:bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_42%),linear-gradient(180deg,rgba(9,9,11,0.92),rgba(24,24,27,0.84))] xl:row-span-2"
          >
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-indigo-500/15 blur-3xl dark:bg-cyan-400/15" />

            <div className="relative flex h-full flex-col">
              <div className="inline-flex w-fit items-center rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-300">
                Jedno miejsce
              </div>

              <div className="mt-6 flex items-center gap-4">
                <div className="rounded-3xl border border-zinc-200/70 bg-white/85 p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80">
                  <Image
                    src="/logo.png"
                    alt="Subly"
                    width={48}
                    height={48}
                    className="h-12 w-12"
                  />
                </div>
                <div>
                  <div className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    Subly
                  </div>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                    Mniej szukania. Więcej jasności.
                  </p>
                </div>
              </div>

              <p className="mt-6 text-sm leading-7 text-zinc-600 dark:text-zinc-300 sm:text-base">
                Zbierasz wydatki, terminy i usługi w jednym widoku, więc łatwiej
                zobaczyć, co naprawdę daje wartość, a co tylko regularnie
                pobiera pieniądze.
              </p>

              <div className="mt-8 grid gap-3">
                {insightPills.map((pill) => (
                  <div
                    key={pill}
                    className="rounded-2xl border border-zinc-200/70 bg-white/80 px-4 py-3 text-sm font-medium text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/75 dark:text-zinc-200"
                  >
                    {pill}
                  </div>
                ))}
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-zinc-200/70 bg-white/80 px-4 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/75">
                  <div className="text-2xl font-semibold">100%</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                    Widoczności
                  </div>
                </div>
                <div className="rounded-2xl border border-zinc-200/70 bg-white/80 px-4 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/75">
                  <div className="text-2xl font-semibold">0</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                    Chaosu w mailach
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {problemCards.slice(2).map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: 1 + index * 0.08 }}
            >
              <CardProblem
                title={card.title}
                description={card.description}
                icon={card.icon}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
