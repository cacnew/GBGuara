"use client";

import { useRouter } from "next/navigation";
import { ChangePasswordForm } from "@/app/(student)/aluno/perfil/change-password-form";
import { clearMustChangePassword } from "@/modules/students/account-actions";

export function NovaSenhaClient() {
  const router = useRouter();

  async function handleSuccess() {
    await clearMustChangePassword();
    router.push("/aluno");
  }

  return <ChangePasswordForm onSuccess={handleSuccess} submitLabel="Definir nova senha" />;
}
