"use server";

import { requireUser } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export type StudentSearchResult = {
  id: string;
  name: string;
  photoUrl: string | null;
  beltName: string | null;
  beltColorHex: string | null;
  currentDegree: number;
};

/**
 * Busca alunos ativos por nome — usada na tela de chamada (Fase 4.3)
 * para adicionar qualquer aluno ativo da escola, mesmo sem vínculo
 * prévio com a turma (seção 3 do documento mestre).
 */
export async function searchActiveStudents(
  query: string,
): Promise<StudentSearchResult[]> {
  await requireUser();
  const supabase = await createClient();

  let request = supabase
    .from("students")
    .select("id, name, photo_url, current_degree, belts(name, color_hex)")
    .eq("status", "ativo")
    .order("name");

  const trimmed = query.trim();
  if (trimmed) {
    request = request.ilike("name", `%${trimmed}%`);
  }

  const { data } = await request;

  return (data ?? []).map((student) => ({
    id: student.id,
    name: student.name,
    photoUrl: student.photo_url,
    beltName: student.belts?.name ?? null,
    beltColorHex: student.belts?.color_hex ?? null,
    currentDegree: student.current_degree,
  }));
}
