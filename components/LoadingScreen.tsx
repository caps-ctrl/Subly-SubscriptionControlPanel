import Image from "next/image";

export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-white px-6 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <div className="relative flex w-full max-w-md flex-col items-center gap-6 text-center">
        <div className="absolute top-1/2 -z-10 h-44 w-44 -translate-y-1/2 rounded-full bg-indigo-500/20 blur-3xl dark:bg-cyan-400/20" />

        <div className="flex items-center gap-4  rounded-full border border-zinc-200/80 bg-white/85 px-5 py-4 shadow-lg shadow-zinc-950/5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 dark:shadow-black/30">
          <div className="relative h-14 w-14">
            {/* glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-indigo-700 rounded-full blur-[5px] opacity-70" />
            {/* właściwy element */}
            <div className="relative h-14 w-14 p-2 overflow-hidden rounded-full border border-zinc-200/70 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <Image src="/logo.png" alt="Logo" width={40} height={40} />
            </div>
          </div>

          <div className="text-left">
            <p className="text-xs font-medium uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">
              Subly
            </p>
            <p className="text-xl font-semibold">Ladowanie aplikacji</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent dark:border-cyan-400 dark:border-t-transparent" />
          <span>Przygotowujemy Twoje dane...</span>
        </div>
      </div>
    </div>
  );
}
