"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import type { SVGProps } from "react";
import { useEffect, useState } from "react";

import { TeamNavLink } from "@/components/layout/team-nav-link";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type NavIconProps = SVGProps<SVGSVGElement>;

function HomeIcon(props: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.25 9.75V20a1 1 0 0 0 1 1h11.5a1 1 0 0 0 1-1V9.75" strokeLinecap="round" />
    </svg>
  );
}

function TeamIcon(props: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="10" r="2.5" />
      <path d="M4 19c0-2.8 2.7-5 6-5s6 2.2 6 5" strokeLinecap="round" />
      <path d="M15 18c.2-1.8 1.9-3.2 4-3.2 1 0 1.9.3 2.6.8" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon(props: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M6.5 9.5a5.5 5.5 0 1 1 11 0v3.2c0 .7.2 1.3.6 1.9l.9 1.3H5l.9-1.3c.4-.6.6-1.2.6-1.9V9.5Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 18a2 2 0 0 0 4 0" strokeLinecap="round" />
    </svg>
  );
}

function ProfileIcon(props: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19c0-3 3.1-5.3 7-5.3S19 16 19 19" strokeLinecap="round" />
    </svg>
  );
}

const items = [
  { href: "/home", label: "home", icon: HomeIcon },
  { href: "/notifications", label: "notifications", icon: BellIcon },
  { href: "/profile", label: "profile", icon: ProfileIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const run = async () => {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUnreadCount(0);
        return;
      }

      const { data } = await supabase
        .from("notifications")
        .select("id", { count: "exact" })
        .eq("user_id", user.id)
        .eq("is_read", false);

      setUnreadCount(data?.length ?? 0);
    };

    void run();
  }, [pathname]);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--color-border)] bg-[color:rgba(11,15,20,0.98)] pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 backdrop-blur">
      <ul className="grid grid-cols-4 px-2">
        <li>
          <TeamNavLink label="team" icon={TeamIcon} />
        </li>
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const isNotificationItem = item.href === "/notifications";

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-label={item.label}
                className={clsx(
                  "relative flex h-14 items-center justify-center text-[var(--color-text-muted)] transition",
                  isActive && "text-[var(--color-primary)]",
                )}
              >
                <Icon className="h-6 w-6" />
                {isNotificationItem && unreadCount > 0 ? (
                  <span className="absolute right-[calc(50%-18px)] top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-[var(--color-error)] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
