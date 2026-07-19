import { createClient } from "@/lib/supabase/server";
import { MEDAL_LEVELS, type MedalLevel, type MedalPointRule } from "./points-rules";

export * from "./points-rules";

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
  return MEDAL_LEVELS.map((level: MedalLevel) => ({ level, points: byLevel.get(level) ?? 0 }));
}
