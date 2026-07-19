"use server";

import { revalidatePath } from "next/cache";
import { requireStudent } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { listMedalEventOptions, type MedalEventOption } from "@/modules/medals/events";
import { MEDAL_LEVELS, type MedalLevel } from "@/modules/medals/points";
import type { MedalLaunchFormInput } from "@/lib/validations/medal-launch";

export type MedalStatus = "pending" | "approved" | "rejected";

export type MyMedal = {
  id: string;
  eventName: string;
  eventDate: string;
  organization: string | null;
  modalityName: string | null;
  category: string | null;
  level: MedalLevel;
  proofUrl: string | null;
  status: MedalStatus;
  rejectionReason: string | null;
  createdAt: string;
};

export type MyMedalDetail = {
  id: string;
  eventId: string;
  modalityId: string | null;
  category: string | null;
  level: MedalLevel;
  proofUrl: string | null;
  status: MedalStatus;
};

export type MedalLaunchFormData = {
  events: MedalEventOption[];
  modalities: { id: string; name: string }[];
};

export type MedalLaunchActionResult = { error?: string };

/**
 * Dados para o formulário de lançamento (12.4): catálogo de eventos
 * (aluno sempre escolhe um existente, decisão 1 da Fase 12) + modalidades
 * da própria escola.
 */
export async function getMedalLaunchFormData(): Promise<MedalLaunchFormData> {
  const profile = await requireStudent();
  const supabase = await createClient();

  const [events, { data: modalities }] = await Promise.all([
    listMedalEventOptions(profile.schoolId),
    supabase
      .from("modalities")
      .select("id, name")
      .eq("school_id", profile.schoolId)
      .order("name"),
  ]);

  return { events, modalities: modalities ?? [] };
}

export async function getMyMedals(): Promise<MyMedal[]> {
  const profile = await requireStudent();
  const supabase = await createClient();

  const { data } = await supabase
    .from("medals")
    .select(
      "id, category, level, proof_url, status, rejection_reason, created_at, modalities(name), medal_events(name, event_date, organization)",
    )
    .eq("student_id", profile.id)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    eventName: row.medal_events?.name ?? "",
    eventDate: row.medal_events?.event_date ?? "",
    organization: row.medal_events?.organization ?? null,
    modalityName: row.modalities?.name ?? null,
    category: row.category,
    level: row.level as MedalLevel,
    proofUrl: row.proof_url,
    status: row.status as MedalStatus,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
  }));
}

/** Só retorna o registro se ainda for editável (`pending`/`rejected`) — uma medalha aprovada nunca é editada (decisão 11 da Fase 12). */
export async function getMyMedalForEdit(id: string): Promise<MyMedalDetail | null> {
  const profile = await requireStudent();
  const supabase = await createClient();

  const { data } = await supabase
    .from("medals")
    .select("id, event_id, modality_id, category, level, proof_url, status")
    .eq("id", id)
    .eq("student_id", profile.id)
    .single();

  if (!data) return null;
  if (data.status === "approved") return null;

  return {
    id: data.id,
    eventId: data.event_id,
    modalityId: data.modality_id,
    category: data.category,
    level: data.level as MedalLevel,
    proofUrl: data.proof_url,
    status: data.status as MedalStatus,
  };
}

function validateLaunchInput(input: MedalLaunchFormInput): string | null {
  if (!input.eventId) return "Selecione um evento";
  if (!(MEDAL_LEVELS as readonly string[]).includes(input.level)) return "Nível inválido";
  return null;
}

export async function launchMedal(
  input: MedalLaunchFormInput,
): Promise<MedalLaunchActionResult> {
  const profile = await requireStudent();
  const validationError = validateLaunchInput(input);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const { error } = await supabase.from("medals").insert({
    school_id: profile.schoolId,
    student_id: profile.id,
    event_id: input.eventId,
    modality_id: input.modalityId || null,
    category: input.category?.trim() || null,
    level: input.level,
    proof_url: input.proofUrl?.trim() || null,
    status: "pending",
    submitted_by_student_id: profile.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/aluno/medalhas");
  return {};
}

/**
 * Edição de um lançamento pendente/rejeitado sempre volta o registro para
 * `pending` e limpa a decisão anterior (decisão 6 da Fase 12) — os campos
 * de revisão precisam ser explicitamente zerados aqui porque a policy de
 * RLS de update do aluno exige `reviewed_by_user_id`/`reviewed_at` nulos
 * no estado pós-update, e um lançamento rejeitado chega aqui com os dois
 * preenchidos pela análise anterior.
 */
export async function updateMyMedal(
  id: string,
  input: MedalLaunchFormInput,
): Promise<MedalLaunchActionResult> {
  const profile = await requireStudent();
  const validationError = validateLaunchInput(input);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("medals")
    .update({
      event_id: input.eventId,
      modality_id: input.modalityId || null,
      category: input.category?.trim() || null,
      level: input.level,
      proof_url: input.proofUrl?.trim() || null,
      status: "pending",
      rejection_reason: null,
      reviewed_by_user_id: null,
      reviewed_at: null,
    })
    .eq("id", id)
    .eq("student_id", profile.id);

  if (error) return { error: error.message };

  revalidatePath("/aluno/medalhas");
  return {};
}
