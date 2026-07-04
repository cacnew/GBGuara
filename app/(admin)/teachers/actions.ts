"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { teacherSchema, type TeacherInput } from "@/lib/validations/teacher";

export type TeacherActionResult = { error?: string };

export async function createTeacherProfile(
  input: TeacherInput,
): Promise<TeacherActionResult> {
  const profile = await requireRole("admin");
  const parsed = teacherSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("teachers").insert({
    school_id: profile.schoolId,
    name: parsed.data.name,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    photo_url: parsed.data.photoUrl || null,
    status: parsed.data.status,
    notes: parsed.data.notes || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/teachers");
  return {};
}

export async function updateTeacherProfile(
  id: string,
  input: TeacherInput,
): Promise<TeacherActionResult> {
  await requireRole("admin");
  const parsed = teacherSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("teachers")
    .update({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      photo_url: parsed.data.photoUrl || null,
      status: parsed.data.status,
      notes: parsed.data.notes || null,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/teachers");
  return {};
}
