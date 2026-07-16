"use server";

import { requireUser } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { PRESENT_STATUSES } from "@/lib/attendance/constants";

export type RollCallAttendance = {
  attendanceId: string;
  studentId: string;
  studentName: string;
  photoUrl: string | null;
  beltName: string | null;
  beltColorHex: string | null;
  currentDegree: number;
  status: string;
  signaledAt: string | null;
  confirmedAt: string | null;
};

export type RollCallResult = { error?: string };

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Chamada da aula nova (seção 5.1 da spec): lista quem sinalizou/foi
 * confirmado/foi incluído manualmente numa sessão. Convive com a tela de
 * chamada atual (`app/attendance/[sessionId]`) — não a substitui.
 */
export async function getSessionRollCall(
  sessionId: string,
): Promise<RollCallAttendance[]> {
  const profile = await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("attendances")
    .select(
      "id, student_id, status, signaled_at, confirmed_at, students(name, photo_url, current_degree, belts(name, color_hex))",
    )
    .eq("class_session_id", sessionId)
    .eq("school_id", profile.schoolId)
    .order("signaled_at", { ascending: true });

  return (data ?? []).map((a) => ({
    attendanceId: a.id,
    studentId: a.student_id,
    studentName: a.students?.name ?? "",
    photoUrl: a.students?.photo_url ?? null,
    beltName: a.students?.belts?.name ?? null,
    beltColorHex: a.students?.belts?.color_hex ?? null,
    currentDegree: a.students?.current_degree ?? 0,
    status: a.status,
    signaledAt: a.signaled_at,
    confirmedAt: a.confirmed_at,
  }));
}

/**
 * Sessão deve existir, pertencer à escola do profissional e ainda não ter
 * sido fechada; confirmar/incluir/fechar só valem para hoje ou o passado
 * (seção 3 da spec: "professor só confirma presença em sessões da data
 * corrente ou passadas").
 */
async function assertSessionEditable(
  supabase: SupabaseServerClient,
  sessionId: string,
  schoolId: string,
): Promise<{ error?: string }> {
  const { data: session } = await supabase
    .from("class_sessions")
    .select("id, date, attendance_closed_at")
    .eq("id", sessionId)
    .eq("school_id", schoolId)
    .single();

  if (!session) return { error: "Sessão não encontrada" };
  if (session.attendance_closed_at) return { error: "A chamada dessa aula já foi fechada" };

  const today = new Date().toISOString().slice(0, 10);
  if (session.date > today) {
    return { error: "Não é possível mexer na chamada de uma sessão futura" };
  }

  return {};
}

export async function confirmAttendance(attendanceId: string): Promise<RollCallResult> {
  const profile = await requireUser();
  const supabase = await createClient();

  const { data: attendance } = await supabase
    .from("attendances")
    .select("id, class_session_id, status")
    .eq("id", attendanceId)
    .eq("school_id", profile.schoolId)
    .single();

  if (!attendance) return { error: "Presença não encontrada" };
  if (attendance.status !== "signaled") {
    return { error: "Só é possível confirmar quem sinalizou presença" };
  }

  const check = await assertSessionEditable(supabase, attendance.class_session_id, profile.schoolId);
  if (check.error) return check;

  const { error } = await supabase
    .from("attendances")
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      confirmed_by: profile.id,
    })
    .eq("id", attendanceId);

  return error ? { error: error.message } : {};
}

/** Desfaz uma confirmação (toggle de volta para "sinalizado"). */
export async function revertToSignaled(attendanceId: string): Promise<RollCallResult> {
  const profile = await requireUser();
  const supabase = await createClient();

  const { data: attendance } = await supabase
    .from("attendances")
    .select("id, class_session_id, status")
    .eq("id", attendanceId)
    .eq("school_id", profile.schoolId)
    .single();

  if (!attendance) return { error: "Presença não encontrada" };
  if (attendance.status !== "confirmed") {
    return { error: "Só é possível desfazer quem foi confirmado" };
  }

  const check = await assertSessionEditable(supabase, attendance.class_session_id, profile.schoolId);
  if (check.error) return check;

  const { error } = await supabase
    .from("attendances")
    .update({ status: "signaled", confirmed_at: null, confirmed_by: null })
    .eq("id", attendanceId);

  return error ? { error: error.message } : {};
}

/**
 * Inclusão manual (seção 5.1): professor busca um aluno e o inclui direto
 * na chamada, mesmo sem sinalização prévia. Cria/reaproveita a
 * `attendance` com status `added_by_instructor`, já confirmada.
 */
export async function addStudentManually(
  sessionId: string,
  studentId: string,
): Promise<RollCallResult> {
  const profile = await requireUser();
  const supabase = await createClient();

  const check = await assertSessionEditable(supabase, sessionId, profile.schoolId);
  if (check.error) return check;

  const { data: existing } = await supabase
    .from("attendances")
    .select("id, status")
    .eq("class_session_id", sessionId)
    .eq("student_id", studentId)
    .maybeSingle();

  const now = new Date().toISOString();

  if (existing) {
    if ((PRESENT_STATUSES as readonly string[]).includes(existing.status)) {
      return { error: "Aluno já está presente nessa aula" };
    }

    const { error } = await supabase
      .from("attendances")
      .update({ status: "added_by_instructor", confirmed_at: now, confirmed_by: profile.id })
      .eq("id", existing.id);

    return error ? { error: error.message } : {};
  }

  const { error } = await supabase.from("attendances").insert({
    school_id: profile.schoolId,
    class_session_id: sessionId,
    student_id: studentId,
    status: "added_by_instructor",
    confirmed_at: now,
    confirmed_by: profile.id,
    registered_by_user_id: profile.id,
  });

  return error ? { error: error.message } : {};
}

/**
 * Fecha a chamada (seção 5.1): quem ainda estava só `signaled` vira
 * `no_show`; quem foi `confirmed`/`added_by_instructor` gera notificação.
 * Marca a sessão como `realizada` e trava novas sinalizações/confirmações
 * (Fase 9.4/9.5 — reabertura de chamada fechada fica em aberto).
 */
export async function closeRollCall(sessionId: string): Promise<RollCallResult> {
  const profile = await requireUser();
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("class_sessions")
    .select("id, date, attendance_closed_at, class_groups(name, start_time, end_time)")
    .eq("id", sessionId)
    .eq("school_id", profile.schoolId)
    .single();

  if (!session) return { error: "Sessão não encontrada" };
  if (session.attendance_closed_at) return { error: "A chamada dessa aula já foi fechada" };

  const today = new Date().toISOString().slice(0, 10);
  if (session.date > today) {
    return { error: "Não é possível fechar a chamada de uma sessão futura" };
  }

  const { data: pendingSignals } = await supabase
    .from("attendances")
    .select("id")
    .eq("class_session_id", sessionId)
    .eq("status", "signaled");

  if (pendingSignals && pendingSignals.length > 0) {
    await supabase
      .from("attendances")
      .update({ status: "no_show" })
      .in(
        "id",
        pendingSignals.map((a) => a.id),
      );
  }

  const { data: toNotify } = await supabase
    .from("attendances")
    .select("student_id, status")
    .eq("class_session_id", sessionId)
    .in("status", ["confirmed", "added_by_instructor"]);

  if (toNotify && toNotify.length > 0) {
    const classGroup = session.class_groups;
    const payload = {
      className: classGroup?.name ?? "",
      date: session.date,
      startTime: classGroup?.start_time ?? "",
      endTime: classGroup?.end_time ?? "",
    };

    await supabase.from("notifications").insert(
      toNotify.map((a) => ({
        school_id: profile.schoolId,
        student_id: a.student_id,
        type: a.status === "added_by_instructor" ? "added_to_class" : "presence_confirmed",
        payload,
      })),
    );
  }

  const { error } = await supabase
    .from("class_sessions")
    .update({ attendance_closed_at: new Date().toISOString(), status: "realizada" })
    .eq("id", sessionId);

  return error ? { error: error.message } : {};
}
