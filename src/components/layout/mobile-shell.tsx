import type { ReactNode } from "react";

type MobileShellProps = {
  children: ReactNode;
  withBottomNav?: boolean;
};

export function MobileShell({ children, withBottomNav = false }: MobileShellProps) {
  return (
    <main className="min-h-screen w-full bg-[var(--background)] px-4 pb-8 pt-4 text-[var(--foreground)] sm:px-5">
      <div className={withBottomNav ? "pb-24" : "pb-6"}>{children}</div>
    </main>
  );
}
