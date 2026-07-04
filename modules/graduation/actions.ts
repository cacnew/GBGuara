"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { graduationSchema, type GraduationInput } from "@/lib/validations/graduation";

export type GraduationActionResult = { error?: string };

export async function registerGraduation(
  studentId: string,
  input: GraduationInput,
): Promise<GraduationActionResult> {
  const profile = await requireRole("admin");
  const parsed = graduationSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("current_belt_id, current_degree")
    .eq("id", studentId)
    .single();

  if (studentError || !student) {
    return { error: "Aluno não encontrado" };
  }

  const { data: belt, error: beltError } = await supabase
    .from("belts")
    .select("id, belt_systems(modality_id)")
    .eq("id", data.newBeltId)
    .single();

  if (beltError || !belt) {
    return { error: "Faixa inválida" };
  }

  const modalityId = belt.belt_systems?.modality_id;
  if (!modalityId) {
    return { error: "Não foi possível identificar a modalidade da faixa selecionada" };
  }

  const { error } = await supabase.from("graduation_history").insert({
    school_id: profile.schoolId,
    student_id: studentId,
    modality_id: modalityId,
    previous_belt_id: student.current_belt_id,
    previous_degree: student.current_degree,
    new_belt_id: data.newBeltId,
    new_degree: data.newDegree,
    graduation_date: data.graduationDate,
    registered_by_teacher_id: data.teacherId || null,
    notes: data.notes || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/students/${studentId}/edit`);
  return {};
}
