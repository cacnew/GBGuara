"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/modules/audit/log";
import { MEDAL_LEVELS, type MedalLevel } from "@/modules/medals/points";

export type MedalEventSummary = {
  id: string;
  name: string;
  organization: string | null;
  eventDate: string;
  modalityName: string | null;
  hasMedals: boolean;
};

export type MedalEventDetail = {
  id: string;
  name: string;
  organization: string | null;
  eventDate: string;
  modalityId: string | null;
  pointOverrides: Partial<Record<MedalLevel, number>>;
};

export type MedalEventOption = {
  id: string;
  name: string;
  eventDate: string;
  organization: string | null;
};

export type MedalEventInput = {
  name: string;
  organization: string;
  eventDate: string;
  modalityId: string;
  points: Partial<Record<MedalLevel, string>>;
};

export type MedalEventActionResult = { error?: string; id?: string };

/**
 * Catálogo de eventos é gerenciado por qualquer staff (admin OU professor,
 * decisão 1 da Fase 12) — as duas telas (`(admin)/medals/events` e
 * `(teacher)/professor/medals/events`) reaproveitam exatamente estas
 * funções, mesmo padrão de `modules/students/internal-notes.ts`.
 */
function revalidateEventPaths() {
  revalidatePath("/medals/events");
  revalidatePath("/professor/medals/events");
}

export async function getMedalEvents(): Promise<MedalEventSummary[]> {
  const profile = await requireUser();
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("medal_events")
    .select("id, name, organization, event_date, modalities(name)")
    .eq("school_id", profile.schoolId)
    .order("event_date", { ascending: false });

  const { data: medalRows } = await supabase
    .from("medals")
    .select("event_id")
    .eq("school_id", profile.schoolId);

  const eventIdsWithMedals = new Set((medalRows ?? []).map((row) => row.event_id));

  return (events ?? []).map((event) => ({
    id: event.id,
    name: event.name,
    organization: event.organization,
    eventDate: event.event_date,
    modalityName: event.modalities?.name ?? null,
    hasMedals: eventIdsWithMedals.has(event.id),
  }));
}

/**
 * Opções para o seletor de evento do lançamento do aluno (12.4) e do
 * lançamento em nome de aluno pelo staff (12.6). Recebe `schoolId` em vez
 * de resolver o profile aqui dentro pelo mesmo motivo de
 * `modules/medals/points.ts`: é chamada tanto do lado staff quanto do lado
 * aluno, cada chamador já validou a própria sessão antes.
 */
export async function listMedalEventOptions(schoolId: string): Promise<MedalEventOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("medal_events")
    .select("id, name, event_date, organization")
    .eq("school_id", schoolId)
    .order("event_date", { ascending: false });

  return (data ?? []).map((event) => ({
    id: event.id,
    name: event.name,
    eventDate: event.event_date,
    organization: event.organization,
  }));
}

export async function getMedalEvent(id: string): Promise<MedalEventDetail | null> {
  const profile = await requireUser();
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("medal_events")
    .select("id, name, organization, event_date, modality_id")
    .eq("id", id)
    .eq("school_id", profile.schoolId)
    .single();

  if (!event) return null;

  const { data: overrides } = await supabase
    .from("medal_event_point_rules")
    .select("level, points")
    .eq("event_id", id);

  const pointOverrides: Partial<Record<MedalLevel, number>> = {};
  for (const override of overrides ?? []) {
    pointOverrides[override.level as MedalLevel] = override.points;
  }

  return {
    id: event.id,
    name: event.name,
    organization: event.organization,
    eventDate: event.event_date,
    modalityId: event.modality_id,
    pointOverrides,
  };
}

function parsePointOverrides(points: Partial<Record<MedalLevel, string>>) {
  const rows: { level: MedalLevel; points: number }[] = [];
  for (const level of MEDAL_LEVELS) {
    const raw = points[level];
    if (raw === undefined || raw === "") continue;
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(
        `Pontos de ${level} devem ser um número inteiro maior ou igual a zero`,
      );
    }
    rows.push({ level, points: value });
  }
  return rows;
}

export async function createMedalEvent(input: MedalEventInput): Promise<MedalEventActionResult> {
  const profile = await requireUser();

  if (!input.name.trim()) return { error: "Nome do evento é obrigatório" };
  if (!input.eventDate) return { error: "Data do evento é obrigatória" };

  let overrideRows: { level: MedalLevel; points: number }[];
  try {
    overrideRows = parsePointOverrides(input.points);
  } catch (error) {
    return { error: (error as Error).message };
  }

  const supabase = await createClient();
  const { data: event, error } = await supabase
    .from("medal_events")
    .insert({
      school_id: profile.schoolId,
      name: input.name.trim(),
      organization: input.organization.trim() || null,
      event_date: input.eventDate,
      modality_id: input.modalityId || null,
      created_by_user_id: profile.id,
    })
    .select("id")
    .single();

  if (error || !event) return { error: error?.message ?? "Não foi possível criar o evento" };

  if (overrideRows.length > 0) {
    const { error: overrideError } = await supabase.from("medal_event_point_rules").insert(
      overrideRows.map((row) => ({ event_id: event.id, level: row.level, points: row.points })),
    );
    if (overrideError) return { error: overrideError.message };
  }

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "medal_event",
    entityId: event.id,
    action: "medal_event_created",
  });

  revalidateEventPaths();
  return { id: event.id };
}

export async function updateMedalEvent(
  id: string,
  input: MedalEventInput,
): Promise<MedalEventActionResult> {
  const profile = await requireUser();

  if (!input.name.trim()) return { error: "Nome do evento é obrigatório" };
  if (!input.eventDate) return { error: "Data do evento é obrigatória" };

  let overrideRows: { level: MedalLevel; points: number }[];
  try {
    overrideRows = parsePointOverrides(input.points);
  } catch (error) {
    return { error: (error as Error).message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("medal_events")
    .update({
      name: input.name.trim(),
      organization: input.organization.trim() || null,
      event_date: input.eventDate,
      modality_id: input.modalityId || null,
    })
    .eq("id", id)
    .eq("school_id", profile.schoolId);

  if (error) return { error: error.message };

  // Reconciliação simples: evento tem no máximo 4 linhas de override
  // (1 por nível) — apagar e recriar a partir do formulário é mais simples
  // que fazer upsert seletivo e não tem custo real nesse volume.
  const { error: deleteError } = await supabase
    .from("medal_event_point_rules")
    .delete()
    .eq("event_id", id);
  if (deleteError) return { error: deleteError.message };

  if (overrideRows.length > 0) {
    const { error: insertError } = await supabase.from("medal_event_point_rules").insert(
      overrideRows.map((row) => ({ event_id: id, level: row.level, points: row.points })),
    );
    if (insertError) return { error: insertError.message };
  }

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "medal_event",
    entityId: id,
    action: "medal_event_updated",
  });

  revalidateEventPaths();
  return { id };
}

/**
 * Evento sem lançamentos pode ser removido livremente; evento com
 * medalhas vinculadas só pode ser editado (critério de pronto da 12.3) —
 * a FK `medals.event_id` já é `on delete restrict` no banco, esta checagem
 * só existe para devolver uma mensagem amigável antes de tentar.
 */
export async function deleteMedalEvent(id: string): Promise<MedalEventActionResult> {
  const profile = await requireUser();
  const supabase = await createClient();

  const { count } = await supabase
    .from("medals")
    .select("id", { count: "exact", head: true })
    .eq("event_id", id);

  if (count && count > 0) {
    return { error: "Este evento já tem medalhas lançadas e não pode ser removido." };
  }

  const { error } = await supabase
    .from("medal_events")
    .delete()
    .eq("id", id)
    .eq("school_id", profile.schoolId);

  if (error) return { error: error.message };

  revalidateEventPaths();
  return {};
}
