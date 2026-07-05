import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MetricCard } from "@/components/dashboard/metric-card";
import { buttonVariants } from "@/components/ui/button";

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function monthBounds(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export default async function FinanceDashboardPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { start: monthStart, end: monthEnd } = monthBounds();
  const sevenDaysAhead = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [
    { data: expectedInstallments },
    { data: incomeMovements },
    { data: refundMovements },
    { data: overdueRows },
    { data: openInstallments },
    { count: overdueStudentsCount },
    { count: activeContractsCount },
    { count: overdueInstallmentsCount },
    { count: dueSoonCount },
  ] = await Promise.all([
    supabase
      .from("contract_installments")
      .select("amount")
      .gte("reference_month", monthStart)
      .lt("reference_month", monthEnd)
      .neq("status", "canceled"),
    supabase
      .from("financial_movements")
      .select("amount")
      .eq("type", "income")
      .gte("movement_date", monthStart)
      .lt("movement_date", monthEnd),
    supabase
      .from("financial_movements")
      .select("amount")
      .eq("type", "refund")
      .gte("movement_date", monthStart)
      .lt("movement_date", monthEnd),
    supabase.from("overdue_students").select("overdue_amount"),
    supabase
      .from("contract_installments")
      .select("remaining_amount")
      .in("status", ["pending", "partially_paid"]),
    supabase.from("overdue_students").select("student_id", { count: "exact", head: true }),
    supabase
      .from("contracts")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("contract_installments")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "partially_paid"])
      .lt("due_date", today),
    supabase
      .from("contract_installments")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "partially_paid"])
      .gte("due_date", today)
      .lte("due_date", sevenDaysAhead),
  ]);

  const expectedRevenueMonth = (expectedInstallments ?? []).reduce((s, r) => s + r.amount, 0);
  const incomeSum = (incomeMovements ?? []).reduce((s, r) => s + r.amount, 0);
  const refundSum = (refundMovements ?? []).reduce((s, r) => s + r.amount, 0);
  const receivedRevenueMonth = incomeSum - refundSum;
  const overdueAmount = (overdueRows ?? []).reduce((s, r) => s + (r.overdue_amount ?? 0), 0);
  const openAmount = (openInstallments ?? []).reduce((s, r) => s + r.remaining_amount, 0);

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 text-foreground">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Dashboard financeiro</h1>
        <Link href="/finance/reports" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Receita por período
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Receita prevista do mês" value={formatMoney(expectedRevenueMonth)} />
        <MetricCard label="Receita recebida do mês" value={formatMoney(receivedRevenueMonth)} />
        <MetricCard label="Valor em aberto" value={formatMoney(openAmount)} />
        <MetricCard
          label="Valor vencido"
          value={formatMoney(overdueAmount)}
          variant="destructive"
          href="/finance/overdue"
        />
        <MetricCard
          label="Alunos inadimplentes"
          value={overdueStudentsCount ?? 0}
          variant="destructive"
          href="/finance/overdue"
        />
        <MetricCard label="Contratos ativos" value={activeContractsCount ?? 0} />
        <MetricCard
          label="Parcelas vencidas"
          value={overdueInstallmentsCount ?? 0}
          variant="destructive"
          href="/finance/installments?status=pending"
        />
        <MetricCard
          label="Parcelas a vencer em 7 dias"
          value={dueSoonCount ?? 0}
          href="/finance/installments"
        />
      </div>
    </div>
  );
}
