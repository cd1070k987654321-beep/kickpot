import Link from "next/link";

import { BottomNav } from "@/components/layout/bottom-nav";
import { MobileShell } from "@/components/layout/mobile-shell";
import { TopBar } from "@/components/layout/top-bar";
import { TeamList } from "@/features/team/team-list";

export default function TeamPage() {
  return (
    <>
      <MobileShell withBottomNav>
        <section className="space-y-6">
          <TopBar
            title="팀"
            description="내 팀을 관리하거나 새 팀을 만들고, 초대 코드로 다른 팀에 합류할 수 있어."
          />

          <div className="grid gap-3">
            <Link
              href="/team/create"
              className="flex min-h-[120px] flex-col justify-between rounded-[24px] bg-[var(--color-primary)] p-5 text-[#0b0f14] shadow-[var(--shadow-card)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:rgba(11,15,20,0.12)]">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold">팀 생성하기</p>
                <p className="mt-1 text-sm text-[color:rgba(11,15,20,0.72)]">직접 팀장이 되어 팀을 만들어 보세요.</p>
              </div>
            </Link>

            <Link
              href="/team/join"
              className="flex min-h-[120px] flex-col justify-between rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-surface-muted)] text-[var(--color-primary)]">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 12h8M12 8l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold">팀 검색하기</p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">원하는 팀을 찾거나 초대 코드로 바로 합류할 수 있어요.</p>
              </div>
            </Link>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">내 팀</h2>
              <span className="text-sm text-[var(--color-text-muted)]">실데이터 기준</span>
            </div>
            <TeamList />
          </div>
        </section>
      </MobileShell>
      <BottomNav />
    </>
  );
}
