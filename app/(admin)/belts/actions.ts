"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import {
  beltSchema,
  beltSystemSchema,
  type BeltInput,
  type BeltSystemInput,
} from "@/lib/validations/belt";

export type BeltActionResult = { error?: string };

export async function createBeltSystem(
  input: BeltSystemInput,
): Promise<BeltActionResult> {
  const profile = await requireRole("admin");
  const parsed = beltSystemSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("belt_systems").insert({
    school_id: profile.schoolId,
    modality_id: parsed.data.modalityId,
    name: parsed.data.name,
    audience: parsed.data.audience,
    description: parsed.data.description || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/belts");
  return {};
}

export async function updateBeltSystem(
  id: string,
  input: BeltSystemInput,
): Promise<BeltActionResult> {
  await requireRole("admin");
  const parsed = beltSystemSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("belt_systems")
    .update({
      modality_id: parsed.data.modalityId,
      name: parsed.data.name,
      audience: parsed.data.audience,
      description: parsed.data.description || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/belts");
  return {};
}

export async function createBelt(
  beltSystemId: string,
  input: BeltInput,
): Promise<BeltActionResult> {
  const profile = await requireRole("admin");
  const parsed = beltSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("belts").insert({
    school_id: profile.schoolId,
    belt_system_id: beltSystemId,
    name: parsed.data.name,
    color_hex: parsed.data.colorHex || null,
    ordering: parsed.data.ordering,
    max_degrees: parsed.data.maxDegrees,
  });

  if (error) return { error: error.message };

  revalidatePath("/belts");
  return {};
}

export async function updateBelt(
  id: string,
  input: BeltInput,
): Promise<BeltActionResult> {
  await requireRole("admin");
  const parsed = beltSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("belts")
    .update({
      name: parsed.data.name,
      color_hex: parsed.data.colorHex || null,
      ordering: parsed.data.ordering,
      max_degrees: parsed.data.maxDegrees,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/belts");
  return {};
}
