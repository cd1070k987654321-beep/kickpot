"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import { toKoreanErrorMessage } from "@/lib/error-message";
import type { TeamSummary } from "@/types/team";

type RawTeamMemberRow = {
  role: "owner" | "member";
  teams: {
    id: string;
    name: string;
    description: string;
    invite_code: string | null;
    logo_url: string | null;
  } | null;
};

export function TeamList() {
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setError("로그인이 필요해요.");
          setIsLoading(false);
          return;
        }

        const { data, error: queryError } = await supabase
          .from("team_members")
          .select("role, teams(id, name, description, invite_code, logo_url)")
          .eq("user_id", user.id);

        if (queryError) {
          setError(toKoreanErrorMessage(queryError.message));
          setIsLoading(false);
          return;
        }

        const mapped = ((data ?? []) as RawTeamMemberRow[])
          .filter((row) => row.teams)
          .map((row) => ({
            id: row.teams!.id,
            name: row.teams!.name,
            description: row.teams!.description,
            invite_code: row.teams!.invite_code,
            logo_url: row.teams!.logo_url,
            role: row.role,
          }));

        setTeams(mapped);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? toKoreanErrorMessage(caughtError.message) : "팀 목록을 불러오지 못했어요. 다시 시도해 주세요.");
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, []);

  if (isLoading) {
    return <p className="text-sm text-[var(--color-text-muted)]">팀 목록을 불러오는 중이에요...</p>;
  }

  if (error) {
    return <p className="rounded-2xl border border-[color:rgba(239,68,68,0.3)] bg-[color:rgba(239,68,68,0.08)] px-4 py-3 text-sm text-[var(--color-error)]">{error}</p>;
  }

  if (!teams.length) {
    return null;
  }

  return (
    <section className="space-y-3">
      {teams.map((team) => (
        <Link
          key={team.id}
          href={`/team/${team.id}`}
          className="block rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                {team.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={team.logo_url} alt={`${team.name} 로고`} className="h-14 w-14 rounded-full object-contain" />
                ) : (
                  <span className="text-lg font-bold text-[var(--color-primary)]">{team.name.slice(0, 1)}</span>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">{team.role}</p>
                <h2 className="mt-2 text-lg font-bold">{team.name}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{team.description || "팀 소개가 아직 없어요."}</p>
              </div>
            </div>
            {team.invite_code ? (
              <span className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text-muted)]">
                {team.invite_code}
              </span>
            ) : null}
          </div>
        </Link>
      ))}
    </section>
  );
}
