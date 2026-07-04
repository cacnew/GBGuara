"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { planSchema, type PlanInput } from "@/lib/validations/plan";

export type PlanActionResult = { error?: string };

function toRow(profileSchoolId: string, data: PlanInput) {
  return {
    school_id: profileSchoolId,
    price_table_id: data.priceTableId,
    name: data.name,
    plan_duration: data.planDuration,
    duration_months: data.durationMonths,
    base_price: data.basePrice,
    classes_per_week: data.unlimited ? null : data.classesPerWeek,
    classes_total: data.unlimited ? null : data.classesTotal,
    unlimited: data.unlimited,
    setup_fee: data.setupFee,
    loyalty_months: data.loyaltyMonths,
    description: data.description || null,
    status: data.status,
  };
}

export async function createPlan(input: PlanInput): Promise<PlanActionResult> {
  const profile = await requireRole("admin");
  const parsed = planSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("plans")
    .insert(toRow(profile.schoolId, parsed.data));

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/finance/plans");
  return {};
}

export async function updatePlan(
  id: string,
  input: PlanInput,
): Promise<PlanActionResult> {
  const profile = await requireRole("admin");
  const parsed = planSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("plans")
    .update(toRow(profile.schoolId, parsed.data))
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/finance/plans");
  return {};
}
