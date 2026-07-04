"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { studentSchema, type StudentInput } from "@/lib/validations/student";

export type StudentActionResult = { error?: string };

export async function createStudent(
  input: StudentInput,
): Promise<StudentActionResult> {
  const profile = await requireRole("admin");
  const parsed = studentSchema.safeParse(input);

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

  const { error } = await supabase.from("students").insert({
    school_id: profile.schoolId,
    unit_id: unit.id,
    name: parsed.data.name,
    birth_date: parsed.data.birthDate,
    cpf: parsed.data.cpf || null,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    address: parsed.data.address || null,
    emergency_contact: parsed.data.emergencyContact || null,
    status: parsed.data.status,
    notes: parsed.data.notes || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/students");
  return {};
}

export async function updateStudent(
  id: string,
  input: StudentInput,
): Promise<StudentActionResult> {
  await requireRole("admin");
  const parsed = studentSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({
      name: parsed.data.name,
      birth_date: parsed.data.birthDate,
      cpf: parsed.data.cpf || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      emergency_contact: parsed.data.emergencyContact || null,
      status: parsed.data.status,
      notes: parsed.data.notes || null,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/students");
  return {};
}
