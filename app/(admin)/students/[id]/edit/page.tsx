import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { StudentInput } from "@/lib/validations/student";
import { EditStudentForm } from "./form";
import { GuardiansSection, type GuardianLink } from "./guardians-section";
import { AttendanceHistory } from "./attendance-history";

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

  const { data: links } = await supabase
    .from("student_guardians")
    .select(
      "id, is_primary, is_financial_responsible, guardians(id, name, phone, relationship)",
    )
    .eq("student_id", id);

  const guardians: GuardianLink[] = (links ?? []).map((link) => ({
    linkId: link.id,
    guardianId: link.guardians?.id ?? "",
    name: link.guardians?.name ?? "",
    phone: link.guardians?.phone ?? null,
    relationship: link.guardians?.relationship ?? null,
    isPrimary: link.is_primary,
    isFinancialResponsible: link.is_financial_responsible,
  }));

  return (
    <div className="flex flex-1 flex-col items-center gap-10 p-6 text-foreground">
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
          status: student.status as StudentInput["status"],
          notes: student.notes ?? "",
        }}
      />
      <GuardiansSection studentId={student.id} guardians={guardians} />
      <AttendanceHistory studentId={student.id} />
    </div>
  );
}
