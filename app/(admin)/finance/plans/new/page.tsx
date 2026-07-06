import { BackLink } from "@/components/layout/back-link";
import { createClient } from "@/lib/supabase/server";
import type { PlanInput } from "@/lib/validations/plan";
import { PlanForm } from "../plan-form";

export default async function NewPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ priceTableId?: string }>;
}) {
  const { priceTableId } = await searchParams;
  const supabase = await createClient();
  const { data: priceTables } = await supabase
    .from("price_tables")
    .select("id, name")
    .order("valid_from", { ascending: false });

  const defaultValues: Partial<PlanInput> | undefined = priceTableId
    ? {
        priceTableId,
        durationMonths: 1,
        basePrice: 0,
        setupFee: 0,
        loyaltyMonths: 0,
        status: "active",
      }
    : undefined;

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="flex w-full max-w-sm items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">Novo plano</h1>
        <BackLink href="/finance/plans" />
      </div>
      <PlanForm
        priceTables={priceTables ?? []}
        defaultValues={defaultValues as PlanInput | undefined}
      />
    </div>
  );
}
