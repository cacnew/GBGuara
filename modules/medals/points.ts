import { createClient } from "@/lib/supabase/server";

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
 * Pontuação default por nível da escola (decisão 4 da Fase 12). Recebe
 * `schoolId` em vez de resolver o profile aqui dentro porque é reaproveitada
 * tanto pelo lado staff (`requireUser`/`requireRole`) quanto pelo lado aluno
 * (`requireStudent`) — cada chamador já validou a própria sessão antes.
 */
export async function getMedalPointRules(schoolId: string): Promise<MedalPointRule[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("medal_point_rules")
    .select("level, points")
    .eq("school_id", schoolId);

  const byLevel = new Map((data ?? []).map((r) => [r.level, r.points]));
  return MEDAL_LEVELS.map((level) => ({ level, points: byLevel.get(level) ?? 0 }));
}

/**
 * Pontos de uma medalha aprovada: usa o override do evento para aquele
 * nível se existir; senão, o default da escola (decisão 5 da Fase 12).
 * Função pura — sem I/O — para ser testável sem banco (Fase 12.9).
 */
export function resolveMedalPoints(
  level: string,
  eventOverrides: Partial<Record<string, number>>,
  schoolDefaults: Partial<Record<string, number>>,
): number {
  const override = eventOverrides[level];
  return override !== undefined ? override : schoolDefaults[level] ?? 0;
}
