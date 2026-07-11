"use server";

import { requireRole } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createStudentLoginSchema,
  type CreateStudentLoginInput,
} from "@/lib/validations/create-student-login";

export type CreateStudentLoginResult = { error?: string };

export async function createStudentLogin(
  studentId: string,
  input: CreateStudentLoginInput,
): Promise<CreateStudentLoginResult> {
  const adminProfile = await requireRole("admin");

  const parsed = createStudentLoginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { email, password } = parsed.data;
  const admin = createAdminClient();

  const { data: student, error: studentError } = await admin
    .from("students")
    .select("id, auth_user_id")
    .eq("id", studentId)
    .eq("school_id", adminProfile.schoolId)
    .single();

  if (studentError || !student) {
    return { error: "Aluno não encontrado" };
  }

  if (student.auth_user_id) {
    return { error: "Este aluno já possui login" };
  }

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "Não foi possível criar o usuário" };
  }

  const { error: updateError } = await admin
    .from("students")
    .update({ auth_user_id: authData.user.id })
    .eq("id", studentId);

  if (updateError) {
    // Evita deixar um auth.users órfão sem vínculo com o aluno.
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: updateError.message };
  }

  await admin.from("audit_logs").insert({
    school_id: adminProfile.schoolId,
    user_id: adminProfile.id,
    entity_type: "student",
    entity_id: studentId,
    action: "student_login_created",
  });

  return {};
}
