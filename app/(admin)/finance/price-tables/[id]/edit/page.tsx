import { notFound } from "next/navigation";
import { BackLink } from "@/components/layout/back-link";
import { createClient } from "@/lib/supabase/server";
import type { PriceTableInput } from "@/lib/validations/price-table";
import { PriceTableForm } from "../../price-table-form";

export default async function EditPriceTablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: priceTable } = await supabase
    .from("price_tables")
    .select("id, name, description, valid_from, valid_until, status")
    .eq("id", id)
    .single();

  if (!priceTable) notFound();

  const defaultValues: PriceTableInput = {
    name: priceTable.name,
    description: priceTable.description ?? "",
    validFrom: priceTable.valid_from,
    validUntil: priceTable.valid_until ?? "",
    status: priceTable.status as PriceTableInput["status"],
  };

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="flex w-full max-w-sm items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">
          Editar tabela de preco
        </h1>
        <BackLink href="/finance/price-tables" />
      </div>
      <PriceTableForm id={priceTable.id} defaultValues={defaultValues} />
    </div>
  );
}
