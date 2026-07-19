import { createClient } from "@/lib/supabase/server";
import type { MedalLevel } from "@/modules/medals/points";

export type ApprovedMedalDisplay = {
  id: string;
  eventName: string;
  eventDate: string;
  organization: string | null;
  modalityName: string | null;
  category: string | null;
  level: MedalLevel;
  proofUrl: string | null;
  launchedByLabel: string;
  reviewedByName: string | null;
};

/**
 * Histórico de medalhas **aprovadas** de um aluno (decisão 11 da Fase 12 —
 * registro oficial de conquistas no dossiê/ficha, não a fila de gestão das
 * Fases 12.4/12.5). Reaproveitada sem alteração no dossiê do admin, na
 * ficha do professor e no dossiê do próprio aluno (mesmo padrão de
 * `InternalNotesSection`, Fase 10.7).
 */
export async function getApprovedMedalsForStudent(
  studentId: string,
  schoolId: string,
): Promise<ApprovedMedalDisplay[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("medals")
    .select(
      "id, category, level, proof_url, submitted_by_student_id, medal_events(name, event_date, organization), modalities(name), submitted_by:users!medals_submitted_by_user_id_fkey(name), reviewer:users!medals_reviewed_by_user_id_fkey(name)",
    )
    .eq("student_id", studentId)
    .eq("school_id", schoolId)
    .eq("status", "approved")
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
    launchedByLabel: row.submitted_by_student_id
      ? "Lançado pelo aluno"
      : `Lançado por ${row.submitted_by?.name ?? "equipe"}`,
    reviewedByName: row.reviewer?.name ?? null,
  }));
}
