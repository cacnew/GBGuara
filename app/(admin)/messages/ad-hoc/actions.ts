"use server";

import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/evolution/client";
import { sendEmail } from "@/lib/email/client";
import { logAuditEvent } from "@/modules/audit/log";

export type AdHocRecipientType = "aluno" | "professor" | "lead" | "manual";

export type SendAdHocMessageInput = {
  recipientType: AdHocRecipientType;
  recipientId?: string;
  recipientName: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  sendWhatsapp: boolean;
  sendEmail: boolean;
};

export type SendAdHocMessageResult = {
  error?: string;
  whatsappError?: string;
  emailError?: string;
};

export async function sendAdHocMessage(
  input: SendAdHocMessageInput,
): Promise<SendAdHocMessageResult> {
  const profile = await requireRole("admin");

  const recipientName = input.recipientName.trim();
  const message = input.message.trim();
  const phone = input.phone.trim();
  const email = input.email.trim();
  const subject = input.subject.trim();

  if (!recipientName) {
    return { error: "Informe um nome para identificar o destinatário." };
  }
  if (!message) {
    return { error: "Escreva uma mensagem antes de enviar." };
  }
  if (!input.sendWhatsapp && !input.sendEmail) {
    return { error: "Selecione ao menos um canal de envio (WhatsApp ou E-mail)." };
  }
  if (input.sendWhatsapp && !phone) {
    return { error: "Informe o telefone para enviar por WhatsApp." };
  }
  if (input.sendEmail && (!email || !subject)) {
    return { error: "Informe e-mail e assunto para enviar por e-mail." };
  }

  const supabase = await createClient();
  const result: SendAdHocMessageResult = {};

  const baseRow = {
    school_id: profile.schoolId,
    created_by: profile.id,
    recipient_type: input.recipientType,
    student_id: input.recipientType === "aluno" ? input.recipientId : null,
    teacher_id: input.recipientType === "professor" ? input.recipientId : null,
    lead_id: input.recipientType === "lead" ? input.recipientId : null,
    recipient_name: recipientName,
    phone: phone || null,
    email: email || null,
    message,
  };

  if (input.sendWhatsapp) {
    const sendResult = await sendWhatsAppMessage({
      schoolId: profile.schoolId,
      phone,
      text: message,
    });

    const { data: logRow } = await supabase
      .from("ad_hoc_messages")
      .insert({
        ...baseRow,
        channel: "whatsapp",
        status: sendResult.error ? "failed" : "sent",
        error_message: sendResult.error ?? null,
      })
      .select("id")
      .single();

    if (sendResult.error) {
      result.whatsappError = sendResult.error;
    }

    if (logRow) {
      await logAuditEvent({
        supabase,
        schoolId: profile.schoolId,
        userId: profile.id,
        entityType: "ad_hoc_message",
        entityId: logRow.id,
        action: "ad_hoc_message_sent",
      });
    }
  }

  if (input.sendEmail) {
    const sendResult = await sendEmail({ to: email, subject, text: message });

    const { data: logRow } = await supabase
      .from("ad_hoc_messages")
      .insert({
        ...baseRow,
        channel: "email",
        status: sendResult.error ? "failed" : "sent",
        error_message: sendResult.error ?? null,
      })
      .select("id")
      .single();

    if (sendResult.error) {
      result.emailError = sendResult.error;
    }

    if (logRow) {
      await logAuditEvent({
        supabase,
        schoolId: profile.schoolId,
        userId: profile.id,
        entityType: "ad_hoc_message",
        entityId: logRow.id,
        action: "ad_hoc_message_sent",
      });
    }
  }

  return result;
}
