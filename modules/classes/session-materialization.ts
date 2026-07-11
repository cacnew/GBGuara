import { createClient } from "@/lib/supabase/server";

export type MaterializeSessionResult = { sessionId?: string; error?: string };

/**
 * Garante que existe uma `class_session` para essa turma/data, criando-a
 * se necessário — materialização sob demanda (Fase 9.3): evita gerar
 * milhares de linhas ociosas para o ano inteiro de vigência da turma.
 * Idempotente: chamadas concorrentes para a mesma turma/data resolvem
 * para a mesma sessão via `unique(class_group_id, date)`.
 *
 * Não faz nenhuma checagem de autorização/tenant nem de recorrência
 * (week_days/vigência) — quem chama já deve ter resolvido `schoolId` a
 * partir de um perfil autenticado (staff ou aluno) e já deve saber que
 * essa turma roda nessa data antes de materializar.
 */
export async function getOrCreateClassSession(params: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  schoolId: string;
  classGroupId: string;
  date: string;
}): Promise<MaterializeSessionResult> {
  const { supabase, schoolId, classGroupId, date } = params;

  const { data: existing } = await supabase
    .from("class_sessions")
    .select("id")
    .eq("class_group_id", classGroupId)
    .eq("date", date)
    .maybeSingle();

  if (existing) {
    return { sessionId: existing.id };
  }

  const { data: created, error } = await supabase
    .from("class_sessions")
    .insert({ school_id: schoolId, class_group_id: classGroupId, date })
    .select("id")
    .single();

  if (error?.code === "23505") {
    // Corrida entre duas materializações simultâneas da mesma turma/dia —
    // a constraint unique(class_group_id, date) já garantiu que só uma
    // foi criada; busca essa.
    const { data: raceWinner } = await supabase
      .from("class_sessions")
      .select("id")
      .eq("class_group_id", classGroupId)
      .eq("date", date)
      .single();

    if (raceWinner) return { sessionId: raceWinner.id };
  }

  if (error || !created) {
    return { error: error?.message ?? "Não foi possível abrir a sessão" };
  }

  return { sessionId: created.id };
}
