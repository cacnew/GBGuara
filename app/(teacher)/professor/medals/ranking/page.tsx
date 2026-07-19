import { requireUser } from "@/lib/permissions";
import { RankingFilters } from "@/components/medals/ranking-filters";
import { RankingTable } from "@/components/medals/ranking-table";
import { getMedalRanking } from "@/modules/medals/ranking";

export default async function TeacherMedalRankingPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; event?: string }>;
}) {
  const profile = await requireUser();
  const { year: yearParam, event: eventId } = await searchParams;
  const year = yearParam ? Number(yearParam) : undefined;

  const ranking = await getMedalRanking(profile.schoolId, { year, eventId });
  const selectedYear = year ?? new Date().getUTCFullYear();

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 text-foreground">
      <h1 className="font-heading text-2xl font-semibold">Ranking de medalhas</h1>
      <RankingFilters
        basePath="/professor/medals/ranking"
        availableYears={ranking.availableYears}
        events={ranking.events}
        selectedYear={selectedYear}
        selectedEventId={eventId}
      />
      <RankingTable rows={ranking.rows} />
    </div>
  );
}
