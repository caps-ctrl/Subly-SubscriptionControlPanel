import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "cta" | "cta1" | "outline";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";

    const styles =
      variant === "primary"
        ? "bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        : variant === "secondary"
          ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
          : variant === "ghost"
            ? "bg-transparent text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-900"
            : variant === "cta"
              ? "hover:bg-indigo-700 cursor-pointer active:bg-indigo-800 bg-transparent dark:bg-indigo-700 dark:text-white dark:hover:bg-indigo-800 text-black hover:text-white border border-indigo-700 text-sm font-semibold rounded-xl px-4 py-2 transition-colors"
              : variant === "outline"
                ? "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50"
                : "bg-indigo-700 active:bg-indigo-800 bg-transparent dark:text-white dark:hover:bg-indigo-700 cursor-pointer text-black hover:text-white border border-indigo-700 text-sm font-semibold rounded-xl px-4 py-2 transition-colors";

    return (
      <button
        ref={ref}
        className={`${base} ${styles} ${className}`}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
