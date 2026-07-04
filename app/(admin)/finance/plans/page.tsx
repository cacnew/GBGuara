import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";

const DURATION_LABEL: Record<string, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  annual: "Anual",
  drop_in: "Aula avulsa",
  package: "Pacote",
  trial: "Trial",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  inactive: "Inativo",
  legacy: "Legado",
};

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<{ priceTableId?: string }>;
}) {
  const { priceTableId } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("plans")
    .select("id, name, plan_duration, base_price, status, price_tables(name)")
    .order("name");

  if (priceTableId) {
    query = query.eq("price_table_id", priceTableId);
  }

  const { data: plans } = await query;

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 text-foreground">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Planos</h1>
        <Link
          href={
            priceTableId
              ? `/finance/plans/new?priceTableId=${priceTableId}`
              : "/finance/plans/new"
          }
          className={buttonVariants()}
        >
          Novo plano
        </Link>
      </div>

      {priceTableId && (
        <p className="text-sm text-muted-foreground">
          Filtrando por tabela de preço.{" "}
          <Link href="/finance/plans" className="text-primary hover:underline">
            Ver todos
          </Link>
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Nome</th>
              <th className="p-3 font-medium">Tabela</th>
              <th className="p-3 font-medium">Duração</th>
              <th className="p-3 font-medium">Preço base</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {plans?.map((plan) => (
              <tr key={plan.id} className="border-t border-border">
                <td className="p-3">{plan.name}</td>
                <td className="p-3 text-muted-foreground">
                  {plan.price_tables?.name ?? "-"}
                </td>
                <td className="p-3 text-muted-foreground">
                  {DURATION_LABEL[plan.plan_duration] ?? plan.plan_duration}
                </td>
                <td className="p-3 text-muted-foreground">
                  {formatMoney(plan.base_price)}
                </td>
                <td className="p-3">{STATUS_LABEL[plan.status]}</td>
                <td className="p-3 text-right">
                  <Link
                    href={`/finance/plans/${plan.id}/edit`}
                    className="text-primary hover:underline"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {!plans?.length && (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={6}>
                  Nenhum plano cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
