import { redirect } from "next/navigation";
import {
  getCurrentUserProfile,
  type CurrentUserProfile,
} from "@/modules/users/queries";

/**
 * Garante que existe um usuário autenticado com perfil de aplicação
 * (public.users) válido. Redireciona para /login caso contrário.
 * Use no início de qualquer Server Component/Action que exija login.
 */
export async function requireUser(): Promise<CurrentUserProfile> {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  return profile;
}

/**
 * Garante usuário autenticado E com o role exigido. Se autenticado mas
 * com o role errado, faz bounce para a área correta em vez de erro —
 * mesmo comportamento dos layouts de (admin)/(teacher) (Fase 1.6).
 */
export async function requireRole(
  role: CurrentUserProfile["role"],
): Promise<CurrentUserProfile> {
  const profile = await requireUser();

  if (profile.role !== role) {
    redirect(role === "admin" ? "/professor" : "/dashboard");
  }

  return profile;
}

/**
 * Confirma que um `school_id` recebido de um formulário/parâmetro
 * pertence à escola do usuário autenticado, antes de qualquer operação
 * sensível (evita um usuário de uma escola manipular dados de outra
 * mesmo que a RLS já bloqueie no banco — falha rápido na aplicação).
 */
export async function requireSameSchool(schoolId: string): Promise<CurrentUserProfile> {
  const profile = await requireUser();

  if (profile.schoolId !== schoolId) {
    throw new Error("school_id não pertence ao usuário autenticado");
  }

  return profile;
}
