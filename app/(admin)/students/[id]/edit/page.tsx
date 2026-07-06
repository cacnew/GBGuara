import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { WhatsAppSend } from "@/components/forms/whatsapp-send";
import { sendWhatsAppToStudent } from "@/modules/whatsapp/actions";
import type { StudentInput } from "@/lib/validations/student";
import { EditStudentForm } from "./form";
import { GuardiansSection, type GuardianLink } from "./guardians-section";
import { AttendanceHistory } from "./attendance-history";
import { FinancialSection } from "./financial-section";
import { getStudentFinancialSummary } from "./financial-queries";
import { GraduationSection } from "./graduation-section";
import { StudentEditTabs } from "./student-edit-tabs";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select(
      "id, name, birth_date, cpf, phone, email, address, emergency_contact, photo_url, status, notes, current_degree, last_graduation_date, enrollment_date, belts(name)",
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

  const financialSummary = await getStudentFinancialSummary(student.id);
  const { data: financialAccounts } = await supabase
    .from("financial_accounts")
    .select("id, name")
    .eq("status", "active");

  const { data: beltSystems } = await supabase
    .from("belt_systems")
    .select("id, name")
    .order("name");
  const { data: belts } = await supabase
    .from("belts")
    .select("id, belt_system_id, name, ordering")
    .order("ordering");
  const { data: teachers } = await supabase
    .from("teachers")
    .select("id, name")
    .order("name");

  const graduationReferenceDate = student.last_graduation_date ?? student.enrollment_date;
  const { count: attendancesSinceLastGraduation } = await supabase
    .from("attendances")
    .select("id, class_sessions!inner(date)", { count: "exact", head: true })
    .eq("student_id", student.id)
    .eq("status", "presente")
    .gte("class_sessions.date", graduationReferenceDate);

  const daysSinceLastGraduation = Math.floor(
    (new Date().getTime() - new Date(`${graduationReferenceDate}T00:00:00Z`).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="flex w-full max-w-2xl items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Editar aluno</h1>
        <Link
          href={`/students/${student.id}/contract/new`}
          className={buttonVariants({ size: "sm" })}
        >
          Associar plano
        </Link>
      </div>
      <StudentEditTabs
        personalTab={
          <>
            <EditStudentForm
              id={student.id}
              schoolId={profile.schoolId}
              defaultValues={{
                name: student.name,
                birthDate: student.birth_date ?? "",
                cpf: student.cpf ?? "",
                phone: student.phone ?? "",
                email: student.email ?? "",
                address: student.address ?? "",
                emergencyContact: student.emergency_contact ?? "",
                photoUrl: student.photo_url ?? "",
                status: student.status as StudentInput["status"],
                notes: student.notes ?? "",
              }}
            />
            <div className="w-full max-w-sm">
              <WhatsAppSend
                phone={student.phone}
                onSend={sendWhatsAppToStudent.bind(null, student.id)}
              />
            </div>
          </>
        }
        guardiansTab={
          <GuardiansSection studentId={student.id} guardians={guardians} />
        }
        financialTab={
          <FinancialSection
            studentId={student.id}
            summary={financialSummary}
            accounts={financialAccounts ?? []}
          />
        }
        graduationTab={
          <GraduationSection
            studentId={student.id}
            currentBeltName={student.belts?.name ?? null}
            currentDegree={student.current_degree}
            beltSystems={beltSystems ?? []}
            belts={(belts ?? []).map((b) => ({
              id: b.id,
              beltSystemId: b.belt_system_id,
              name: b.name,
              ordering: b.ordering,
            }))}
            teachers={teachers ?? []}
            attendancesSinceLastGraduation={attendancesSinceLastGraduation ?? 0}
            daysSinceLastGraduation={daysSinceLastGraduation}
          />
        }
        attendanceTab={<AttendanceHistory studentId={student.id} />}
      />
    </div>
  );
}
