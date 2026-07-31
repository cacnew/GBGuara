"use server";

import { revalidatePath } from "next/cache";
import { requireStudent } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import type { FeedbackFormInput } from "@/lib/validations/feedback";

export type StudentFeedbackListItem = {
  id: string;
  type: string;
  title: string;
  target: string;
  status: string;
  createdAt: string;
};

export type FeedbackThreadMessage = {
  id: string;
  body: string;
  attachmentUrl: string | null;
  authorName: string;
  isStaff: boolean;
  createdAt: string;
};

export type FeedbackThread = {
  id: string;
  type: string;
  title: string;
  target: string;
  status: string;
  createdAt: string;
  messages: FeedbackThreadMessage[];
};

export type FeedbackActionResult = { error?: string; id?: string };

/**
 * Histórico do aluno no "Fale Conosco" (Fase 17.2) — só os próprios
 * (RLS `student can select own feedback`, Fase 17.1).
 */
export async function getMyFeedback(): Promise<StudentFeedbackListItem[]> {
  const profile = await requireStudent();
  const supabase = await createClient();

  const { data } = await supabase
    .from("feedback")
    .select("id, type, title, target, status, created_at")
    .eq("student_id", profile.id)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    target: row.target,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export async function getMyFeedbackThread(feedbackId: string): Promise<FeedbackThread | null> {
  const profile = await requireStudent();
  const supabase = await createClient();

  const { data: feedback } = await supabase
    .from("feedback")
    .select("id, type, title, target, status, created_at")
    .eq("id", feedbackId)
    .eq("student_id", profile.id)
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
 * Cria o feedback + a primeira mensagem da thread (Fase 17.1: `feedback`
 * não tem coluna de corpo/anexo próprio, o conteúdo vive todo em
 * `feedback_messages`). Sem seletor de professor na tela (conforme
 * especificação) — quando `target` inclui professor, `teacher_id` é
 * preenchido a partir de `students.main_teacher_id`.
 */
export async function createFeedback(input: FeedbackFormInput): Promise<FeedbackActionResult> {
  const profile = await requireStudent();

  if (!input.message.trim()) {
    return { error: "A mensagem não pode estar vazia." };
  }

  const supabase = await createClient();

  let teacherId: string | null = null;
  if (input.target === "professor" || input.target === "ambos") {
    const { data: student } = await supabase
      .from("students")
      .select("main_teacher_id")
      .eq("id", profile.id)
      .single();

    if (!student?.main_teacher_id) {
      return {
        error:
          "Você não tem um professor principal cadastrado. Escolha \"Administrador\" como destinatário.",
      };
    }
    teacherId = student.main_teacher_id;
  }

  const { data: feedback, error: feedbackError } = await supabase
    .from("feedback")
    .insert({
      school_id: profile.schoolId,
      student_id: profile.id,
      type: input.type,
      title: input.title.trim(),
      target: input.target,
      teacher_id: teacherId,
    })
    .select("id")
    .single();

  if (feedbackError || !feedback) {
    return { error: feedbackError?.message ?? "Não foi possível enviar." };
  }

  const { error: messageError } = await supabase.from("feedback_messages").insert({
    feedback_id: feedback.id,
    author_student_id: profile.id,
    body: input.message.trim(),
    attachment_url: input.attachmentUrl?.trim() || null,
  });

  if (messageError) {
    return { error: messageError.message };
  }

  revalidatePath("/aluno/fale-conosco");
  return { id: feedback.id };
}

export async function replyToFeedback(
  feedbackId: string,
  body: string,
  attachmentUrl?: string,
): Promise<FeedbackActionResult> {
  const profile = await requireStudent();

  if (!body.trim()) {
    return { error: "A mensagem não pode estar vazia." };
  }

  const supabase = await createClient();

  const { data: feedback } = await supabase
    .from("feedback")
    .select("id")
    .eq("id", feedbackId)
    .eq("student_id", profile.id)
    .maybeSingle();

  if (!feedback) {
    return { error: "Feedback não encontrado." };
  }

  const { error } = await supabase.from("feedback_messages").insert({
    feedback_id: feedbackId,
    author_student_id: profile.id,
    body: body.trim(),
    attachment_url: attachmentUrl?.trim() || null,
  });

  if (error) return { error: error.message };

  revalidatePath(`/aluno/fale-conosco/${feedbackId}`);
  return {};
}
