"use client";
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

const ProblemS = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section
      id="problem"
      className="relative z-20 py-10 w-screen bg-transparent min-h-screen text-zinc-900 dark:text-zinc-50"
    >
      <div className="absolute top-1/2   z-1 -translate-y-1/2 object-cover rounded-2xl  w-[50%] h-[70%] ">
        <div className="absolute top-1/2 right-1/2  w-[500px] h-[500px] bg-indigo-700 rounded-full blur-[150px] opacity-70" />
        {/* Glow 3 */}
        <div className="absolute top-2/3 right-0  w-[300px] h-[300px] bg-violet-400 rounded-full blur-[100px] " />
      </div>

      <div className="relative z-10 grid grid-cols-3 grid-rows-3 gap-10 max-w-6xl mx-auto items-center justify-items-center min-h-screen">
        {/* 1 */}
        <motion.div
          initial={{ opacity: 0, y: 100, x: 50 }}
          animate={isInView ? { opacity: 1, y: 0, x: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <CardProblem
            title="Przestań gubić pieniądze w subskrypcjach."
            description="Zobacz wszystkie swoje abonamenty w jednym miejscu i kontroluj miesięczne wydatki."
            className="min-w-sm xl:ml-80"
            icon={<FaDollarSign size={70} className="text-green-500" />}
          />
        </motion.div>

        <div />

        {/* 2 */}
        <motion.div
          initial={{ opacity: 0, y: 100, x: -50 }}
          animate={isInView ? { opacity: 1, y: 0, x: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <CardProblem
            title="Koniec z zapominaniem o odnowieniach."
            description="Subly przypomina o zbliżających się płatnościach zanim subskrypcja odnowi się automatycznie."
            className="min-w-sm xl:mr-80"
            icon={<FaBell size={70} className="text-yellow-500" />}
          />
        </motion.div>

        {/* 6 */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.95 }}
        >
          <CardProblem
            title="Wiesz dokładnie, za co płacisz."
            description="Przejrzysta lista wszystkich usług, które subskrybujesz — bez chaosu i szukania w mailach."
            className="min-w-sm xl:mr-30"
            icon={<FaList size={70} className="text-blue-500" />}
          />
        </motion.div>

        <div />

        {/* CENTER LOGO */}
        <div className="absolute top-0 left-0 w-full h-full z-10 flex items-center justify-center">
          <div className="flex flex-col items-center font-bold">
            <img src="/logo.png" alt="Logo" className="h-30 w-30" />
            <h4 className="text-6xl">Subly</h4>
          </div>
        </div>

        {/* 3 */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <CardProblem
            title="Mniej chaosu. Więcej kontroli."
            description="Uporządkuj swoje subskrypcje i zarządzaj nimi szybko z jednego prostego panelu."
            className="min-w-sm xl:ml-30"
            icon={<FaSlidersH size={70} className="text-purple-500" />}
          />
        </motion.div>

        {/* 5 */}
        <motion.div
          initial={{ opacity: 0, y: -100, x: 50 }}
          animate={isInView ? { opacity: 1, y: 0, x: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <CardProblem
            title="Subskrypcje pod kontrolą."
            description="Śledź swoje wydatki i miej pewność, że żadna opłata Cię już nie zaskoczy."
            className="min-w-sm xl:ml-80"
            icon={<FaChartLine size={70} className="text-red-500" />}
          />
        </motion.div>

        <div />

        {/* 4 */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -100, x: -50 }}
          animate={isInView ? { opacity: 1, y: 0, x: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.65 }}
        >
          <CardProblem
            title="Twoje subskrypcje. Jedno miejsce."
            description="Netflix, Spotify, AI tools i inne — wszystko w jednym przejrzystym dashboardzie."
            className="min-w-sm xl:mr-80"
            icon={<FaLayerGroup size={70} className="text-indigo-500" />}
          />
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemS;
