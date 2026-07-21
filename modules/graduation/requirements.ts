import { createClient } from "@/lib/supabase/server";
import { buildBeltTransitions, type BeltTransition } from "./requirements-rules";

export * from "./requirements-rules";

export type BeltSystemRequirements = {
  beltSystemId: string;
  beltSystemName: string;
  transitions: (BeltTransition & { requiredClasses: number })[];
};

/**
 * Transições de faixa de cada belt_system da escola, com a meta de aulas
 * já configurada (Fase 13.1) — 0 quando o admin ainda não configurou
 * aquela transição. Recebe `schoolId` já resolvido pelo chamador (mesmo
 * padrão de `getMedalPointRules`, Fase 12).
 */
export async function getBeltGraduationRequirements(
  schoolId: string,
): Promise<BeltSystemRequirements[]> {
  const supabase = await createClient();

  const { data: beltSystems } = await supabase
    .from("belt_systems")
    .select("id, name")
    .eq("school_id", schoolId)
    .order("name");

  if (!beltSystems || beltSystems.length === 0) return [];

  const { data: belts } = await supabase
    .from("belts")
    .select("id, name, ordering, belt_system_id")
    .eq("school_id", schoolId)
    .order("ordering");

  const { data: requirements } = await supabase
    .from("belt_graduation_requirements")
    .select("belt_system_id, from_belt_id, required_classes")
    .eq("school_id", schoolId);

  const requiredByKey = new Map(
    (requirements ?? []).map((r) => [
      `${r.belt_system_id}:${r.from_belt_id}`,
      r.required_classes,
    ]),
  );

  return beltSystems.map((system) => {
    const systemBelts = (belts ?? [])
      .filter((b) => b.belt_system_id === system.id)
      .map((b) => ({ ...b, beltSystemId: b.belt_system_id }));

    const transitions = buildBeltTransitions(systemBelts).map((t) => ({
      ...t,
      requiredClasses: requiredByKey.get(`${system.id}:${t.fromBeltId}`) ?? 0,
    }));

    return { beltSystemId: system.id, beltSystemName: system.name, transitions };
  });
}
