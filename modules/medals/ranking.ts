import { createClient } from "@/lib/supabase/server";
import { getMedalPointRules, resolveMedalPoints, type MedalLevel } from "@/modules/medals/points";
import { listMedalEventOptions, type MedalEventOption } from "@/modules/medals/events";

export type RankingRow = {
  studentId: string;
  studentName: string;
  photoUrl: string | null;
  beltName: string | null;
  degree: number | null;
  points: number;
  position: number;
};

export type ApprovedMedalRecord = {
  studentId: string;
  level: string;
  eventId: string;
  eventYear: number;
};

/**
 * Agregação pura (sem I/O) dos pontos por aluno, dado um filtro de ano OU
 * evento — os dois são mutuamente exclusivos (decisão 12 da Fase 12: o
 * filtro por evento ignora o ano selecionado). Função pura, testável sem
 * banco (Fase 12.9).
 */
export function aggregateMedalPoints(
  medals: ApprovedMedalRecord[],
  pointsFor: (eventId: string, level: string) => number,
  filter: { year?: number; eventId?: string } = {},
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const medal of medals) {
    if (filter.eventId !== undefined) {
      if (medal.eventId !== filter.eventId) continue;
    } else if (filter.year !== undefined && medal.eventYear !== filter.year) {
      continue;
    }
    const points = pointsFor(medal.eventId, medal.level);
    totals.set(medal.studentId, (totals.get(medal.studentId) ?? 0) + points);
  }
  return totals;
}

export type MedalRankingData = {
  rows: RankingRow[];
  availableYears: number[];
  events: MedalEventOption[];
  /** Pontos de todos os anos somados, por aluno — resumo pessoal (decisão 7). */
  allTimeTotals: Record<string, number>;
};

/**
 * Ranking anual (todos os alunos ativos da escola, decisão 9) com filtro
 * por evento (decisão 12) — quando `eventId` é informado, `year` é
 * ignorado e a lista mostra só quem participou daquele evento (não
 * preenchida com zero); quando é por ano, todo aluno ativo aparece, mesmo
 * com 0 pontos.
 */
export async function getMedalRanking(
  schoolId: string,
  filter: { year?: number; eventId?: string } = {},
): Promise<MedalRankingData> {
  const supabase = await createClient();

  const [
    { data: students },
    { data: medalsRaw },
    pointRules,
    events,
    { data: overridesRaw },
    { data: belts },
  ] = await Promise.all([
    supabase
      .from("student_directory")
      .select("id, name, photo_url, current_belt_id, current_degree")
      .order("name"),
    supabase
      .from("medals")
      .select("student_id, level, event_id, medal_events(event_date)")
      .eq("school_id", schoolId)
      .eq("status", "approved"),
    getMedalPointRules(schoolId),
    listMedalEventOptions(schoolId),
    supabase.from("medal_event_point_rules").select("event_id, level, points"),
    supabase.from("belts").select("id, name"),
  ]);

  const beltNameById = new Map((belts ?? []).map((belt) => [belt.id, belt.name]));

  const defaults: Partial<Record<string, number>> = {};
  for (const rule of pointRules) defaults[rule.level] = rule.points;

  const overridesByEvent = new Map<string, Partial<Record<string, number>>>();
  for (const override of overridesRaw ?? []) {
    const current = overridesByEvent.get(override.event_id) ?? {};
    current[override.level] = override.points;
    overridesByEvent.set(override.event_id, current);
  }

  function pointsFor(eventId: string, level: string) {
    return resolveMedalPoints(level, overridesByEvent.get(eventId) ?? {}, defaults);
  }

  const medals: ApprovedMedalRecord[] = (medalsRaw ?? [])
    .filter((row): row is typeof row & { medal_events: { event_date: string } } =>
      Boolean(row.medal_events?.event_date),
    )
    .map((row) => ({
      studentId: row.student_id,
      level: row.level as MedalLevel,
      eventId: row.event_id,
      eventYear: Number(row.medal_events.event_date.slice(0, 4)),
    }));

  const currentYear = new Date().getUTCFullYear();
  const availableYears = Array.from(new Set(medals.map((m) => m.eventYear)));
  if (!availableYears.includes(currentYear)) availableYears.push(currentYear);
  availableYears.sort((a, b) => b - a);

  const activeFilter =
    filter.eventId !== undefined
      ? { eventId: filter.eventId }
      : { year: filter.year ?? currentYear };

  const totals = aggregateMedalPoints(medals, pointsFor, activeFilter);
  const allTimeTotalsMap = aggregateMedalPoints(medals, pointsFor, {});

  // Ranking por evento mostra só quem participou (decisão 12); ranking por
  // ano mostra todo aluno ativo, mesmo com 0 pontos (decisão 6/9).
  const studentsForRows =
    filter.eventId !== undefined
      ? (students ?? []).filter((student) => Boolean(student.id) && totals.has(student.id!))
      : students ?? [];

  const unranked = studentsForRows.map((student) => ({
    studentId: student.id ?? "",
    studentName: student.name ?? "",
    photoUrl: student.photo_url,
    beltName: student.current_belt_id ? beltNameById.get(student.current_belt_id) ?? null : null,
    degree: student.current_degree,
    points: totals.get(student.id ?? "") ?? 0,
  }));

  unranked.sort((a, b) => b.points - a.points || a.studentName.localeCompare(b.studentName));

  const rows: RankingRow[] = unranked.map((row, index) => ({ ...row, position: index + 1 }));

  const allTimeTotals: Record<string, number> = {};
  for (const [studentId, points] of allTimeTotalsMap) allTimeTotals[studentId] = points;

  return { rows, availableYears, events, allTimeTotals };
}
