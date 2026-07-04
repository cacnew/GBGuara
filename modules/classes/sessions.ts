"use server";

import { requireUser } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export type OpenClassSessionResult = { sessionId?: string; error?: string };

/**
 * Abre a sessão de hoje de uma turma, ou reaproveita se já existir
 * (constraint unique(class_group_id, date)) — usado tanto pelo admin
 * quanto pelo professor a partir da tela "Turmas do dia" (Fase 3.3).
 */
export async function openOrReuseClassSession(
  classGroupId: string,
): Promise<OpenClassSessionResult> {
  const profile = await requireUser();
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from("class_sessions")
    .select("id")
    .eq("class_group_id", classGroupId)
    .eq("date", today)
    .maybeSingle();

  if (existing) {
    return { sessionId: existing.id };
  }

  const { data: created, error } = await supabase
    .from("class_sessions")
    .insert({
      school_id: profile.schoolId,
      class_group_id: classGroupId,
      date: today,
    })
    .select("id")
    .single();

  if (error?.code === "23505") {
    // Corrida entre duas aberturas simultâneas da mesma turma/dia —
    // a constraint unique(class_group_id, date) já garantiu que só uma
    // foi criada; busca essa.
    const { data: raceWinner } = await supabase
      .from("class_sessions")
      .select("id")
      .eq("class_group_id", classGroupId)
      .eq("date", today)
      .single();

    if (raceWinner) return { sessionId: raceWinner.id };
  }

  if (error || !created) {
    return { error: error?.message ?? "Não foi possível abrir a sessão" };
  }

  return { sessionId: created.id };
}
