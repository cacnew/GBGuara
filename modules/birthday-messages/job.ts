import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppMessage } from "@/lib/evolution/client";
import { renderBirthdayMessageTemplate, type BirthdayMessageVariables } from "./template";
import { isBirthdayToday } from "./recipients";
import type { Database } from "@/lib/supabase/database.types";

type AdminClient = SupabaseClient<Database>;
type RecipientType = "aluno" | "professor";
type SendOutcome = "sent" | "failed" | "skipped";

export type BirthdayMessageJobSummary = {
  schoolsProcessed: number;
  sent: number;
  failed: number;
  skipped: number;
};

/**
 * Job diário de disparo (Fase 15.3). Roda com `service_role`
 * (`createAdminClient`, sem depender de `next/headers`) — por isso é uma
 * função comum, não uma Server Action, e é chamável tanto pela rota de API
 * (`app/api/cron/birthday-messages/route.ts`) quanto diretamente em testes
 * de integração, sem precisar de contexto de requisição do Next.js (mesma
 * limitação que forçou outras regras a serem replicadas manualmente nos
 * testes, ex: `deactivateOtherPublishedPositions`, Fase 14.4).
 */
export async function runBirthdayMessageJob(
  todayISO?: string,
  supabase: AdminClient = createAdminClient(),
): Promise<BirthdayMessageJobSummary> {
  const today = todayISO ?? new Date().toISOString().slice(0, 10);

  const summary: BirthdayMessageJobSummary = {
    schoolsProcessed: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
  };

  const { data: settingsRows } = await supabase
    .from("birthday_message_settings")
    .select("school_id, notify_students, notify_teachers, message_template")
    .eq("enabled", true);

  for (const settings of settingsRows ?? []) {
    summary.schoolsProcessed += 1;

    const { data: school } = await supabase
      .from("schools")
      .select("name")
      .eq("id", settings.school_id)
      .single();
    const academia = school?.name ?? "";

    if (settings.notify_students) {
      const { data: students } = await supabase
        .from("students")
        .select(
          "id, name, phone, birth_date, current_belt_id, current_degree, belts(name), main_teacher:main_teacher_id(name)",
        )
        .eq("school_id", settings.school_id)
        .eq("status", "ativo")
        .not("birth_date", "is", null);

      for (const student of students ?? []) {
        if (!isBirthdayToday(student.birth_date, today)) continue;

        const faixa = student.belts?.name
          ? student.current_degree > 0
            ? `${student.belts.name} grau ${student.current_degree}`
            : student.belts.name
          : "";

        const outcome = await sendBirthdayMessage(supabase, {
          schoolId: settings.school_id,
          recipientType: "aluno",
          recipientId: student.id,
          date: today,
          phone: student.phone,
          template: settings.message_template,
          variables: {
            nome: student.name,
            faixa,
            academia,
            professor: student.main_teacher?.name ?? "",
          },
        });
        summary[outcome] += 1;
      }
    }

    if (settings.notify_teachers) {
      const { data: teachers } = await supabase
        .from("teachers")
        .select("id, name, phone, birth_date")
        .eq("school_id", settings.school_id)
        .eq("status", "active")
        .not("birth_date", "is", null);

      for (const teacher of teachers ?? []) {
        if (!isBirthdayToday(teacher.birth_date, today)) continue;

        const outcome = await sendBirthdayMessage(supabase, {
          schoolId: settings.school_id,
          recipientType: "professor",
          recipientId: teacher.id,
          date: today,
          phone: teacher.phone,
          template: settings.message_template,
          variables: { nome: teacher.name, faixa: "", academia, professor: "" },
        });
        summary[outcome] += 1;
      }
    }
  }

  return summary;
}

async function sendBirthdayMessage(
  supabase: AdminClient,
  params: {
    schoolId: string;
    recipientType: RecipientType;
    recipientId: string;
    date: string;
    phone: string | null;
    template: string;
    variables: BirthdayMessageVariables;
  },
): Promise<SendOutcome> {
  const idColumn = params.recipientType === "aluno" ? "student_id" : "teacher_id";
  const idFields =
    params.recipientType === "aluno"
      ? { student_id: params.recipientId, teacher_id: null }
      : { student_id: null, teacher_id: params.recipientId };

  // Checagem primária de duplicidade — a constraint unique (Fase 15.1) é a
  // rede de segurança para corrida, não o mecanismo principal.
  const { data: existing } = await supabase
    .from("sent_birthday_messages")
    .select("id")
    .eq(idColumn, params.recipientId)
    .eq("date", params.date)
    .maybeSingle();
  if (existing) return "skipped";

  if (!params.phone) {
    const { error } = await supabase.from("sent_birthday_messages").insert({
      school_id: params.schoolId,
      recipient_type: params.recipientType,
      ...idFields,
      date: params.date,
      status: "failed",
      error_message: "Sem telefone cadastrado",
    });
    return error?.code === "23505" ? "skipped" : "failed";
  }

  const text = renderBirthdayMessageTemplate(params.template, params.variables);
  const sendResult = await sendWhatsAppMessage({
    schoolId: params.schoolId,
    phone: params.phone,
    text,
  });

  const { error: insertError } = await supabase.from("sent_birthday_messages").insert({
    school_id: params.schoolId,
    recipient_type: params.recipientType,
    ...idFields,
    date: params.date,
    status: sendResult.error ? "failed" : "sent",
    error_message: sendResult.error ?? null,
  });

  if (insertError?.code === "23505") return "skipped";
  return sendResult.error ? "failed" : "sent";
}
