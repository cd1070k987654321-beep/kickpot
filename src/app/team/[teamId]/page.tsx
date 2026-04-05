import { MobileShell } from "@/components/layout/mobile-shell";
import { BottomNav } from "@/components/layout/bottom-nav";
import { TeamDetailView } from "@/features/team/team-detail-view";

type TeamDetailPageProps = {
  params: Promise<{ teamId: string }>;
};

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { teamId } = await params;

  return (
    <>
      <MobileShell withBottomNav>
        <TeamDetailView teamId={teamId} />
      </MobileShell>
      <BottomNav />
    </>
  );
}
