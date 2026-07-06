import { notFound } from "next/navigation";
import { BackLink } from "@/components/layout/back-link";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import type { TeacherInput } from "@/lib/validations/teacher";
import { EditTeacherProfileForm } from "./form";
import {
  GraduationsSection,
  type TeacherGraduationRow,
} from "./graduations-section";

export default async function EditTeacherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const { data: teacher } = await supabase
    .from("teachers")
    .select("id, name, phone, email, photo_url, status, notes")
    .eq("id", id)
    .single();

  if (!teacher) notFound();

  const { data: modalities } = await supabase
    .from("modalities")
    .select("id, name")
    .eq("status", "active")
    .order("name");

  const { data: belts } = await supabase
    .from("belts")
    .select("id, name")
    .order("name");

  const { data: graduationRows } = await supabase
    .from("teacher_graduations")
    .select("id, degree, since_date, modalities(name), belts(name)")
    .eq("teacher_id", id)
    .order("since_date", { ascending: false });

  const graduations: TeacherGraduationRow[] = (graduationRows ?? []).map(
    (row) => ({
      id: row.id,
      modalityName: row.modalities?.name ?? "",
      beltName: row.belts?.name ?? "",
      degree: row.degree,
      sinceDate: row.since_date,
    }),
  );

  return (
    <div className="flex flex-1 flex-col items-center gap-10 p-6 text-foreground">
      <div className="flex w-full max-w-sm items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">
          Editar professor
        </h1>
        <BackLink href="/teachers" />
      </div>
      <EditTeacherProfileForm
        id={teacher.id}
        schoolId={profile.schoolId}
        defaultValues={{
          name: teacher.name,
          phone: teacher.phone ?? "",
          email: teacher.email ?? "",
          photoUrl: teacher.photo_url ?? "",
          status: teacher.status as TeacherInput["status"],
          notes: teacher.notes ?? "",
        }}
      />
      <GraduationsSection
        teacherId={teacher.id}
        modalities={modalities ?? []}
        belts={belts ?? []}
        graduations={graduations}
      />
    </div>
  );
}
