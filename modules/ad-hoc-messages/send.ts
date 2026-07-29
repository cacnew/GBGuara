import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { sendWhatsAppMessage } from "@/lib/evolution/client";
import { sendEmail } from "@/lib/email/client";
import { logAuditEvent } from "@/modules/audit/log";

/**
 * Lógica de envio (Fase 18.2) separada da Server Action
 * (`app/(admin)/messages/ad-hoc/actions.ts`) para ser chamável direto em
 * teste de integração sem contexto de requisição do Next.js — mesmo motivo
 * de `modules/birthday-messages/job.ts` (Fase 15.3).
 */

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
  ctx: { supabase: SupabaseClient<Database>; schoolId: string; userId: string },
): Promise<SendAdHocMessageResult> {
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

  const { supabase, schoolId, userId } = ctx;
  const result: SendAdHocMessageResult = {};

  const baseRow = {
    school_id: schoolId,
    created_by: userId,
    recipient_type: input.recipientType,
    student_id: input.recipientType === "aluno" ? (input.recipientId ?? null) : null,
    teacher_id: input.recipientType === "professor" ? (input.recipientId ?? null) : null,
    lead_id: input.recipientType === "lead" ? (input.recipientId ?? null) : null,
    recipient_name: recipientName,
    phone: phone || null,
    email: email || null,
    message,
  };

  if (input.sendWhatsapp) {
    const sendResult = await sendWhatsAppMessage({ schoolId, phone, text: message });

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
        schoolId,
        userId,
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
        schoolId,
        userId,
        entityType: "ad_hoc_message",
        entityId: logRow.id,
        action: "ad_hoc_message_sent",
      });
    }
  }

  return result;
}
