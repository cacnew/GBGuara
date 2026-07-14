"use server";

import { randomInt } from "node:crypto";
import { requireRole } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

export type ResetStudentPasswordResult = { error?: string; tempPassword?: string };

const TEMP_PASSWORD_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

function generateTempPassword(length = 12): string {
  let password = "";
  for (let i = 0; i < length; i++) {
    password += TEMP_PASSWORD_CHARS[randomInt(TEMP_PASSWORD_CHARS.length)];
  }
  return password;
}

export async function resetStudentPassword(
  studentId: string,
): Promise<ResetStudentPasswordResult> {
  const adminProfile = await requireRole("admin");
  const admin = createAdminClient();

  const { data: student, error: studentError } = await admin
    .from("students")
    .select("id, name, auth_user_id")
    .eq("id", studentId)
    .eq("school_id", adminProfile.schoolId)
    .single();

  if (studentError || !student) {
    return { error: "Aluno não encontrado" };
  }

  if (!student.auth_user_id) {
    return { error: "Este aluno ainda não possui login" };
  }

  const tempPassword = generateTempPassword();

  const { error: authError } = await admin.auth.admin.updateUserById(
    student.auth_user_id,
    { password: tempPassword },
  );

  if (authError) {
    return { error: authError.message };
  }

  const { error: updateError } = await admin
    .from("students")
    .update({ must_change_password: true })
    .eq("id", studentId);

  if (updateError) {
    return { error: updateError.message };
  }

  await admin.from("audit_logs").insert({
    school_id: adminProfile.schoolId,
    user_id: adminProfile.id,
    entity_type: "student",
    entity_id: studentId,
    action: "student_password_reset",
  });

  return { tempPassword };
}
