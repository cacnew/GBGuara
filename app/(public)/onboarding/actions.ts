"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { onboardingSchema, type OnboardingInput } from "@/lib/validations/onboarding";

export type OnboardingResult = { error?: string };

export async function onboardSchool(
  input: OnboardingInput,
): Promise<OnboardingResult> {
  const parsed = onboardingSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { schoolName, adminName, adminEmail, adminPassword } = parsed.data;
  const admin = createAdminClient();

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "Não foi possível criar o usuário" };
  }

  const { error: dbError } = await admin.rpc("create_school_with_admin", {
    p_school_name: schoolName,
    p_auth_user_id: authData.user.id,
    p_admin_name: adminName,
    p_admin_email: adminEmail,
  });

  if (dbError) {
    // Evita deixar um auth.users órfão (sem perfil de aplicação) caso a
    // criação da escola/admin no banco falhe.
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: dbError.message };
  }

  return {};
}
