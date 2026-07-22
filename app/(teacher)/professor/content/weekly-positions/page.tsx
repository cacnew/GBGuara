import Link from "next/link";
import { requireUser } from "@/lib/permissions";
import { buttonVariants } from "@/components/ui/button";
import { WeeklyPositionList } from "@/components/weekly-positions/position-list";
import { getWeeklyPositions } from "@/modules/weekly-positions/positions";

export default async function TeacherWeeklyPositionsPage() {
  await requireUser();
  const positions = await getWeeklyPositions();

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 text-foreground">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Posição da semana</h1>
        <Link href="/professor/content/weekly-positions/new" className={buttonVariants()}>
          Nova posição
        </Link>
      </div>
      <WeeklyPositionList positions={positions} basePath="/professor/content/weekly-positions" />
    </div>
  );
}
