"use server";

import { requireRole } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createTeacherLoginSchema,
  type CreateTeacherLoginInput,
} from "@/lib/validations/create-teacher-login";

export type CreateTeacherLoginResult = { error?: string };

export async function createTeacherLogin(
  input: CreateTeacherLoginInput,
): Promise<CreateTeacherLoginResult> {
  const adminProfile = await requireRole("admin");

  const parsed = createTeacherLoginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { name, email, password } = parsed.data;
  const admin = createAdminClient();

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "Não foi possível criar o usuário" };
  }

  const { data: newUser, error: dbError } = await admin
    .from("users")
    .insert({
      school_id: adminProfile.schoolId,
      auth_user_id: authData.user.id,
      name,
      email,
      role: "teacher",
    })
    .select("id")
    .single();

  if (dbError || !newUser) {
    // Evita deixar um auth.users órfão sem perfil de aplicação.
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: dbError?.message ?? "Não foi possível criar o usuário" };
  }

  await admin.from("audit_logs").insert({
    school_id: adminProfile.schoolId,
    user_id: adminProfile.id,
    entity_type: "user",
    entity_id: newUser.id,
    action: "teacher_login_created",
  });

  return {};
}
