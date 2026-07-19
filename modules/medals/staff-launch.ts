"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/modules/audit/log";
import { listMedalEventOptions, type MedalEventOption } from "@/modules/medals/events";
import { MEDAL_LEVELS } from "@/modules/medals/points";

export type StaffMedalLaunchFormData = {
  events: MedalEventOption[];
  modalities: { id: string; name: string }[];
};

export type StaffMedalLaunchInput = {
  eventId: string;
  modalityId: string;
  category: string;
  level: string;
  proofUrl: string;
};

export type StaffMedalLaunchActionResult = { error?: string };

export async function getStaffMedalLaunchFormData(): Promise<StaffMedalLaunchFormData> {
  const profile = await requireUser();
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

/**
 * Lançamento em nome de um aluno (12.6): nasce direto `approved` (decisão
 * 8 da Fase 12) — quem lança é a mesma autoridade que aprovaria, então não
 * passa pela fila de aprovação da 12.5.
 */
export async function launchMedalForStudent(
  studentId: string,
  input: StaffMedalLaunchInput,
): Promise<StaffMedalLaunchActionResult> {
  const profile = await requireUser();

  if (!input.eventId) return { error: "Selecione um evento" };
  if (!(MEDAL_LEVELS as readonly string[]).includes(input.level)) {
    return { error: "Nível inválido" };
  }

  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("id", studentId)
    .eq("school_id", profile.schoolId)
    .single();

  if (!student) return { error: "Aluno não encontrado" };

  const now = new Date().toISOString();
  const { error } = await supabase.from("medals").insert({
    school_id: profile.schoolId,
    student_id: studentId,
    event_id: input.eventId,
    modality_id: input.modalityId || null,
    category: input.category.trim() || null,
    level: input.level,
    proof_url: input.proofUrl.trim() || null,
    status: "approved",
    submitted_by_user_id: profile.id,
    reviewed_by_user_id: profile.id,
    reviewed_at: now,
  });

  if (error) return { error: error.message };

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "medal",
    entityId: studentId,
    action: "medal_launched_by_staff",
  });

  revalidatePath(`/students/${studentId}/dossie`);
  revalidatePath(`/professor/students/${studentId}`);
  revalidatePath("/aluno/medalhas");
  revalidatePath("/aluno/ranking");
  revalidatePath("/medals/ranking");
  revalidatePath("/professor/medals/ranking");

  return {};
}
