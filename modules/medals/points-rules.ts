/**
 * Lógica pura de pontuação — sem nenhum import via alias `@/`, de
 * propósito, para ser testável pelo vitest sem depender do resolvedor de
 * paths do Next.js (mesmo motivo documentado na Fase 9.11 para
 * `eligibility.ts`/`signal-rules.ts`: um import `@/` aqui quebra
 * `points.test.ts`, já que o vitest não resolve esse alias).
 */

export const MEDAL_LEVELS = ["ouro", "prata", "bronze", "participacao"] as const;
export type MedalLevel = (typeof MEDAL_LEVELS)[number];

export const MEDAL_LEVEL_LABELS: Record<MedalLevel, string> = {
  ouro: "Ouro",
  prata: "Prata",
  bronze: "Bronze",
  participacao: "Participação",
};

export type MedalPointRule = { level: MedalLevel; points: number };

/**
 * Pontos de uma medalha aprovada: usa o override do evento para aquele
 * nível se existir; senão, o default da escola (decisão 5 da Fase 12).
 */
export function resolveMedalPoints(
  level: string,
  eventOverrides: Partial<Record<string, number>>,
  schoolDefaults: Partial<Record<string, number>>,
): number {
  const override = eventOverrides[level];
  return override !== undefined ? override : schoolDefaults[level] ?? 0;
}
