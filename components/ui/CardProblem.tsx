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
      className={[
        "relative overflow-hidden rounded-3xl border max-w-100 border-zinc-200/70 bg-white/70 p-6 shadow-sm backdrop-blur",
        "supports-[backdrop-filter]:bg-white/60",
        "dark:border-zinc-800/70 dark:bg-zinc-950/60 dark:shadow-black/20",
        className,
      ].join(" ")}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/70 via-white/0 to-white/0 dark:from-white/10 dark:via-white/0 dark:to-white/0"
      />
      <div className="flex items-center">
        <div className="relative">
          <h3 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {description}
          </p>
        </div>
        <div className="ml-auto ">{icon}</div>
      </div>
    </div>
  );
}
