"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { guardianSchema, type GuardianInput } from "@/lib/validations/guardian";
import { logAuditEvent } from "@/modules/audit/log";

export type GuardianActionResult = { error?: string };

async function clearPrimaryFlag(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string,
) {
  await supabase
    .from("student_guardians")
    .update({ is_primary: false })
    .eq("student_id", studentId);
}

export async function addGuardianToStudent(
  studentId: string,
  input: GuardianInput,
): Promise<GuardianActionResult> {
  const profile = await requireRole("admin");
  const parsed = guardianSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { data: guardian, error: guardianError } = await supabase
    .from("guardians")
    .insert({
      school_id: profile.schoolId,
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      document: parsed.data.document || null,
      relationship: parsed.data.relationship || null,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();

  if (guardianError || !guardian) {
    return { error: guardianError?.message ?? "Não foi possível criar o responsável" };
  }

  if (parsed.data.isPrimary) {
    await clearPrimaryFlag(supabase, studentId);
  }

  const { error: linkError } = await supabase.from("student_guardians").insert({
    school_id: profile.schoolId,
    student_id: studentId,
    guardian_id: guardian.id,
    is_primary: parsed.data.isPrimary,
    is_financial_responsible: parsed.data.isFinancialResponsible,
  });

  if (linkError) {
    return { error: linkError.message };
  }

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "student",
    entityId: studentId,
    action: "guardian_added",
    changes: { guardianId: guardian.id },
  });

  revalidatePath(`/students/${studentId}/edit`);
  return {};
}

export async function updateGuardianLink(
  linkId: string,
  studentId: string,
  data: { isPrimary: boolean; isFinancialResponsible: boolean },
): Promise<GuardianActionResult> {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  if (data.isPrimary) {
    await clearPrimaryFlag(supabase, studentId);
  }

  const { error } = await supabase
    .from("student_guardians")
    .update({
      is_primary: data.isPrimary,
      is_financial_responsible: data.isFinancialResponsible,
    })
    .eq("id", linkId);

  if (error) {
    return { error: error.message };
  }

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "student",
    entityId: studentId,
    action: "guardian_link_updated",
    changes: data,
  });

  revalidatePath(`/students/${studentId}/edit`);
  return {};
}

export async function removeGuardianLink(
  linkId: string,
  studentId: string,
): Promise<GuardianActionResult> {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("student_guardians")
    .delete()
    .eq("id", linkId);

  if (error) {
    return { error: error.message };
  }

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "student",
    entityId: studentId,
    action: "guardian_removed",
    changes: { linkId },
  });

  revalidatePath(`/students/${studentId}/edit`);
  return {};
}
