import Link from "next/link";

import { MobileShell } from "@/components/layout/mobile-shell";

export default function LandingPage() {
  return (
    <MobileShell>
      <section className="flex min-h-[calc(100vh-4rem)] flex-col justify-between">
        <div className="pt-6">
          <p className="inline-flex rounded-full border border-[var(--color-border-strong)] bg-[color:rgba(163,255,18,0.08)] px-4 py-2 text-xs font-semibold tracking-[0.2em] text-[var(--color-primary)] uppercase">
            mobile mvp
          </p>

          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight">
            축구 팀 운영을
            <br />
            손안에서 끝내자
          </h1>

          <p className="mt-5 text-base leading-7 text-[var(--color-text-muted)]">
            팀 생성, 매칭 요청, 투표, 기록 승인까지.
            KickPot은 모바일에서 가장 빠르게 팀 운영 액션을 처리하는 걸 목표로 해.
          </p>

          <div className="mt-8 grid gap-3">
            <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
              <p className="text-sm text-[var(--color-text-muted)]">핵심 흐름</p>
              <p className="mt-2 text-lg font-semibold">
                팀 생성 → 매칭 요청 → 참여자 투표 → 기록 승인
              </p>
            </div>

            <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5">
              <p className="text-sm text-[var(--color-text-muted)]">디자인 방향</p>
              <p className="mt-2 text-lg font-semibold">
                다크 · 네온 · 스포티 · 모바일 전용
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 pb-4 pt-10">
          <Link
            href="/signup"
            className="flex h-14 w-full items-center justify-center rounded-[18px] bg-[var(--color-primary)] text-base font-bold text-[#0b0f14]"
          >
            회원가입 시작
          </Link>
          <Link
            href="/login"
            className="flex h-14 w-full items-center justify-center rounded-[18px] border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-base font-semibold"
          >
            로그인
          </Link>
        </div>
      </section>
    </MobileShell>
  );
}
