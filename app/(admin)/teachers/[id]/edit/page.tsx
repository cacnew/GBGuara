import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TeacherInput } from "@/lib/validations/teacher";
import { EditTeacherProfileForm } from "./form";

export default async function EditTeacherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: teacher } = await supabase
    .from("teachers")
    .select("id, name, phone, email, photo_url, status, notes")
    .eq("id", id)
    .single();

  if (!teacher) notFound();

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="w-full max-w-sm">
        <h1 className="font-heading text-2xl font-semibold">
          Editar professor
        </h1>
      </div>
      <EditTeacherProfileForm
        id={teacher.id}
        defaultValues={{
          name: teacher.name,
          phone: teacher.phone ?? "",
          email: teacher.email ?? "",
          photoUrl: teacher.photo_url ?? "",
          status: teacher.status as TeacherInput["status"],
          notes: teacher.notes ?? "",
        }}
      />
    </div>
  );
}
