import type { InputHTMLAttributes } from "react";
import { forwardRef } from "react";
import { clsx } from "clsx";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={clsx(
        "h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(163,255,18,0.18)]",
        className,
      )}
      {...props}
    />
  );
});
