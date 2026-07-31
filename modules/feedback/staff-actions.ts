"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/evolution/client";
import { logAuditEvent } from "@/modules/audit/log";
import type { FeedbackActionResult, FeedbackThreadMessage } from "@/modules/feedback/student-actions";

export type StaffFeedbackListItem = {
  id: string;
  type: string;
  title: string;
  target: string;
  status: string;
  createdAt: string;
  studentName: string;
  teacherId: string | null;
  teacherName: string | null;
};

export type StaffFeedbackThread = {
  id: string;
  type: string;
  title: string;
  target: string;
  status: string;
  createdAt: string;
  studentName: string;
  teacherName: string | null;
  messages: FeedbackThreadMessage[];
};

/**
 * Fila de gestão do staff (17.3): sem filtro de `school_id`/`teacher_id`
 * explícito além do `eq(school_id)` de defesa em profundidade — a RLS da
 * Fase 17.1 já resolve o resto (admin vê tudo da escola; professor só o
 * que tem `target`/`teacher_id` batendo com `current_teacher_id()`), por
 * isso a mesma query serve as duas telas ((admin)/(teacher)), igual ao
 * padrão de `getPendingMedals`.
 */
export async function getStaffFeedback(): Promise<StaffFeedbackListItem[]> {
  const profile = await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("feedback")
    .select("id, type, title, target, status, created_at, students(name), teachers(id, name)")
    .eq("school_id", profile.schoolId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    target: row.target,
    status: row.status,
    createdAt: row.created_at,
    studentName: row.students?.name ?? "",
    teacherId: row.teachers?.id ?? null,
    teacherName: row.teachers?.name ?? null,
  }));
}

export async function getStaffFeedbackThread(feedbackId: string): Promise<StaffFeedbackThread | null> {
  const profile = await requireUser();
  const supabase = await createClient();

  const { data: feedback } = await supabase
    .from("feedback")
    .select("id, type, title, target, status, created_at, students(name), teachers(name)")
    .eq("id", feedbackId)
    .eq("school_id", profile.schoolId)
    .maybeSingle();

  if (!feedback) return null;

  const { data: messages } = await supabase
    .from("feedback_messages")
    .select("id, body, attachment_url, created_at, users(name), students(name)")
    .eq("feedback_id", feedbackId)
    .order("created_at", { ascending: true });

  return {
    id: feedback.id,
    type: feedback.type,
    title: feedback.title,
    target: feedback.target,
    status: feedback.status,
    createdAt: feedback.created_at,
    studentName: feedback.students?.name ?? "",
    teacherName: feedback.teachers?.name ?? null,
    messages: (messages ?? []).map((message) => ({
      id: message.id,
      body: message.body,
      attachmentUrl: message.attachment_url,
      authorName: message.users?.name ?? message.students?.name ?? "Equipe",
      isStaff: Boolean(message.users),
      createdAt: message.created_at,
    })),
  };
}

/**
 * Responder como staff sempre move o status para `respondida` (a menos
 * que já esteja `encerrada`) — satisfaz o critério de pronto "ao
 * decidir/responder, muda o status" para o caso de resposta. Mudança
 * manual de status (ex: `em_analise`, `encerrada`) fica em
 * `updateFeedbackStatus`, abaixo.
 */
export async function replyToFeedbackAsStaff(
  feedbackId: string,
  body: string,
  attachmentUrl?: string,
): Promise<FeedbackActionResult> {
  const profile = await requireUser();

  if (!body.trim()) {
    return { error: "A mensagem não pode estar vazia." };
  }

  const supabase = await createClient();

  const { data: feedback } = await supabase
    .from("feedback")
    .select("id, status, title, student_id, students(phone)")
    .eq("id", feedbackId)
    .eq("school_id", profile.schoolId)
    .maybeSingle();

  if (!feedback) {
    return { error: "Feedback não encontrado." };
  }

  const { error: messageError } = await supabase.from("feedback_messages").insert({
    feedback_id: feedbackId,
    author_user_id: profile.id,
    body: body.trim(),
    attachment_url: attachmentUrl?.trim() || null,
  });

  if (messageError) return { error: messageError.message };

  if (feedback.status !== "encerrada") {
    const { error: statusError } = await supabase
      .from("feedback")
      .update({ status: "respondida" })
      .eq("id", feedbackId);

    if (statusError) return { error: statusError.message };
  }

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "feedback",
    entityId: feedbackId,
    action: "feedback_staff_replied",
  });

  // Notificação da resposta (17.4) — in-app sempre; WhatsApp só quando o
  // aluno tem telefone cadastrado. Mesma limitação de canal da Fase 15
  // (sem push/e-mail ainda). Melhor esforço: falha em notificar não
  // desfaz a resposta já registrada acima.
  await supabase.from("notifications").insert({
    school_id: profile.schoolId,
    student_id: feedback.student_id,
    type: "feedback_replied",
    payload: { feedbackTitle: feedback.title },
  });

  if (feedback.students?.phone) {
    await sendWhatsAppMessage({
      schoolId: profile.schoolId,
      phone: feedback.students.phone,
      text: `Você recebeu uma resposta no Fale Conosco: "${feedback.title}". Acesse o app para conferir.`,
    });
  }

  revalidatePath(`/messages/fale-conosco/${feedbackId}`);
  revalidatePath(`/professor/fale-conosco/${feedbackId}`);
  revalidatePath("/messages/fale-conosco");
  revalidatePath("/professor/fale-conosco");
  return {};
}

export async function updateFeedbackStatus(
  feedbackId: string,
  status: "recebida" | "em_analise" | "respondida" | "encerrada",
): Promise<FeedbackActionResult> {
  const profile = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("feedback")
    .update({ status })
    .eq("id", feedbackId)
    .eq("school_id", profile.schoolId);

  if (error) return { error: error.message };

  revalidatePath(`/messages/fale-conosco/${feedbackId}`);
  revalidatePath(`/professor/fale-conosco/${feedbackId}`);
  revalidatePath("/messages/fale-conosco");
  revalidatePath("/professor/fale-conosco");
  return {};
}
