"use server";

import { requireStudent } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

export async function clearMustChangePassword(): Promise<void> {
  const profile = await requireStudent();
  const admin = createAdminClient();

  await admin
    .from("students")
    .update({ must_change_password: false })
    .eq("id", profile.id);
}

export async function updateStudentPhoto(photoUrl: string): Promise<void> {
  const profile = await requireStudent();
  const admin = createAdminClient();

  await admin
    .from("students")
    .update({ photo_url: photoUrl })
    .eq("id", profile.id);
}
