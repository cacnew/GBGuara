"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/modules/audit/log";
import type { WeeklyPositionFormInput } from "@/lib/validations/weekly-position";

export type WeeklyPositionSummary = {
  id: string;
  title: string;
  startDate: string;
  endDate: string | null;
  published: boolean;
  authorName: string | null;
};

export type WeeklyPositionDetail = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  youtubeUrl: string | null;
  startDate: string;
  endDate: string | null;
  published: boolean;
};

export type WeeklyPositionActionResult = { error?: string; id?: string };

/**
 * Cadastro (menu "Conteúdo") é gerenciado por qualquer staff (admin OU
 * professor) — as duas telas (`(admin)/content/weekly-positions` e
 * `(teacher)/professor/content/weekly-positions`) reaproveitam exatamente
 * estas funções, mesmo padrão de `modules/medals/events.ts`.
 */
function revalidatePositionPaths() {
  revalidatePath("/content/weekly-positions");
  revalidatePath("/professor/content/weekly-positions");
}

export async function getWeeklyPositions(): Promise<WeeklyPositionSummary[]> {
  const profile = await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("weekly_positions")
    .select("id, title, start_date, end_date, published, users(name)")
    .eq("school_id", profile.schoolId)
    .order("start_date", { ascending: false });

  return (data ?? []).map((position) => ({
    id: position.id,
    title: position.title,
    startDate: position.start_date,
    endDate: position.end_date,
    published: position.published,
    authorName: position.users?.name ?? null,
  }));
}

export async function getWeeklyPosition(id: string): Promise<WeeklyPositionDetail | null> {
  const profile = await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("weekly_positions")
    .select("id, title, description, image_url, youtube_url, start_date, end_date, published")
    .eq("id", id)
    .eq("school_id", profile.schoolId)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    imageUrl: data.image_url,
    youtubeUrl: data.youtube_url,
    startDate: data.start_date,
    endDate: data.end_date,
    published: data.published,
  };
}

/**
 * Regra "somente uma posição ativa por vez" (Fase 14, spec): ao publicar
 * uma posição, qualquer outra posição publicada da mesma escola é
 * desativada antes. Mesmo padrão já usado em `endContract`
 * (`modules/finance/contract-actions.ts`, Fase 5.4/7.9) para "apenas um
 * contrato ativo por aluno" — chamadas sequenciais na mesma server action,
 * não uma transação de banco de fato.
 */
async function deactivateOtherPublishedPositions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  schoolId: string,
  keepId?: string,
) {
  let query = supabase
    .from("weekly_positions")
    .update({ published: false })
    .eq("school_id", schoolId)
    .eq("published", true);

  if (keepId) query = query.neq("id", keepId);

  await query;
}

export async function createWeeklyPosition(
  input: WeeklyPositionFormInput,
): Promise<WeeklyPositionActionResult> {
  const profile = await requireUser();
  const supabase = await createClient();

  if (input.published) {
    await deactivateOtherPublishedPositions(supabase, profile.schoolId);
  }

  const { data: position, error } = await supabase
    .from("weekly_positions")
    .insert({
      school_id: profile.schoolId,
      title: input.title,
      description: input.description,
      image_url: input.imageUrl,
      youtube_url: input.youtubeUrl || null,
      start_date: input.startDate,
      end_date: input.endDate || null,
      published: input.published,
      created_by_user_id: profile.id,
    })
    .select("id")
    .single();

  if (error || !position) {
    return { error: error?.message ?? "Não foi possível criar a posição da semana" };
  }

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "weekly_position",
    entityId: position.id,
    action: "weekly_position_created",
  });

  revalidatePositionPaths();
  return { id: position.id };
}

export async function updateWeeklyPosition(
  id: string,
  input: WeeklyPositionFormInput,
): Promise<WeeklyPositionActionResult> {
  const profile = await requireUser();
  const supabase = await createClient();

  if (input.published) {
    await deactivateOtherPublishedPositions(supabase, profile.schoolId, id);
  }

  const { error } = await supabase
    .from("weekly_positions")
    .update({
      title: input.title,
      description: input.description,
      image_url: input.imageUrl,
      youtube_url: input.youtubeUrl || null,
      start_date: input.startDate,
      end_date: input.endDate || null,
      published: input.published,
    })
    .eq("id", id)
    .eq("school_id", profile.schoolId);

  if (error) {
    return { error: error.message };
  }

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "weekly_position",
    entityId: id,
    action: "weekly_position_updated",
  });

  revalidatePositionPaths();
  return { id };
}
