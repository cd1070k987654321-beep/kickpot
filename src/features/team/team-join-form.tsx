"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { TopBar } from "@/components/layout/top-bar";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Input } from "@/components/ui/input";
import { toKoreanErrorMessage } from "@/lib/error-message";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type SearchTeamRow = {
  id: string;
  name: string;
  description: string;
  logo_url: string | null;
};

export function TeamJoinForm() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [teams, setTeams] = useState<SearchTeamRow[]>([]);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        setIsSearching(true);
        setError("");

        let query = supabase
          .from("teams")
          .select("id, name, description, logo_url")
          .order("created_at", { ascending: false })
          .limit(12);

        if (search.trim()) {
          query = query.ilike("name", `%${search.trim()}%`);
        }

        const { data, error: queryError } = await query;

        if (queryError) {
          setError(toKoreanErrorMessage(queryError.message));
          setTeams([]);
          return;
        }

        setTeams((data ?? []) as SearchTeamRow[]);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? toKoreanErrorMessage(caughtError.message) : "팀 검색 중 문제가 생겼어요.");
      } finally {
        setIsSearching(false);
      }
    };

    void run();
  }, [search]);

  return (
    <section className="space-y-6">
      <TopBar title="팀 검색" description="팀 이름으로 찾아보고 상세페이지에서 가입 요청을 보낼 수 있어요." />

      <section className="space-y-4 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
        <div className="space-y-2">
          <label className="text-sm font-medium">팀 검색</label>
          <Input placeholder="팀 이름을 검색해 주세요" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>

        {error ? <FeedbackMessage type="error" message={error} /> : null}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">검색 결과</p>
            <span className="text-xs text-[var(--color-text-muted)]">{isSearching ? "찾는 중" : `${teams.length}개`}</span>
          </div>

          <div className="space-y-3">
            {teams.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => router.push(`/team/${team.id}`)}
                className="w-full rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[var(--color-surface)]">
                      {team.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={team.logo_url} alt={`${team.name} 로고`} className="h-12 w-12 rounded-full object-contain" />
                      ) : (
                        <span className="text-base font-bold text-[var(--color-primary)]">{team.name.slice(0, 1)}</span>
                      )}
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold">{team.name}</h2>
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">{team.description || "팀 소개가 아직 없어요."}</p>
                    </div>
                  </div>

                  <span className="text-xs font-medium text-[var(--color-primary)]">상세 보기</span>
                </div>
              </button>
            ))}

            {!isSearching && !teams.length ? (
              <p className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-4 text-sm text-[var(--color-text-muted)]">
                검색된 팀이 없어요.
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </section>
  );
}
