"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Resolve para onde redirecionar depois de um login bem-sucedido.
 * Necessário porque, a partir da Fase 9.1, nem toda conta autenticada tem
 * uma linha em `public.users` (aluno se autentica via
 * `students.auth_user_id`) — o antigo `router.push("/dashboard")` cego
 * dependia disso e quebraria (aluno ficaria preso em `/login`).
 */
export async function resolveLoginDestination(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "/login";

  const { data: staffProfile } = await supabase
    .from("users")
    .select("role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (staffProfile) {
    return staffProfile.role === "admin" ? "/dashboard" : "/professor";
  }

  const { data: studentProfile } = await supabase
    .from("students")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (studentProfile) {
    return "/aluno";
  }

  return "/login";
}
