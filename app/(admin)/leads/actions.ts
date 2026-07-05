"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { leadSchema, type LeadInput } from "@/lib/validations/lead";
import { logAuditEvent } from "@/modules/audit/log";

export type LeadActionResult = { error?: string };

export async function createLead(input: LeadInput): Promise<LeadActionResult> {
  const profile = await requireRole("admin");
  const parsed = leadSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("leads").insert({
    school_id: profile.schoolId,
    name: parsed.data.name,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    source: parsed.data.source || null,
    status: parsed.data.status,
    notes: parsed.data.notes || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/leads");
  return {};
}

export async function updateLead(
  id: string,
  input: LeadInput,
): Promise<LeadActionResult> {
  await requireRole("admin");
  const parsed = leadSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      source: parsed.data.source || null,
      status: parsed.data.status,
      notes: parsed.data.notes || null,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/leads");
  return {};
}

export async function convertLeadToStudent(
  leadId: string,
): Promise<LeadActionResult> {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, name, phone, email, converted_student_id")
    .eq("id", leadId)
    .single();

  if (leadError || !lead) {
    return { error: "Lead não encontrado" };
  }

  if (lead.converted_student_id) {
    return { error: "Este lead já foi convertido em aluno" };
  }

  const { data: unit } = await supabase
    .from("units")
    .select("id")
    .eq("school_id", profile.schoolId)
    .limit(1)
    .single();

  if (!unit) {
    return { error: "Nenhuma unidade encontrada para a escola" };
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .insert({
      school_id: profile.schoolId,
      unit_id: unit.id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      status: "ativo",
    })
    .select("id")
    .single();

  if (studentError || !student) {
    return { error: studentError?.message ?? "Não foi possível criar o aluno" };
  }

  const { error: updateError } = await supabase
    .from("leads")
    .update({ status: "matriculado", converted_student_id: student.id })
    .eq("id", leadId);

  if (updateError) {
    return { error: updateError.message };
  }

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "lead",
    entityId: leadId,
    action: "lead_converted",
    changes: { studentId: student.id },
  });

  revalidatePath("/leads");
  redirect(`/students/${student.id}/edit`);
}
