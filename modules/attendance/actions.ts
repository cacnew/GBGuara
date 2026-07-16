"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/modules/audit/log";
import { PRESENT_STATUSES } from "@/lib/attendance/constants";

export type AttendanceActionResult = { error?: string; attendanceId?: string };

/**
 * Marca presença de um aluno numa sessão, em um clique — qualquer aluno
 * ativo da escola, mesmo sem vínculo prévio com a turma (seção 3 do
 * documento mestre). Reaproveita a linha existente quando o aluno já tinha
 * se sinalizado pela agenda (status 'signaled') ou cancelado antes, em vez
 * de tentar inserir e esbarrar na constraint unique(class_session_id,
 * student_id) da Fase 4.1 com um erro confuso.
 */
export async function markPresent(
  classSessionId: string,
  studentId: string,
): Promise<AttendanceActionResult> {
  const profile = await requireUser();
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("class_sessions")
    .select("attendance_closed_at")
    .eq("id", classSessionId)
    .single();

  if (session?.attendance_closed_at) {
    return { error: "A chamada desta sessão já foi fechada" };
  }

  const { data: existing } = await supabase
    .from("attendances")
    .select("id, status")
    .eq("class_session_id", classSessionId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (existing && (PRESENT_STATUSES as readonly string[]).includes(existing.status)) {
    return { error: "Esse aluno já está presente nesta sessão" };
  }

  const { data, error } = existing
    ? await supabase
        .from("attendances")
        .update({ status: "presente", registered_by_user_id: profile.id })
        .eq("id", existing.id)
        .select("id")
        .single()
    : await supabase
        .from("attendances")
        .insert({
          school_id: profile.schoolId,
          class_session_id: classSessionId,
          student_id: studentId,
          status: "presente",
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

  const { data: session } = await supabase
    .from("class_sessions")
    .select("attendance_closed_at")
    .eq("id", classSessionId)
    .single();

  if (session?.attendance_closed_at) {
    return { error: "A chamada desta sessão já foi fechada" };
  }

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
