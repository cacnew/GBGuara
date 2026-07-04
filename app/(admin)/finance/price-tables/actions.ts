"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import {
  priceTableSchema,
  type PriceTableInput,
} from "@/lib/validations/price-table";

export type PriceTableActionResult = { error?: string };

export async function createPriceTable(
  input: PriceTableInput,
): Promise<PriceTableActionResult> {
  const profile = await requireRole("admin");
  const parsed = priceTableSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("price_tables").insert({
    school_id: profile.schoolId,
    name: parsed.data.name,
    description: parsed.data.description || null,
    valid_from: parsed.data.validFrom,
    valid_until: parsed.data.validUntil || null,
    status: parsed.data.status,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/finance/price-tables");
  return {};
}

export async function updatePriceTable(
  id: string,
  input: PriceTableInput,
): Promise<PriceTableActionResult> {
  await requireRole("admin");
  const parsed = priceTableSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("price_tables")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      valid_from: parsed.data.validFrom,
      valid_until: parsed.data.validUntil || null,
      status: parsed.data.status,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/finance/price-tables");
  return {};
}
