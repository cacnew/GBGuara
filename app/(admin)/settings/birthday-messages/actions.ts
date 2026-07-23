"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/modules/audit/log";
import {
  birthdayMessageSettingsSchema,
  type BirthdayMessageSettingsInput,
} from "@/lib/validations/birthday-messages";

export type BirthdayMessageSettingsActionResult = { error?: string };

export async function updateBirthdayMessageSettings(
  input: BirthdayMessageSettingsInput,
): Promise<BirthdayMessageSettingsActionResult> {
  const profile = await requireRole("admin");
  const parsed = birthdayMessageSettingsSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("birthday_message_settings").upsert(
    {
      school_id: profile.schoolId,
      notify_students: parsed.data.notifyStudents,
      notify_teachers: parsed.data.notifyTeachers,
      enabled: parsed.data.enabled,
      message_template: parsed.data.messageTemplate,
    },
    { onConflict: "school_id" },
  );

  if (error) {
    return { error: error.message };
  }

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "birthday_message_settings",
    entityId: profile.schoolId,
    action: "birthday_message_settings_updated",
  });

  revalidatePath("/settings/birthday-messages");
  return {};
}
