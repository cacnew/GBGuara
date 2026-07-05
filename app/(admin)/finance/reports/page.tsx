import { createClient } from "@/lib/supabase/server";

const MONTH_NAMES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function monthBounds(monthsAgo: number, from = new Date()) {
  const start = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth() - monthsAgo, 1),
  );
  const end = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth() - monthsAgo + 1, 1),
  );
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    label: `${MONTH_NAMES[start.getUTCMonth()]}/${start.getUTCFullYear()}`,
  };
}

export default async function FinanceReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ months?: string }>;
}) {
  const { months: monthsParam } = await searchParams;
  const monthsCount = Math.min(Math.max(Number(monthsParam) || 6, 1), 24);

  const supabase = await createClient();

  const ranges = Array.from({ length: monthsCount }, (_, i) =>
    monthBounds(monthsCount - 1 - i),
  );

  const rows = await Promise.all(
    ranges.map(async ({ start, end, label }) => {
      const [{ data: expected }, { data: income }, { data: refunds }] =
        await Promise.all([
          supabase
            .from("contract_installments")
            .select("amount")
            .gte("reference_month", start)
            .lt("reference_month", end)
            .neq("status", "canceled"),
          supabase
            .from("financial_movements")
            .select("amount")
            .eq("type", "income")
            .gte("movement_date", start)
            .lt("movement_date", end),
          supabase
            .from("financial_movements")
            .select("amount")
            .eq("type", "refund")
            .gte("movement_date", start)
            .lt("movement_date", end),
        ]);

      const expectedRevenue = (expected ?? []).reduce((s, r) => s + r.amount, 0);
      const receivedRevenue =
        (income ?? []).reduce((s, r) => s + r.amount, 0) -
        (refunds ?? []).reduce((s, r) => s + r.amount, 0);

      return { label, expectedRevenue, receivedRevenue };
    }),
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 text-foreground">
      <h1 className="font-heading text-2xl font-semibold">
        Receita por período
      </h1>
      <p className="text-sm text-muted-foreground">
        Últimos {monthsCount} meses. Use <code>?months=12</code> na URL para
        ajustar o período.
      </p>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Mês</th>
              <th className="p-3 font-medium">Receita prevista</th>
              <th className="p-3 font-medium">Receita recebida</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-border">
                <td className="p-3">{row.label}</td>
                <td className="p-3 text-muted-foreground">
                  {formatMoney(row.expectedRevenue)}
                </td>
                <td className="p-3">{formatMoney(row.receivedRevenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
