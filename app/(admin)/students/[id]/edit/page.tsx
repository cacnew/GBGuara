import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { BackLink } from "@/components/layout/back-link";
import { WhatsAppSend } from "@/components/forms/whatsapp-send";
import { sendWhatsAppToStudent } from "@/modules/whatsapp/actions";
import type { StudentInput } from "@/lib/validations/student";
import { EditStudentForm } from "./form";
import { GuardiansSection, type GuardianLink } from "./guardians-section";
import { AttendanceHistory } from "./attendance-history";
import { FinancialSection } from "./financial-section";
import { getStudentFinancialSummary } from "./financial-queries";
import {
  GraduationSection,
  type GraduationHistoryRow,
} from "./graduation-section";
import { StudentEditTabs } from "./student-edit-tabs";
import { ResetPasswordButton } from "../reset-password/reset-password-button";
import { LaunchMedalForStudentButton } from "@/components/medals/launch-for-student-button";
import { getStaffMedalLaunchFormData } from "@/modules/medals/staff-launch";
import { getGraduationEligibilityByStudentIds } from "@/modules/graduation/eligibility";

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
      "id, name, birth_date, cpf, phone, email, address, emergency_contact, photo_url, status, notes, current_degree, last_graduation_date, enrollment_date, auth_user_id, belts(name, belt_systems(modality_id))",
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
    .select("id, belt_system_id, name, ordering, max_degrees")
    .order("ordering");
  const { data: teachers } = await supabase
    .from("teachers")
    .select("id, name")
    .order("name");
  const { data: graduationHistoryRows } = await supabase
    .from("graduation_history")
    .select(
      "id, graduation_date, previous_degree, new_degree, notes, previous_belt:belts!graduation_history_previous_belt_id_fkey(name), new_belt:belts!graduation_history_new_belt_id_fkey(name), teachers(name)",
    )
    .eq("student_id", student.id)
    .order("graduation_date", { ascending: false })
    .order("created_at", { ascending: false });

  const graduationHistory: GraduationHistoryRow[] = (
    graduationHistoryRows ?? []
  ).map((row) => ({
    id: row.id,
    date: row.graduation_date,
    previousBeltName: row.previous_belt?.name ?? null,
    previousDegree: row.previous_degree,
    newBeltName: row.new_belt?.name ?? "Faixa",
    newDegree: row.new_degree,
    teacherName: row.teachers?.name ?? null,
    notes: row.notes,
  }));

  const graduationReferenceDate = student.last_graduation_date ?? student.enrollment_date;
  // Reaproveita o mesmo cálculo em lote da Fase 13.2
  // (`getGraduationEligibilityByStudentIds`) em vez de duplicar a query
  // aqui — a versão antiga filtrava só `status = "presente"`, subcontando
  // presenças confirmadas pela chamada com sinalização (Fase 9.5, que
  // gera `confirmed`/`added_by_instructor`).
  const eligibilityByStudent = await getGraduationEligibilityByStudentIds(profile.schoolId, [
    student.id,
  ]);
  const attendancesSinceLastGraduation =
    eligibilityByStudent.get(student.id)?.attendancesSinceLastGraduation ?? 0;

  const daysSinceLastGraduation = Math.floor(
    (new Date().getTime() - new Date(`${graduationReferenceDate}T00:00:00Z`).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  const medalLaunchFormData = await getStaffMedalLaunchFormData();

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="flex w-full max-w-7xl flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">Editar aluno</h1>
        <div className="flex gap-2">
          <BackLink href="/students" />
          <Link
            href={`/students/${student.id}/dossie`}
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            Ver dossiê
          </Link>
          <Link
            href={`/students/${student.id}/contract/new`}
            className={buttonVariants({ size: "sm" })}
          >
            Associar plano
          </Link>
          <Link
            href={`/students/${student.id}/login/new`}
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            {student.auth_user_id ? "Login criado" : "Criar login"}
          </Link>
          {student.auth_user_id && (
            <ResetPasswordButton studentId={student.id} studentName={student.name} />
          )}
          <LaunchMedalForStudentButton
            studentId={student.id}
            events={medalLaunchFormData.events}
            modalities={medalLaunchFormData.modalities}
          />
        </div>
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
            <div className="w-full">
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
              maxDegrees: b.max_degrees,
            }))}
            teachers={teachers ?? []}
            history={graduationHistory}
            attendancesSinceLastGraduation={attendancesSinceLastGraduation}
            daysSinceLastGraduation={daysSinceLastGraduation}
          />
        }
        attendanceTab={<AttendanceHistory studentId={student.id} />}
      />
    </div>
  );
}
