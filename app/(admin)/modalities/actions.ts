"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { modalitySchema, type ModalityInput } from "@/lib/validations/modality";

export type ModalityActionResult = { error?: string };

export async function createModality(
  input: ModalityInput,
): Promise<ModalityActionResult> {
  const profile = await requireRole("admin");
  const parsed = modalitySchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("modalities").insert({
    school_id: profile.schoolId,
    ...parsed.data,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/modalities");
  return {};
}

export async function updateModality(
  id: string,
  input: ModalityInput,
): Promise<ModalityActionResult> {
  await requireRole("admin");
  const parsed = modalitySchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("modalities")
    .update(parsed.data)
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/modalities");
  return {};
}
