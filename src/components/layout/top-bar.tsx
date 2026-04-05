import type { ReactNode } from "react";

type TopBarProps = {
  title: string;
  description?: string;
  trailing?: ReactNode;
};

export function TopBar({ title, description, trailing }: TopBarProps) {
  return (
    <header className="flex items-start justify-between gap-4 pb-2 pt-1">
      <div>
        <h1 className="text-2xl font-bold leading-tight">{title}</h1>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{description}</p>
        ) : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </header>
  );
}
