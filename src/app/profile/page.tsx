import { BottomNav } from "@/components/layout/bottom-nav";
import { MobileShell } from "@/components/layout/mobile-shell";
import { ProfileView } from "@/features/profile/profile-view";

export default function ProfilePage() {
  return (
    <>
      <MobileShell withBottomNav>
        <ProfileView />
      </MobileShell>
      <BottomNav />
    </>
  );
}
