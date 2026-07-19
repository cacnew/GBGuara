/**
 * Lógica pura de agregação do ranking — sem nenhum import via alias `@/`,
 * de propósito, para ser testável pelo vitest (mesmo motivo de
 * `points-rules.ts`).
 */

export type ApprovedMedalRecord = {
  studentId: string;
  level: string;
  eventId: string;
  eventYear: number;
};

/**
 * Agregação dos pontos por aluno, dado um filtro de ano OU evento — os
 * dois são mutuamente exclusivos (decisão 12 da Fase 12: o filtro por
 * evento ignora o ano selecionado).
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
