"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/modules/audit/log";
import { MEDAL_LEVELS } from "@/modules/medals/points";

export type MedalPointsActionResult = { error?: string };

export async function updateMedalPointRules(
  values: { level: string; points: number }[],
): Promise<MedalPointsActionResult> {
  const profile = await requireRole("admin");

  for (const value of values) {
    if (!(MEDAL_LEVELS as readonly string[]).includes(value.level)) {
      return { error: "Nível inválido" };
    }
    if (!Number.isInteger(value.points) || value.points < 0) {
      return { error: "Pontos devem ser um número inteiro maior ou igual a zero" };
    }
  }

  const supabase = await createClient();

  for (const value of values) {
    const { error } = await supabase
      .from("medal_point_rules")
      .update({ points: value.points })
      .eq("school_id", profile.schoolId)
      .eq("level", value.level);

    if (error) return { error: error.message };
  }

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "medal_point_rules",
    entityId: profile.schoolId,
    action: "medal_points_updated",
    changes: { values },
  });

  revalidatePath("/medals/points");
  return {};
}
