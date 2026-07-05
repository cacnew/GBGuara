"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/modules/audit/log";

export type AttendanceActionResult = { error?: string; attendanceId?: string };

/**
 * Marca presença de um aluno numa sessão, em um clique — qualquer aluno
 * ativo da escola, mesmo sem vínculo prévio com a turma (seção 3 do
 * documento mestre). A constraint unique(class_session_id, student_id)
 * da Fase 4.1 é quem realmente impede duplicidade.
 */
export async function markPresent(
  classSessionId: string,
  studentId: string,
): Promise<AttendanceActionResult> {
  const profile = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("attendances")
    .insert({
      school_id: profile.schoolId,
      class_session_id: classSessionId,
      student_id: studentId,
      registered_by_user_id: profile.id,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Esse aluno já está presente nesta sessão" };
    }
    return { error: error.message };
  }

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "attendance",
    entityId: data.id,
    action: "attendance_marked",
    changes: { studentId, classSessionId },
  });

  revalidatePath(`/attendance/${classSessionId}`);
  return { attendanceId: data.id };
}

/**
 * Remove uma presença registrada por engano (Fase 4.4).
 */
export async function removeAttendance(
  attendanceId: string,
  classSessionId: string,
): Promise<AttendanceActionResult> {
  const profile = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("attendances")
    .delete()
    .eq("id", attendanceId);

  if (error) {
    return { error: error.message };
  }

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "attendance",
    entityId: attendanceId,
    action: "attendance_removed",
  });

  revalidatePath(`/attendance/${classSessionId}`);
  return {};
}
