import { requireUser } from "@/lib/permissions";
import { BackLink } from "@/components/layout/back-link";
import { WeeklyPositionForm } from "@/components/weekly-positions/position-form";

export default async function NewWeeklyPositionPage() {
  const profile = await requireUser();

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="flex w-full max-w-md items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">Nova posição da semana</h1>
        <BackLink href="/content/weekly-positions" />
      </div>
      <WeeklyPositionForm basePath="/content/weekly-positions" schoolId={profile.schoolId} />
    </div>
  );
}
