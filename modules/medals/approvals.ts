"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/modules/audit/log";
import type { MedalLevel } from "@/modules/medals/points";

export type PendingMedal = {
  id: string;
  studentId: string;
  studentName: string;
  studentPhotoUrl: string | null;
  eventName: string;
  eventDate: string;
  level: MedalLevel;
  category: string | null;
  modalityName: string | null;
  proofUrl: string | null;
  submittedByStudent: boolean;
  createdAt: string;
};

export type MedalApprovalActionResult = { error?: string };

function revalidateApprovalPaths() {
  revalidatePath("/medals/approvals");
  revalidatePath("/professor/medals/approvals");
  revalidatePath("/aluno/medalhas");
  revalidatePath("/aluno/ranking");
  revalidatePath("/medals/ranking");
  revalidatePath("/professor/medals/ranking");
}

/**
 * Fila de aprovação (12.5): filtro por aluno é aplicado no client
 * (`ApprovalQueue`), mesmo padrão de busca client-side já usado em
 * `getAcademyData`/`academia-client.tsx` (Fase 9.9) — volume de pendentes
 * por escola é pequeno.
 */
export async function getPendingMedals(): Promise<PendingMedal[]> {
  const profile = await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("medals")
    .select(
      "id, category, level, proof_url, created_at, submitted_by_student_id, students!medals_student_id_fkey(id, name, photo_url), modalities(name), medal_events(name, event_date)",
    )
    .eq("school_id", profile.schoolId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    studentId: row.students?.id ?? "",
    studentName: row.students?.name ?? "",
    studentPhotoUrl: row.students?.photo_url ?? null,
    eventName: row.medal_events?.name ?? "",
    eventDate: row.medal_events?.event_date ?? "",
    level: row.level as MedalLevel,
    category: row.category,
    modalityName: row.modalities?.name ?? null,
    proofUrl: row.proof_url,
    submittedByStudent: Boolean(row.submitted_by_student_id),
    createdAt: row.created_at,
  }));
}

export async function approveMedal(id: string): Promise<MedalApprovalActionResult> {
  const profile = await requireUser();
  const supabase = await createClient();

  const { data: medal } = await supabase
    .from("medals")
    .select("id, student_id, status, medal_events(name)")
    .eq("id", id)
    .eq("school_id", profile.schoolId)
    .single();

  if (!medal) return { error: "Lançamento não encontrado" };
  if (medal.status !== "pending") return { error: "Este lançamento já foi analisado" };

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("medals")
    .update({ status: "approved", reviewed_by_user_id: profile.id, reviewed_at: now })
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("notifications").insert({
    school_id: profile.schoolId,
    student_id: medal.student_id,
    type: "medal_approved",
    payload: { eventName: medal.medal_events?.name ?? "" },
  });

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "medal",
    entityId: id,
    action: "medal_approved",
  });

  revalidateApprovalPaths();
  return {};
}

export async function rejectMedal(
  id: string,
  reason: string,
): Promise<MedalApprovalActionResult> {
  const profile = await requireUser();

  if (!reason.trim()) return { error: "Informe o motivo da rejeição" };

  const supabase = await createClient();
  const { data: medal } = await supabase
    .from("medals")
    .select("id, student_id, status, medal_events(name)")
    .eq("id", id)
    .eq("school_id", profile.schoolId)
    .single();

  if (!medal) return { error: "Lançamento não encontrado" };
  if (medal.status !== "pending") return { error: "Este lançamento já foi analisado" };

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("medals")
    .update({
      status: "rejected",
      reviewed_by_user_id: profile.id,
      reviewed_at: now,
      rejection_reason: reason.trim(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("notifications").insert({
    school_id: profile.schoolId,
    student_id: medal.student_id,
    type: "medal_rejected",
    payload: { eventName: medal.medal_events?.name ?? "", reason: reason.trim() },
  });

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "medal",
    entityId: id,
    action: "medal_rejected",
    changes: { reason: reason.trim() },
  });

  revalidateApprovalPaths();
  return {};
}
