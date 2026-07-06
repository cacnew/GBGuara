import { BackLink } from "@/components/layout/back-link";
import { PriceTableForm } from "../price-table-form";

export default function NewPriceTablePage() {
  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="flex w-full max-w-sm items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">
          Nova tabela de preco
        </h1>
        <BackLink href="/finance/price-tables" />
      </div>
      <PriceTableForm />
    </div>
  );
}
