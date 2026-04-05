import type { ReactNode } from "react";

import { PageHeader } from "@/components/ui/page-header";

type AuthCardProps = {
  title: string;
  description: string;
  footer?: ReactNode;
  children: ReactNode;
};

export function AuthCard({ title, description, footer, children }: AuthCardProps) {
  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-16 text-[var(--foreground)]">
      <div className="mx-auto flex max-w-md flex-col gap-8 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-card)]">
        <PageHeader title={title} description={description} />
        {children}
        {footer ? <div className="text-sm text-[var(--color-text-muted)]">{footer}</div> : null}
      </div>
    </main>
  );
}
