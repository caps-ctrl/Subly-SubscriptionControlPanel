import { cn } from "@/lib/utils";

type CardProblemProps = {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
};

export default function CardProblem({
  title,
  description,
  className,
  icon,
}: CardProblemProps) {
  return (
    <div
      className={cn(
        "group relative h-full overflow-hidden rounded-[28px] border border-zinc-200/70 bg-white/78 p-5 shadow-lg shadow-zinc-950/[0.04] backdrop-blur transition-transform duration-300 supports-[backdrop-filter]:bg-white/65 dark:border-zinc-800/70 dark:bg-zinc-950/68 dark:shadow-black/20 sm:p-6",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/75 via-white/10 to-transparent dark:from-white/8 dark:via-white/0 dark:to-transparent"
      />

      <div className="relative flex h-full flex-col gap-5 sm:flex-row sm:items-start">
        <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-zinc-200/80 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90">
          {icon}
        </div>

        <div className="min-w-0">
          <h3 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-2xl">
            {title}
          </h3>
          <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300 sm:text-[15px]">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
