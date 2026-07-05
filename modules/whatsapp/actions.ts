"use server";

import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/evolution/client";
import { logAuditEvent } from "@/modules/audit/log";

export type SendWhatsAppResult = { error?: string };

export async function sendWhatsAppToStudent(
  studentId: string,
  message: string,
): Promise<SendWhatsAppResult> {
  const profile = await requireRole("admin");

  if (!message.trim()) {
    return { error: "Escreva uma mensagem antes de enviar." };
  }

  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("id, phone")
    .eq("id", studentId)
    .single();

  if (!student?.phone) {
    return { error: "Este aluno não tem telefone cadastrado." };
  }

  const result = await sendWhatsAppMessage({
    schoolId: profile.schoolId,
    phone: student.phone,
    text: message,
  });

  if (result.error) {
    return result;
  }

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "student",
    entityId: studentId,
    action: "whatsapp_message_sent",
  });

  return {};
}

export async function sendWhatsAppToLead(
  leadId: string,
  message: string,
): Promise<SendWhatsAppResult> {
  const profile = await requireRole("admin");

  if (!message.trim()) {
    return { error: "Escreva uma mensagem antes de enviar." };
  }

  const supabase = await createClient();
  const { data: lead } = await supabase
    .from("leads")
    .select("id, phone")
    .eq("id", leadId)
    .single();

  if (!lead?.phone) {
    return { error: "Este lead não tem telefone cadastrado." };
  }

  const result = await sendWhatsAppMessage({
    schoolId: profile.schoolId,
    phone: lead.phone,
    text: message,
  });

  if (result.error) {
    return result;
  }

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "lead",
    entityId: leadId,
    action: "whatsapp_message_sent",
  });

  return {};
}
