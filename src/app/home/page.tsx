import { BottomNav } from "@/components/layout/bottom-nav";
import { MobileShell } from "@/components/layout/mobile-shell";

const filters = ["서울", "이번 주", "11vs11", "중급"];

const matchCards = [
  {
    id: 1,
    team: "FC River",
    date: "4월 12일 토요일",
    time: "10:00",
    location: "난지 풋살장",
    format: "11 vs 11",
    level: "중급",
    status: "요청 가능",
  },
  {
    id: 2,
    team: "Han Gang United",
    date: "4월 13일 일요일",
    time: "18:30",
    location: "잠실 보조구장",
    format: "8 vs 8",
    level: "초중급",
    status: "마감 임박",
  },
  {
    id: 3,
    team: "Seoul Night FC",
    date: "4월 15일 화요일",
    time: "21:00",
    location: "서울숲 구장",
    format: "풋살",
    level: "중상급",
    status: "요청 가능",
  },
];

export default function HomePage() {
  return (
    <>
      <MobileShell withBottomNav>
        <section className="space-y-6">
          <header className="space-y-3 pt-2">
            <p className="text-sm text-[var(--color-text-muted)]">KickPot Match</p>
            <h1 className="text-[28px] font-bold leading-tight">
              지금 잡을 수 있는
              <br />
              매칭을 찾아보세요
            </h1>
            <p className="text-sm leading-6 text-[var(--color-text-muted)]">
              지역, 날짜, 수준이 맞는 상대팀을 찾고 바로 요청을 보내 보세요.
            </p>
          </header>

          <section className="rounded-[24px] border border-[var(--color-border-strong)] bg-[color:rgba(163,255,18,0.08)] p-5">
            <p className="text-sm text-[var(--color-text-muted)]">빠른 검색</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter}
                  className="rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium"
                >
                  {filter}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">추천 매칭</h2>
              <button className="text-sm font-medium text-[var(--color-primary)]">필터 수정</button>
            </div>

            {matchCards.map((match) => (
              <article
                key={match.id}
                className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                      {match.status}
                    </p>
                    <h3 className="mt-2 text-lg font-bold">{match.team}</h3>
                    <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                      {match.date} · {match.time}
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">{match.location}</p>
                  </div>
                  <div className="space-y-2 text-right">
                    <span className="block rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text-muted)]">
                      {match.format}
                    </span>
                    <span className="block rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text-muted)]">
                      {match.level}
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button className="h-12 rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-sm font-semibold">
                    상세 보기
                  </button>
                  <button className="h-12 rounded-[16px] bg-[var(--color-primary)] text-sm font-bold text-[#0b0f14]">
                    요청 보내기
                  </button>
                </div>
              </article>
            ))}
          </section>

          <button className="h-14 w-full rounded-[18px] border border-[var(--color-border-strong)] bg-[color:rgba(163,255,18,0.08)] text-base font-bold text-[var(--color-primary)]">
            내 매치 만들기
          </button>
        </section>
      </MobileShell>
      <BottomNav />
    </>
  );
}
