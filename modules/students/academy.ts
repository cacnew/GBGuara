"use server";

import { requireStudent } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export type InstructorEntry = {
  id: string;
  name: string;
  photoUrl: string | null;
};

export type StudentDirectoryEntry = {
  id: string;
  name: string;
  photoUrl: string | null;
  beltName: string | null;
  beltColorHex: string | null;
  currentDegree: number;
};

export type ClassCatalogEntry = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  teacherName: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  weekDays: number[];
};

export type AcademyData = {
  instructors: InstructorEntry[];
  students: StudentDirectoryEntry[];
  classes: ClassCatalogEntry[];
};

/**
 * "Minha Academia" (seção 4.4 da spec): tabs de consulta Instrutores /
 * Alunos / Aulas. `students` (aluno x aluno) usa a view
 * `student_directory` (Fase 9.9) — expõe só nome/foto/faixa, nunca dados
 * sensíveis do cadastro completo.
 */
export async function getAcademyData(): Promise<AcademyData> {
  await requireStudent();
  const supabase = await createClient();

  const [{ data: teachers }, { data: directory }, { data: classGroups }] = await Promise.all([
    supabase.from("teachers").select("id, name, photo_url").eq("status", "active").order("name"),
    supabase
      .from("student_directory")
      .select("id, name, photo_url, current_belt_id, current_degree")
      .order("name"),
    supabase
      .from("class_groups")
      .select(
        "id, name, start_time, end_time, status, start_date, end_date, week_days, teachers(name)",
      )
      .eq("status", "active")
      .order("start_time"),
  ]);

  const beltIds = [...new Set((directory ?? []).map((s) => s.current_belt_id).filter((id): id is string => Boolean(id)))];
  const { data: belts } =
    beltIds.length > 0
      ? await supabase.from("belts").select("id, name, color_hex").in("id", beltIds)
      : { data: [] };
  const beltById = new Map((belts ?? []).map((b) => [b.id, b]));

  return {
    instructors: (teachers ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      photoUrl: t.photo_url,
    })),
    students: (directory ?? []).map((s) => {
      const belt = s.current_belt_id ? beltById.get(s.current_belt_id) : undefined;
      return {
        id: s.id!,
        name: s.name ?? "",
        photoUrl: s.photo_url,
        beltName: belt?.name ?? null,
        beltColorHex: belt?.color_hex ?? null,
        currentDegree: s.current_degree ?? 0,
      };
    }),
    classes: (classGroups ?? [])
      .map((c) => ({
        id: c.id,
        name: c.name,
        startTime: c.start_time,
        endTime: c.end_time,
        teacherName: c.teachers?.name ?? null,
        status: c.status,
        startDate: c.start_date,
        endDate: c.end_date,
        weekDays: c.week_days ?? [],
      }))
      // ordenação cronológica da semana: primeiro dia em que a turma ocorre, depois horário.
      .sort((a, b) => {
        const firstDayA = Math.min(...(a.weekDays.length ? a.weekDays : [7]));
        const firstDayB = Math.min(...(b.weekDays.length ? b.weekDays : [7]));
        if (firstDayA !== firstDayB) return firstDayA - firstDayB;
        return a.startTime.localeCompare(b.startTime);
      }),
  };
}
