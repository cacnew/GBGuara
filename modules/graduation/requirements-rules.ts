/**
 * Lógica pura de transições de faixa — sem nenhum import via alias `@/`,
 * de propósito (mesmo motivo documentado na Fase 9.11/12.9: um import
 * `@/` aqui quebra o vitest, que não resolve esse alias).
 */

export type BeltSummary = {
  id: string;
  name: string;
  ordering: number;
  beltSystemId: string;
};

export type BeltTransition = {
  fromBeltId: string;
  fromBeltName: string;
  toBeltId: string;
  toBeltName: string;
};

/**
 * Deriva as transições consecutivas de faixa (Fase 13.1) a partir da
 * ordem já existente em `belts.ordering` (Fase 2.2) — a última faixa de
 * um belt_system não gera transição (não há "próxima faixa").
 */
export function buildBeltTransitions(belts: BeltSummary[]): BeltTransition[] {
  const sorted = [...belts].sort((a, b) => a.ordering - b.ordering);
  const transitions: BeltTransition[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    transitions.push({
      fromBeltId: sorted[i].id,
      fromBeltName: sorted[i].name,
      toBeltId: sorted[i + 1].id,
      toBeltName: sorted[i + 1].name,
    });
  }

  return transitions;
}

export function isValidRequiredClasses(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}
