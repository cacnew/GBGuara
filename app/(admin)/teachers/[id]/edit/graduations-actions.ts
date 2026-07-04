"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import {
  teacherGraduationSchema,
  type TeacherGraduationInput,
} from "@/lib/validations/teacher-graduation";

export type TeacherGraduationActionResult = { error?: string };

export async function addTeacherGraduation(
  teacherId: string,
  input: TeacherGraduationInput,
): Promise<TeacherGraduationActionResult> {
  const profile = await requireRole("admin");
  const parsed = teacherGraduationSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("teacher_graduations").insert({
    school_id: profile.schoolId,
    teacher_id: teacherId,
    modality_id: parsed.data.modalityId,
    belt_id: parsed.data.beltId,
    degree: parsed.data.degree,
    since_date: parsed.data.sinceDate,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/teachers/${teacherId}/edit`);
  return {};
}
