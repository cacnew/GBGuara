import { PriceTableForm } from "../price-table-form";

export default function NewPriceTablePage() {
  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="w-full max-w-sm">
        <h1 className="font-heading text-2xl font-semibold">
          Nova tabela de preço
        </h1>
      </div>
      <PriceTableForm />
    </div>
  );
}
