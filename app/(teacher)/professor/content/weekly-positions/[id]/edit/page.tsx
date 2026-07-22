import { notFound } from "next/navigation";
import { requireUser } from "@/lib/permissions";
import { BackLink } from "@/components/layout/back-link";
import { WeeklyPositionForm } from "@/components/weekly-positions/position-form";
import { getWeeklyPosition } from "@/modules/weekly-positions/positions";

export default async function EditTeacherWeeklyPositionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireUser();
  const { id } = await params;
  const position = await getWeeklyPosition(id);
  if (!position) notFound();

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="flex w-full max-w-md items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">Editar posição da semana</h1>
        <BackLink href="/professor/content/weekly-positions" />
      </div>
      <WeeklyPositionForm
        id={id}
        basePath="/professor/content/weekly-positions"
        schoolId={profile.schoolId}
        defaultValues={{
          title: position.title,
          description: position.description,
          imageUrl: position.imageUrl,
          youtubeUrl: position.youtubeUrl ?? "",
          startDate: position.startDate,
          endDate: position.endDate ?? "",
          published: position.published,
        }}
      />
    </div>
  );
}
