import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { clsx } from "clsx";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    fullWidth?: boolean;
  }
>;

export function Button({
  children,
  className,
  variant = "primary",
  fullWidth = false,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
        fullWidth && "w-full",
        variant === "primary" &&
          "bg-[var(--color-primary)] text-[#0b0f14] hover:bg-[var(--color-primary-strong)]",
        variant === "secondary" &&
          "border border-[var(--color-border-strong)] bg-transparent text-[var(--foreground)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
