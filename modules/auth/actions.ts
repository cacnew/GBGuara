"use server";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseServerUrl } from "@/lib/supabase/url";

/**
 * Resolve para onde redirecionar depois de um login bem-sucedido, a
 * partir do access token retornado pelo próprio `signInWithPassword`
 * (Fase 9.1: nem toda conta autenticada tem uma linha em `public.users`
 * — aluno se autentica via `students.auth_user_id`). Recebe o token
 * explicitamente (em vez de um client baseado em cookies) para validar
 * direto contra o Auth API, sem depender de nenhum estado implícito.
 */
export async function resolveLoginDestination(accessToken: string): Promise<string> {
  const supabase = createClient<Database>(
    getSupabaseServerUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser(accessToken);

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
