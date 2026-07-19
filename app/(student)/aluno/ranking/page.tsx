import { requireStudent } from "@/lib/permissions";
import { RankingFilters } from "@/components/medals/ranking-filters";
import { RankingTable } from "@/components/medals/ranking-table";
import { MyRankingSummary } from "@/components/medals/my-ranking-summary";
import { getMedalRanking } from "@/modules/medals/ranking";

export default async function StudentMedalRankingPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; event?: string }>;
}) {
  const profile = await requireStudent();
  const { year: yearParam, event: eventId } = await searchParams;
  const year = yearParam ? Number(yearParam) : undefined;

  const ranking = await getMedalRanking(profile.schoolId, { year, eventId });
  const selectedYear = year ?? new Date().getUTCFullYear();

  const myRow = ranking.rows.find((row) => row.studentId === profile.id);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 text-foreground md:p-6">
      <h1 className="font-heading text-2xl font-semibold">Ranking de medalhas</h1>

      <MyRankingSummary
        periodPoints={myRow?.points ?? 0}
        allTimePoints={ranking.allTimeTotals[profile.id] ?? 0}
        position={myRow?.position ?? null}
        totalParticipants={ranking.rows.length}
      />

      <RankingFilters
        basePath="/aluno/ranking"
        availableYears={ranking.availableYears}
        events={ranking.events}
        selectedYear={selectedYear}
        selectedEventId={eventId}
      />
      <RankingTable rows={ranking.rows} highlightStudentId={profile.id} />
    </div>
  );
}
