"use server";

import { requireStudent } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

const COUNTED_STATUSES = ["confirmed", "added_by_instructor"];

export type BeltTimelineEntry = {
  id: string;
  name: string;
  ordering: number;
  isCurrent: boolean;
  achieved: boolean;
};

export type AttendanceHistoryEntry = {
  id: string;
  date: string;
  className: string;
  startTime: string;
  teacherName: string | null;
};

export type StudentDashboard = {
  currentDegree: number;
  beltTimeline: BeltTimelineEntry[];
  monthlyCounts: number[]; // 12 posições, jan..dez
  trainedDates: string[]; // todas as datas treinadas no ano (para o calendário)
  history: AttendanceHistoryEntry[]; // histórico completo do ano, mais recente primeiro
};

/**
 * Painel do aluno (seção 4.2/4.3 da spec): calendário de treinos, gráfico
 * de treinos por mês, evolução de faixas e histórico de aulas — tudo
 * alimentado só por presenças `confirmed`/`added_by_instructor` (sinalização
 * sem confirmação não conta).
 */
export async function getStudentDashboard(year: number): Promise<StudentDashboard> {
  const profile = await requireStudent();
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("current_belt_id, current_degree, belts(ordering, belt_system_id)")
    .eq("id", profile.id)
    .single();

  let beltTimeline: BeltTimelineEntry[] = [];
  if (student?.belts?.belt_system_id) {
    const { data: belts } = await supabase
      .from("belts")
      .select("id, name, ordering")
      .eq("belt_system_id", student.belts.belt_system_id)
      .order("ordering");

    const currentOrdering = student.belts.ordering;
    beltTimeline = (belts ?? []).map((b) => ({
      id: b.id,
      name: b.name,
      ordering: b.ordering,
      isCurrent: b.id === student.current_belt_id,
      achieved: b.ordering <= currentOrdering,
    }));
  }

  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const { data: attendances } = await supabase
    .from("attendances")
    .select(
      "id, class_sessions!inner(date, class_groups(name, start_time), teachers(name))",
    )
    .eq("student_id", profile.id)
    .in("status", COUNTED_STATUSES)
    .gte("class_sessions.date", yearStart)
    .lte("class_sessions.date", yearEnd)
    .order("date", { foreignTable: "class_sessions", ascending: false });

  const monthlyCounts = Array(12).fill(0);
  const trainedDates: string[] = [];
  const history: AttendanceHistoryEntry[] = [];

  for (const a of attendances ?? []) {
    const session = a.class_sessions;
    if (!session?.date) continue;

    const month = Number(session.date.slice(5, 7)) - 1;
    monthlyCounts[month] += 1;
    trainedDates.push(session.date);
    history.push({
      id: a.id,
      date: session.date,
      className: session.class_groups?.name ?? "",
      startTime: session.class_groups?.start_time ?? "",
      teacherName: session.teachers?.name ?? null,
    });
  }

  return {
    currentDegree: student?.current_degree ?? 0,
    beltTimeline,
    monthlyCounts,
    trainedDates,
    history,
  };
}
