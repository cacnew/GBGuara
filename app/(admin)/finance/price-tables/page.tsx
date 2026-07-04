import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";

const STATUS_LABEL: Record<string, string> = {
  active: "Ativa",
  inactive: "Inativa",
  legacy: "Legada",
};

export default async function PriceTablesPage() {
  const supabase = await createClient();
  const { data: priceTables } = await supabase
    .from("price_tables")
    .select("id, name, valid_from, valid_until, status, plans(id)")
    .order("valid_from", { ascending: false });

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 text-foreground">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">
          Tabelas de preço
        </h1>
        <Link href="/finance/price-tables/new" className={buttonVariants()}>
          Nova tabela
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Nome</th>
              <th className="p-3 font-medium">Vigência</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Planos</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {priceTables?.map((pt) => (
              <tr key={pt.id} className="border-t border-border">
                <td className="p-3">{pt.name}</td>
                <td className="p-3 text-muted-foreground">
                  {new Date(pt.valid_from).toLocaleDateString("pt-BR")}
                  {pt.valid_until
                    ? ` – ${new Date(pt.valid_until).toLocaleDateString("pt-BR")}`
                    : " – sem fim definido"}
                </td>
                <td className="p-3">{STATUS_LABEL[pt.status]}</td>
                <td className="p-3 text-muted-foreground">
                  {pt.plans?.length ?? 0}
                </td>
                <td className="p-3 text-right">
                  <Link
                    href={`/finance/plans?priceTableId=${pt.id}`}
                    className="mr-3 text-primary hover:underline"
                  >
                    Planos
                  </Link>
                  <Link
                    href={`/finance/price-tables/${pt.id}/edit`}
                    className="text-primary hover:underline"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {!priceTables?.length && (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={5}>
                  Nenhuma tabela de preço cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
