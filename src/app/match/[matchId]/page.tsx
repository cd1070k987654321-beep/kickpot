type MatchDetailPageProps = {
  params: Promise<{ matchId: string }>;
};

export default async function MatchDetailPage({ params }: MatchDetailPageProps) {
  const { matchId } = await params;

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-16 text-[var(--foreground)]">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold">매치 상세</h1>
        <p className="mt-3 text-[var(--color-text-muted)]">matchId: {matchId}</p>
      </div>
    </main>
  );
}
