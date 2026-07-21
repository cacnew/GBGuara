"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/modules/audit/log";
import { isValidRequiredClasses } from "@/modules/graduation/requirements";

export type GraduationRequirementsActionResult = { error?: string };

export type GraduationRequirementInput = {
  beltSystemId: string;
  fromBeltId: string;
  toBeltId: string;
  requiredClasses: number;
};

/**
 * Salva uma única transição por chamada (não o lote inteiro) — a tela
 * salva cada campo imediatamente ao perder o foco (critério de pronto da
 * Fase 13.1: "os valores devem ser salvos imediatamente"), em vez de
 * exigir um botão "Salvar" geral.
 */
export async function updateBeltGraduationRequirement(
  value: GraduationRequirementInput,
): Promise<GraduationRequirementsActionResult> {
  const profile = await requireRole("admin");

  if (!isValidRequiredClasses(value.requiredClasses)) {
    return { error: "Nº de aulas deve ser um número inteiro maior ou igual a zero" };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("belt_graduation_requirements").upsert(
    {
      school_id: profile.schoolId,
      belt_system_id: value.beltSystemId,
      from_belt_id: value.fromBeltId,
      to_belt_id: value.toBeltId,
      required_classes: value.requiredClasses,
    },
    { onConflict: "belt_system_id,from_belt_id" },
  );

  if (error) return { error: error.message };

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "belt_graduation_requirements",
    entityId: value.toBeltId,
    action: "belt_graduation_requirement_updated",
    changes: { value },
  });

  revalidatePath("/graduation/settings");
  return {};
}
