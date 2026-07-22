import { createClient } from "@/lib/supabase/server";
import { PRESENT_STATUSES } from "@/lib/attendance/constants";
import { computeGraduationEligibility, type GraduationEligibility } from "./eligibility-rules";

export * from "./eligibility-rules";

export type StudentGraduationStatus = GraduationEligibility & {
  studentId: string;
  lastGraduationDate: string | null;
};

/**
 * Aptidão para graduação de um conjunto de alunos (Fase 13.2), calculada
 * em lote para evitar N+1 — usada tanto na chamada com sinalização
 * (poucos alunos por sessão) quanto no dashboard do professor (todos os
 * alunos ativos da escola). Mesmo padrão de bulk já usado em
 * `getTeacherDashboardData` (`attentionStudents`,
 * `app/(teacher)/professor/queries.ts`): uma query de alunos, uma query
 * de presenças agrupada em memória — sem uma query por aluno.
 *
 * Reaproveita a mesma regra de contagem da Fase 6.3 (presenças desde a
 * última graduação, no máximo uma por dia, só da modalidade da faixa
 * atual), mas usando `PRESENT_STATUSES` em vez do filtro `"presente"`
 * isolado usado ali — a chamada com sinalização (Fase 9.5) gera
 * `confirmed`/`added_by_instructor`, não `"presente"`, então o filtro
 * antigo já subcontava presenças confirmadas por esse fluxo.
 */
export async function getGraduationEligibilityByStudentIds(
  schoolId: string,
  studentIds: string[],
): Promise<Map<string, StudentGraduationStatus>> {
  const result = new Map<string, StudentGraduationStatus>();
  if (studentIds.length === 0) return result;

  const supabase = await createClient();

  const { data: students } = await supabase
    .from("students")
    .select(
      "id, last_graduation_date, enrollment_date, current_belt_id, belts(belt_system_id, belt_systems(modality_id))",
    )
    .eq("school_id", schoolId)
    .in("id", studentIds);

  const gradableStudents = (students ?? []).filter((s) => s.current_belt_id);
  if (gradableStudents.length === 0) return result;

  const { data: requirementRows } = await supabase
    .from("belt_graduation_requirements")
    .select("from_belt_id, required_classes")
    .eq("school_id", schoolId);

  const requiredByBeltId = new Map(
    (requirementRows ?? []).map((r) => [r.from_belt_id, r.required_classes]),
  );

  const { data: attendanceRows } = await supabase
    .from("attendances")
    .select("student_id, class_sessions!inner(date, class_groups!inner(modality_id))")
    .in(
      "student_id",
      gradableStudents.map((s) => s.id),
    )
    .in("status", PRESENT_STATUSES);

  const attendanceRowsByStudent = new Map<string, typeof attendanceRows>();
  for (const row of attendanceRows ?? []) {
    const list = attendanceRowsByStudent.get(row.student_id) ?? [];
    list.push(row);
    attendanceRowsByStudent.set(row.student_id, list);
  }

  for (const student of gradableStudents) {
    const referenceDate = student.last_graduation_date ?? student.enrollment_date;
    const modalityId = student.belts?.belt_systems?.modality_id ?? null;
    const dates = new Set<string>();

    for (const row of attendanceRowsByStudent.get(student.id) ?? []) {
      const date = row.class_sessions?.date;
      const rowModalityId = row.class_sessions?.class_groups?.modality_id;
      if (!date || date < referenceDate) continue;
      if (modalityId && rowModalityId !== modalityId) continue;
      dates.add(date);
    }

    const requiredClasses = requiredByBeltId.get(student.current_belt_id as string) ?? null;

    result.set(student.id, {
      studentId: student.id,
      lastGraduationDate: student.last_graduation_date,
      ...computeGraduationEligibility(dates.size, requiredClasses),
    });
  }

  return result;
}
