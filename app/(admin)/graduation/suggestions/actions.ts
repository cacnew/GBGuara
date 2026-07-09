"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/modules/audit/log";

export async function reviewGraduationSuggestion(
  suggestionId: string,
  status: "approved" | "rejected",
) {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { error } = await supabase
    .from("graduation_suggestions")
    .update({
      status,
      reviewed_by_user_id: profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", suggestionId)
    .eq("school_id", profile.schoolId);

  if (error) {
    return { error: error.message };
  }

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "graduation_suggestion",
    entityId: suggestionId,
    action: `graduation_suggestion_${status}`,
  });

  revalidatePath("/graduation/suggestions");
  return {};
}
