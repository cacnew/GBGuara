"use server";

import { requireStudent } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateClassSession } from "@/modules/classes/session-materialization";

// Regras de negócio confirmadas com o usuário (seção 3 e seção 8 —
// "pontos em aberto" — de modules/modulo_aluno.md): aluno sinaliza no
// máximo 7 dias antes da aula, e ainda pode sinalizar até 24h depois do
// horário de início (tolerância para quem esquece de sinalizar antes).
const MAX_ADVANCE_DAYS = 7;
const POST_START_TOLERANCE_HOURS = 24;

const OCCUPYING_STATUSES = ["signaled", "confirmed", "added_by_instructor"];

export type AgendaClass = {
  classGroupId: string;
  name: string;
  startTime: string;
  endTime: string;
  teacherName: string | null;
  teacherPhotoUrl: string | null;
  occupied: number;
  capacity: number | null;
  sexRestriction: "masculino" | "feminino" | null;
  minBeltName: string | null;
  minDegree: number | null;
  eligible: boolean;
  ineligibleReason: string | null;
  signaled: boolean;
  sessionClosed: boolean;
};

export type SignalResult = { error?: string };

function weekdayOf(date: string): number {
  // `date` é YYYY-MM-DD; usa UTC para não deixar o fuso do servidor
  // deslocar o dia da semana. week_days segue a mesma convenção do
  // Date#getUTCDay (0=domingo … 6=sábado), confirmado contra os dados de
  // seed (seg/qua/sex => [1,3,5]).
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

type MinBeltInfo = { ordering: number; belt_system_id: string } | null;
type StudentEligibility = {
  sex: string | null;
  current_degree: number;
  belts: { ordering: number; belt_system_id: string } | null;
};

function checkEligibility(
  classGroup: {
    sex_restriction: string | null;
    min_belt_id: string | null;
    min_degree: number | null;
    belts: MinBeltInfo;
  },
  student: StudentEligibility,
): { eligible: boolean; reason: string | null } {
  if (classGroup.sex_restriction && student.sex !== classGroup.sex_restriction) {
    return { eligible: false, reason: "Restrito por sexo" };
  }

  if (classGroup.min_belt_id) {
    const minBelt = classGroup.belts;
    const studentBelt = student.belts;

    if (!minBelt || !studentBelt || studentBelt.belt_system_id !== minBelt.belt_system_id) {
      return { eligible: false, reason: "Faixa mínima não atendida" };
    }
    if (studentBelt.ordering < minBelt.ordering) {
      return { eligible: false, reason: "Faixa mínima não atendida" };
    }
    if (
      studentBelt.ordering === minBelt.ordering &&
      classGroup.min_degree != null &&
      student.current_degree < classGroup.min_degree
    ) {
      return { eligible: false, reason: "Grau mínimo não atendido" };
    }
  }

  return { eligible: true, reason: null };
}

/**
 * Agenda do aluno para um dia (seção 4.1 da spec): turmas que rodam nesse
 * dia da semana e dentro da vigência, com ocupação/elegibilidade
 * calculadas e se o próprio aluno já sinalizou. Não materializa sessão —
 * isso só acontece ao sinalizar (Fase 9.3), então turmas sem interação
 * ainda aparecem com ocupação 0.
 */
export async function getStudentAgenda(date: string): Promise<AgendaClass[]> {
  const profile = await requireStudent();
  const supabase = await createClient();
  const weekday = weekdayOf(date);

  const { data: student } = await supabase
    .from("students")
    .select("sex, current_degree, belts(ordering, belt_system_id)")
    .eq("id", profile.id)
    .single();

  if (!student) return [];

  const { data: classGroups } = await supabase
    .from("class_groups")
    .select(
      "id, name, start_time, end_time, week_days, start_date, end_date, capacity, min_belt_id, min_degree, sex_restriction, teachers(name, photo_url), belts(name, ordering, belt_system_id)",
    )
    .eq("status", "active")
    .contains("week_days", [weekday]);

  const eligibleGroups = (classGroups ?? []).filter((cg) => {
    if (cg.start_date && date < cg.start_date) return false;
    if (cg.end_date && date > cg.end_date) return false;
    return true;
  });

  const classGroupIds = eligibleGroups.map((cg) => cg.id);
  const { data: sessions } =
    classGroupIds.length > 0
      ? await supabase
          .from("class_sessions")
          .select("id, class_group_id, attendance_closed_at")
          .in("class_group_id", classGroupIds)
          .eq("date", date)
      : { data: [] };

  const sessionByGroup = new Map((sessions ?? []).map((s) => [s.class_group_id, s]));
  const sessionIds = (sessions ?? []).map((s) => s.id);

  const { data: attendances } =
    sessionIds.length > 0
      ? await supabase
          .from("attendances")
          .select("class_session_id, student_id, status")
          .in("class_session_id", sessionIds)
      : { data: [] };

  return eligibleGroups.map((cg) => {
    const session = sessionByGroup.get(cg.id);
    const sessionAttendances = session
      ? (attendances ?? []).filter((a) => a.class_session_id === session.id)
      : [];

    const occupied = sessionAttendances.filter((a) =>
      OCCUPYING_STATUSES.includes(a.status),
    ).length;
    const own = sessionAttendances.find((a) => a.student_id === profile.id);
    const { eligible, reason } = checkEligibility(cg, student);

    return {
      classGroupId: cg.id,
      name: cg.name,
      startTime: cg.start_time,
      endTime: cg.end_time,
      teacherName: cg.teachers?.name ?? null,
      teacherPhotoUrl: cg.teachers?.photo_url ?? null,
      occupied,
      capacity: cg.capacity,
      sexRestriction: cg.sex_restriction as AgendaClass["sexRestriction"],
      minBeltName: cg.belts?.name ?? null,
      minDegree: cg.min_degree,
      eligible,
      ineligibleReason: reason,
      signaled: own ? OCCUPYING_STATUSES.includes(own.status) : false,
      sessionClosed: Boolean(session?.attendance_closed_at),
    };
  });
}

/**
 * Sinaliza presença do aluno numa turma/data (seção 3 da spec). Materializa
 * a sessão sob demanda (Fase 9.3) só depois de todas as validações
 * passarem, para não criar sessões vazias por tentativas inválidas.
 */
export async function signalAttendance(
  classGroupId: string,
  date: string,
): Promise<SignalResult> {
  const profile = await requireStudent();
  const supabase = await createClient();

  const { data: classGroup } = await supabase
    .from("class_groups")
    .select(
      "id, status, week_days, start_date, end_date, start_time, end_time, capacity, min_belt_id, min_degree, sex_restriction, belts(ordering, belt_system_id)",
    )
    .eq("id", classGroupId)
    .eq("school_id", profile.schoolId)
    .single();

  if (!classGroup || classGroup.status !== "active") {
    return { error: "Turma não encontrada" };
  }

  const weekday = weekdayOf(date);
  if (!classGroup.week_days.includes(weekday)) {
    return { error: "Essa turma não ocorre nesse dia" };
  }
  if (classGroup.start_date && date < classGroup.start_date) {
    return { error: "Fora da vigência da turma" };
  }
  if (classGroup.end_date && date > classGroup.end_date) {
    return { error: "Fora da vigência da turma" };
  }

  const sessionStart = new Date(`${date}T${classGroup.start_time}`);
  const now = new Date();
  const maxAdvanceMs = MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000;
  const toleranceMs = POST_START_TOLERANCE_HOURS * 60 * 60 * 1000;

  if (sessionStart.getTime() - now.getTime() > maxAdvanceMs) {
    return { error: `Só é possível sinalizar até ${MAX_ADVANCE_DAYS} dias antes` };
  }
  if (now.getTime() - sessionStart.getTime() > toleranceMs) {
    return { error: "Prazo para sinalizar essa aula já passou" };
  }

  const { data: existingSession } = await supabase
    .from("class_sessions")
    .select("attendance_closed_at")
    .eq("class_group_id", classGroupId)
    .eq("date", date)
    .maybeSingle();

  if (existingSession?.attendance_closed_at) {
    return { error: "A chamada dessa aula já foi fechada" };
  }

  const { data: student } = await supabase
    .from("students")
    .select("sex, current_degree, belts(ordering, belt_system_id)")
    .eq("id", profile.id)
    .single();

  if (!student) return { error: "Aluno não encontrado" };

  const { eligible, reason } = checkEligibility(classGroup, student);
  if (!eligible) {
    return { error: reason ?? "Você não atende aos requisitos dessa turma" };
  }

  // Conflito de horário: bloqueia sinalizar em turmas cujo horário se
  // sobrepõe a outra sinalização já ativa do aluno no mesmo dia.
  const { data: sameDaySessions } = await supabase
    .from("class_sessions")
    .select("id, class_groups(start_time, end_time)")
    .eq("date", date);

  const sameDaySessionIds = (sameDaySessions ?? []).map((s) => s.id);
  if (sameDaySessionIds.length > 0) {
    const { data: ownSameDay } = await supabase
      .from("attendances")
      .select("class_session_id, status")
      .in("class_session_id", sameDaySessionIds)
      .eq("student_id", profile.id)
      .in("status", OCCUPYING_STATUSES);

    const overlaps = (ownSameDay ?? []).some((a) => {
      const other = sameDaySessions?.find((s) => s.id === a.class_session_id)
        ?.class_groups;
      if (!other) return false;
      return other.start_time < classGroup.end_time && classGroup.start_time < other.end_time;
    });

    if (overlaps) {
      return { error: "Você já sinalizou presença em outra turma nesse horário" };
    }
  }

  const materialized = await getOrCreateClassSession({
    supabase,
    schoolId: profile.schoolId,
    classGroupId,
    date,
  });

  if (materialized.error || !materialized.sessionId) {
    return { error: materialized.error ?? "Não foi possível abrir a sessão" };
  }

  if (classGroup.capacity != null) {
    const { count } = await supabase
      .from("attendances")
      .select("id", { count: "exact", head: true })
      .eq("class_session_id", materialized.sessionId)
      .in("status", OCCUPYING_STATUSES);

    if ((count ?? 0) >= classGroup.capacity) {
      return { error: "Turma lotada" };
    }
  }

  const { data: existing } = await supabase
    .from("attendances")
    .select("id, status")
    .eq("class_session_id", materialized.sessionId)
    .eq("student_id", profile.id)
    .maybeSingle();

  if (existing) {
    if (existing.status === "signaled") {
      return {};
    }
    if (existing.status !== "cancelled") {
      return { error: "Presença já registrada pelo professor" };
    }

    const { error } = await supabase
      .from("attendances")
      .update({ status: "signaled", signaled_at: new Date().toISOString() })
      .eq("id", existing.id);

    return error ? { error: error.message } : {};
  }

  const { error } = await supabase.from("attendances").insert({
    school_id: profile.schoolId,
    class_session_id: materialized.sessionId,
    student_id: profile.id,
    status: "signaled",
    signaled_at: new Date().toISOString(),
  });

  return error ? { error: error.message } : {};
}

/**
 * Cancela a sinalização do aluno (seção 3: só até o início da aula — na
 * prática, enquanto o status ainda for `signaled`; uma vez confirmado
 * pelo professor, o cancelamento não se aplica mais).
 */
export async function cancelSignal(
  classGroupId: string,
  date: string,
): Promise<SignalResult> {
  const profile = await requireStudent();
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("class_sessions")
    .select("id, attendance_closed_at")
    .eq("class_group_id", classGroupId)
    .eq("date", date)
    .maybeSingle();

  if (!session) return { error: "Sessão não encontrada" };
  if (session.attendance_closed_at) {
    return { error: "A chamada dessa aula já foi fechada" };
  }

  const { data: attendance } = await supabase
    .from("attendances")
    .select("id, status")
    .eq("class_session_id", session.id)
    .eq("student_id", profile.id)
    .maybeSingle();

  if (!attendance || attendance.status !== "signaled") {
    return { error: "Não há sinalização para cancelar" };
  }

  const { error } = await supabase
    .from("attendances")
    .update({ status: "cancelled" })
    .eq("id", attendance.id);

  return error ? { error: error.message } : {};
}
