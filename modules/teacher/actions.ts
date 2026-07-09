"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/modules/audit/log";

export type TeacherActionResult = { error?: string };

function cleanOptionalText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

async function getTeacherIdByEmail(email: string | null) {
  if (!email) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("teachers")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  return data?.id ?? null;
}

export async function saveSessionReflection(
  classSessionId: string,
  input: { lessonContent: string; notes: string },
): Promise<TeacherActionResult> {
  const profile = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("class_sessions")
    .update({
      lesson_content: cleanOptionalText(input.lessonContent),
      notes: cleanOptionalText(input.notes),
    })
    .eq("id", classSessionId)
    .eq("school_id", profile.schoolId);

  if (error) return { error: error.message };

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "class_session",
    entityId: classSessionId,
    action: "class_session_reflection_updated",
  });

  revalidatePath(`/attendance/${classSessionId}`);
  revalidatePath("/professor");
  revalidatePath("/professor/sessions");
  return {};
}

export async function saveAttendanceNote(
  attendanceId: string,
  classSessionId: string,
  note: string,
): Promise<TeacherActionResult> {
  const profile = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("attendances")
    .update({ student_notes: cleanOptionalText(note) })
    .eq("id", attendanceId)
    .eq("school_id", profile.schoolId);

  if (error) return { error: error.message };

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "attendance",
    entityId: attendanceId,
    action: "attendance_note_updated",
    changes: { classSessionId },
  });

  revalidatePath(`/attendance/${classSessionId}`);
  revalidatePath("/professor");
  return {};
}

export async function suggestGraduation(
  studentId: string,
  input: { suggestedBeltId: string; suggestedDegree: number; notes: string },
): Promise<TeacherActionResult> {
  const profile = await requireUser();
  const suggestedDegree = Number(input.suggestedDegree);

  if (!input.suggestedBeltId) {
    return { error: "Escolha a faixa sugerida." };
  }

  if (!Number.isInteger(suggestedDegree) || suggestedDegree < 0 || suggestedDegree > 4) {
    return { error: "Informe um grau entre 0 e 4." };
  }

  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("id, current_belt_id, current_degree")
    .eq("id", studentId)
    .eq("school_id", profile.schoolId)
    .single();

  if (!student) return { error: "Aluno nao encontrado." };

  const { data: existingSuggestion } = await supabase
    .from("graduation_suggestions")
    .select("id")
    .eq("student_id", studentId)
    .eq("status", "pending")
    .maybeSingle();

  if (existingSuggestion) {
    return { error: "Este aluno ja tem uma sugestao de graduacao pendente." };
  }

  const teacherId = await getTeacherIdByEmail(profile.email);
  const { error } = await supabase.from("graduation_suggestions").insert({
    school_id: profile.schoolId,
    student_id: studentId,
    suggested_by_teacher_id: teacherId,
    current_belt_id: student.current_belt_id,
    current_degree: student.current_degree,
    suggested_belt_id: input.suggestedBeltId,
    suggested_degree: suggestedDegree,
    notes: cleanOptionalText(input.notes),
  });

  if (error) return { error: error.message };

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "student",
    entityId: studentId,
    action: "graduation_suggested",
    changes: {
      suggestedBeltId: input.suggestedBeltId,
      suggestedDegree,
    },
  });

  revalidatePath(`/professor/students/${studentId}`);
  revalidatePath("/professor");
  return {};
}
