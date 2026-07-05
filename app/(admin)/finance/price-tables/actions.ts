"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import {
  priceTableSchema,
  type PriceTableInput,
} from "@/lib/validations/price-table";
import { logAuditEvent } from "@/modules/audit/log";

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
  const { data: priceTable, error } = await supabase
    .from("price_tables")
    .insert({
      school_id: profile.schoolId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      valid_from: parsed.data.validFrom,
      valid_until: parsed.data.validUntil || null,
      status: parsed.data.status,
    })
    .select("id")
    .single();

  if (error || !priceTable) {
    return { error: error?.message ?? "Não foi possível criar a tabela de preço" };
  }

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "price_table",
    entityId: priceTable.id,
    action: "price_table_created",
  });

  revalidatePath("/finance/price-tables");
  return {};
}

export async function updatePriceTable(
  id: string,
  input: PriceTableInput,
): Promise<PriceTableActionResult> {
  const profile = await requireRole("admin");
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

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "price_table",
    entityId: id,
    action: "price_table_updated",
  });

  revalidatePath("/finance/price-tables");
  return {};
}
