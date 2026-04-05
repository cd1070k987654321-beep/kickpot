type HelperTextProps = {
  children: string;
};

export function HelperText({ children }: HelperTextProps) {
  return <p className="text-sm leading-6 text-[var(--color-text-muted)]">{children}</p>;
}
