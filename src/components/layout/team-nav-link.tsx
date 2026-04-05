"use client";

import type { SVGProps } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

import { getSupabaseBrowserClient } from "@/lib/supabase";

type TeamNavLinkProps = {
  label: string;
  icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
};

type TeamMemberRow = {
  team_id: string;
};

export function TeamNavLink({ label, icon: Icon }: TeamNavLinkProps) {
  const pathname = usePathname();
  const [href, setHref] = useState("/team");

  useEffect(() => {
    const run = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setHref("/team");
          return;
        }

        const { data } = await supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if ((data as TeamMemberRow | null)?.team_id) {
          setHref(`/team/${(data as TeamMemberRow).team_id}`);
          return;
        }

        setHref("/team");
      } catch {
        setHref("/team");
      }
    };

    void run();
  }, []);

  const isActive = pathname === "/team" || pathname.startsWith("/team/");

  return (
    <Link
      href={href}
      aria-label={label}
      className={clsx(
        "flex h-14 items-center justify-center text-[var(--color-text-muted)] transition",
        isActive && "text-[var(--color-primary)]",
      )}
    >
      <Icon className="h-6 w-6" />
    </Link>
  );
}
