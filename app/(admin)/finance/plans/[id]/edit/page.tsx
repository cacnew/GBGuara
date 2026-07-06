import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PlanInput } from "@/lib/validations/plan";
import { PlanForm } from "../../plan-form";

export default async function EditPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: plan } = await supabase
    .from("plans")
    .select(
      "id, price_table_id, name, plan_duration, duration_months, base_price, setup_fee, loyalty_months, description, status",
    )
    .eq("id", id)
    .single();

  if (!plan) notFound();

  const { data: priceTables } = await supabase
    .from("price_tables")
    .select("id, name")
    .order("valid_from", { ascending: false });

  const defaultValues: PlanInput = {
    priceTableId: plan.price_table_id,
    name: plan.name,
    planDuration: plan.plan_duration as PlanInput["planDuration"],
    durationMonths: plan.duration_months,
    basePrice: plan.base_price,
    setupFee: plan.setup_fee,
    loyaltyMonths: plan.loyalty_months,
    description: plan.description ?? "",
    status: plan.status as PlanInput["status"],
  };

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="w-full max-w-sm">
        <h1 className="font-heading text-2xl font-semibold">Editar plano</h1>
      </div>
      <PlanForm
        id={plan.id}
        priceTables={priceTables ?? []}
        defaultValues={defaultValues}
      />
    </div>
  );
}
