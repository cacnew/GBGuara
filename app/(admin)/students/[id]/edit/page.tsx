import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditStudentForm } from "./form";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select(
      "id, name, birth_date, cpf, phone, email, address, emergency_contact, status, notes",
    )
    .eq("id", id)
    .single();

  if (!student) notFound();

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="w-full max-w-sm">
        <h1 className="font-heading text-2xl font-semibold">Editar aluno</h1>
      </div>
      <EditStudentForm
        id={student.id}
        defaultValues={{
          name: student.name,
          birthDate: student.birth_date ?? "",
          cpf: student.cpf ?? "",
          phone: student.phone ?? "",
          email: student.email ?? "",
          address: student.address ?? "",
          emergencyContact: student.emergency_contact ?? "",
          status: student.status,
          notes: student.notes ?? "",
        }}
      />
    </div>
  );
}
