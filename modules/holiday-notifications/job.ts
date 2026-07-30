import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppMessage } from "@/lib/evolution/client";
import { getHolidayForDate } from "@/modules/holidays/lookup";
import { formatDateOnly } from "@/lib/dates/format";
import {
  renderHolidayNotificationTemplate,
  DEFAULT_HOLIDAY_NOTIFICATION_TEMPLATE,
  type HolidayNotificationVariables,
} from "./template";
import type { Database } from "@/lib/supabase/database.types";

type AdminClient = SupabaseClient<Database>;
type RecipientType = "aluno" | "professor";
type SendOutcome = "sent" | "failed" | "skipped";

export type HolidayNotificationJobSummary = {
  schoolsProcessed: number;
  sent: number;
  failed: number;
  skipped: number;
};

// 2 dias antes, 1 dia antes, no dia (Fase 16.4).
const OFFSETS_DAYS = [2, 1, 0];

/**
 * Job diário de avisos de feriado (Fase 16.4) — mesma rota/agendamento do
 * job de aniversário (Fase 15.3, `app/api/cron/birthday-messages/route.ts`),
 * nova responsabilidade dentro dela, sem entrada nova em `vercel.json`. Roda
 * com `service_role` (`createAdminClient`, sem depender de `next/headers`) —
 * função comum chamável direto de testes, mesmo padrão de
 * `runBirthdayMessageJob`.
 *
 * Sem tabela/tela de configuração global: percorre todas as escolas (não há
 * "enabled" por escola, o controle já existe via `holidays.has_class` e o
 * próprio cadastro do feriado, Fase 16.1/16.2).
 */
export async function runHolidayNotificationJob(
  todayISO?: string,
  supabase: AdminClient = createAdminClient(),
): Promise<HolidayNotificationJobSummary> {
  const today = todayISO ?? new Date().toISOString().slice(0, 10);

  const summary: HolidayNotificationJobSummary = {
    schoolsProcessed: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
  };

  const { data: schools } = await supabase.from("schools").select("id, name");

  for (const school of schools ?? []) {
    summary.schoolsProcessed += 1;

    for (const offsetDays of OFFSETS_DAYS) {
      const targetDate = addDaysISO(today, offsetDays);
      const holiday = await getHolidayForDate(supabase, school.id, targetDate);
      if (!holiday) continue;

      const template = holiday.customMessage ?? DEFAULT_HOLIDAY_NOTIFICATION_TEMPLATE;
      const baseVariables: Omit<HolidayNotificationVariables, "nome"> = {
        data: formatDateOnly(targetDate),
        nomeFeriado: holiday.name,
        academia: school.name,
      };

      const { data: students } = await supabase
        .from("students")
        .select("id, name, phone")
        .eq("school_id", school.id)
        .eq("status", "ativo");

      for (const student of students ?? []) {
        const outcome = await sendHolidayNotification(supabase, {
          schoolId: school.id,
          recipientType: "aluno",
          recipientId: student.id,
          holidayDate: targetDate,
          offsetDays,
          phone: student.phone,
          template,
          variables: { ...baseVariables, nome: student.name },
        });
        summary[outcome] += 1;
      }

      const { data: teachers } = await supabase
        .from("teachers")
        .select("id, name, phone")
        .eq("school_id", school.id)
        .eq("status", "active");

      for (const teacher of teachers ?? []) {
        const outcome = await sendHolidayNotification(supabase, {
          schoolId: school.id,
          recipientType: "professor",
          recipientId: teacher.id,
          holidayDate: targetDate,
          offsetDays,
          phone: teacher.phone,
          template,
          variables: { ...baseVariables, nome: teacher.name },
        });
        summary[outcome] += 1;
      }
    }
  }

  return summary;
}

async function sendHolidayNotification(
  supabase: AdminClient,
  params: {
    schoolId: string;
    recipientType: RecipientType;
    recipientId: string;
    holidayDate: string;
    offsetDays: number;
    phone: string | null;
    template: string;
    variables: HolidayNotificationVariables;
  },
): Promise<SendOutcome> {
  const idColumn = params.recipientType === "aluno" ? "student_id" : "teacher_id";
  const idFields =
    params.recipientType === "aluno"
      ? { student_id: params.recipientId, teacher_id: null }
      : { student_id: null, teacher_id: params.recipientId };

  // Checagem primária de duplicidade — o índice único (mesma migration) é a
  // rede de segurança para corrida, não o mecanismo principal.
  const { data: existing } = await supabase
    .from("sent_holiday_notifications")
    .select("id")
    .eq(idColumn, params.recipientId)
    .eq("holiday_date", params.holidayDate)
    .eq("offset_days", params.offsetDays)
    .maybeSingle();
  if (existing) return "skipped";

  if (!params.phone) {
    const { error } = await supabase.from("sent_holiday_notifications").insert({
      school_id: params.schoolId,
      recipient_type: params.recipientType,
      ...idFields,
      holiday_date: params.holidayDate,
      offset_days: params.offsetDays,
      status: "failed",
      error_message: "Sem telefone cadastrado",
    });
    return error?.code === "23505" ? "skipped" : "failed";
  }

  const text = renderHolidayNotificationTemplate(params.template, params.variables);
  const sendResult = await sendWhatsAppMessage({
    schoolId: params.schoolId,
    phone: params.phone,
    text,
  });

  const { error: insertError } = await supabase.from("sent_holiday_notifications").insert({
    school_id: params.schoolId,
    recipient_type: params.recipientType,
    ...idFields,
    holiday_date: params.holidayDate,
    offset_days: params.offsetDays,
    status: sendResult.error ? "failed" : "sent",
    error_message: sendResult.error ?? null,
  });

  if (insertError?.code === "23505") return "skipped";
  return sendResult.error ? "failed" : "sent";
}

// Soma dias a uma data `YYYY-MM-DD` sem passar por `new Date(string)`
// (evita o mesmo problema de fuso horário documentado em `job.ts` da Fase
// 15.3 — comparação/aritmética sempre em componentes de calendário, nunca
// parseando a string como instante).
function addDaysISO(dateISO: string, days: number): string {
  const [year, month, day] = dateISO.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
