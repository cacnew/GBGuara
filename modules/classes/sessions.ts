"use server";

import { revalidatePath } from "next/cache";
import { requireUser, requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateClassSession } from "./session-materialization";

export type OpenClassSessionResult = { sessionId?: string; error?: string };
export type ClassSessionActionResult = { error?: string };

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

  return getOrCreateClassSession({
    supabase,
    schoolId: profile.schoolId,
    classGroupId,
    date: today,
  });
}

/**
 * Abre uma sessão avulsa (status "extra"), fora da grade fixa — ex: Open
 * Mat num dia que não está no week_days da turma. Ainda respeita
 * unique(class_group_id, date): não é possível abrir uma segunda sessão
 * da mesma turma no mesmo dia (nem normal nem extra).
 */
export async function createExtraClassSession(
  classGroupId: string,
  date: string,
): Promise<OpenClassSessionResult> {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data: created, error } = await supabase
    .from("class_sessions")
    .insert({
      school_id: profile.schoolId,
      class_group_id: classGroupId,
      date,
      status: "extra",
    })
    .select("id")
    .single();

  if (error || !created) {
    return { error: error?.message ?? "Não foi possível abrir a sessão extra" };
  }

  revalidatePath("/classes/sessions");
  return { sessionId: created.id };
}

/**
 * Cancela uma sessão futura já aberta (agendada ou extra). Sessões já
 * realizadas não devem ser canceladas.
 */
export async function cancelClassSession(
  sessionId: string,
): Promise<ClassSessionActionResult> {
  await requireRole("admin");
  const supabase = await createClient();

  const { error } = await supabase
    .from("class_sessions")
    .update({ status: "cancelada" })
    .eq("id", sessionId)
    .in("status", ["agendada", "extra"]);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/classes/sessions");
  return {};
}
