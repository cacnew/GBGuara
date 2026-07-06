import { notFound } from "next/navigation";
import { BackLink } from "@/components/layout/back-link";
import { createClient } from "@/lib/supabase/server";
import type { ClassGroupInput } from "@/lib/validations/class-group";
import { ClassGroupForm } from "../../class-group-form";

export default async function EditClassGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: classGroup } = await supabase
    .from("class_groups")
    .select(
      "id, name, modality_id, main_teacher_id, week_days, start_time, end_time, suggested_audience, suggested_student_limit, notes, status",
    )
    .eq("id", id)
    .single();

  if (!classGroup) notFound();

  const { data: modalities } = await supabase
    .from("modalities")
    .select("id, name")
    .eq("status", "active")
    .order("name");
  const { data: teachers } = await supabase
    .from("teachers")
    .select("id, name")
    .eq("status", "active")
    .order("name");

  const defaultValues: ClassGroupInput = {
    name: classGroup.name,
    modalityId: classGroup.modality_id,
    mainTeacherId: classGroup.main_teacher_id ?? "",
    weekDays: (classGroup.week_days ?? []).map(String),
    startTime: classGroup.start_time.slice(0, 5),
    endTime: classGroup.end_time.slice(0, 5),
    suggestedAudience: classGroup.suggested_audience ?? "",
    suggestedStudentLimit: classGroup.suggested_student_limit ?? 0,
    notes: classGroup.notes ?? "",
    status: classGroup.status as ClassGroupInput["status"],
  };

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="flex w-full max-w-sm items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">Editar turma</h1>
        <BackLink href="/classes" />
      </div>
      <ClassGroupForm
        id={classGroup.id}
        modalities={modalities ?? []}
        teachers={teachers ?? []}
        defaultValues={defaultValues}
      />
    </div>
  );
}
