"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import {
  classGroupSchema,
  type ClassGroupInput,
} from "@/lib/validations/class-group";

export type ClassGroupActionResult = { error?: string };

export async function createClassGroup(
  input: ClassGroupInput,
): Promise<ClassGroupActionResult> {
  const profile = await requireRole("admin");
  const parsed = classGroupSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { data: unit } = await supabase
    .from("units")
    .select("id")
    .eq("school_id", profile.schoolId)
    .limit(1)
    .single();

  if (!unit) {
    return { error: "Nenhuma unidade encontrada para a escola" };
  }

  const { error } = await supabase.from("class_groups").insert({
    school_id: profile.schoolId,
    unit_id: unit.id,
    name: parsed.data.name,
    modality_id: parsed.data.modalityId,
    main_teacher_id: parsed.data.mainTeacherId || null,
    week_days: parsed.data.weekDays.map(Number),
    start_time: parsed.data.startTime,
    end_time: parsed.data.endTime,
    suggested_audience: parsed.data.suggestedAudience || null,
    suggested_student_limit: parsed.data.suggestedStudentLimit,
    notes: parsed.data.notes || null,
    status: parsed.data.status,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/classes");
  return {};
}

export async function updateClassGroup(
  id: string,
  input: ClassGroupInput,
): Promise<ClassGroupActionResult> {
  await requireRole("admin");
  const parsed = classGroupSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("class_groups")
    .update({
      name: parsed.data.name,
      modality_id: parsed.data.modalityId,
      main_teacher_id: parsed.data.mainTeacherId || null,
      week_days: parsed.data.weekDays.map(Number),
      start_time: parsed.data.startTime,
      end_time: parsed.data.endTime,
      suggested_audience: parsed.data.suggestedAudience || null,
      suggested_student_limit: parsed.data.suggestedStudentLimit,
      notes: parsed.data.notes || null,
      status: parsed.data.status,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/classes");
  return {};
}
