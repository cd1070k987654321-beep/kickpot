import { BottomNav } from "@/components/layout/bottom-nav";
import { MobileShell } from "@/components/layout/mobile-shell";
import { NotificationsView } from "@/features/notifications/notifications-view";

export default function NotificationsPage() {
  return (
    <>
      <MobileShell withBottomNav>
        <section className="space-y-4 pt-2">
          <div>
            <p className="text-sm text-[var(--color-text-muted)]">Notifications</p>
            <h1 className="mt-2 text-[28px] font-bold leading-tight">알림</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
              팀 가입 요청, 탈퇴, 강퇴, 팀장 위임 같은 이벤트가 여기에 모여요.
            </p>
          </div>

          <NotificationsView />
        </section>
      </MobileShell>
      <BottomNav />
    </>
  );
}
