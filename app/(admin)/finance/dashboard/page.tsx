import Link from "next/link";
import { MetricCard } from "@/components/dashboard/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function monthBounds(month?: string) {
  const base = month ? new Date(`${month}-01T00:00:00Z`) : new Date();
  const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1));
  const end = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 1));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    label: start.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }),
    monthValue: start.toISOString().slice(0, 7),
    prev: new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - 1, 1))
      .toISOString()
      .slice(0, 7),
    next: new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1))
      .toISOString()
      .slice(0, 7),
  };
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  paid: "Paga",
  partially_paid: "Parcial",
  overdue: "Vencida",
  canceled: "Cancelada",
  refunded: "Estornada",
};

export default async function FinanceDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { start: monthStart, end: monthEnd, label, monthValue, prev, next } = monthBounds(month);
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
    { data: dueSoonRows },
    { data: recentPayments },
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
    supabase
      .from("contract_installments")
      .select("id, due_date, amount, remaining_amount, status, contracts(plans(name), contract_students(students(id, name)))")
      .in("status", ["pending", "partially_paid"])
      .gte("due_date", today)
      .lte("due_date", sevenDaysAhead)
      .order("due_date")
      .limit(6),
    supabase
      .from("financial_movements")
      .select("id, amount, movement_date, description, students(id, name)")
      .eq("type", "income")
      .order("movement_date", { ascending: false })
      .limit(6),
  ]);

  const expectedRevenueMonth = (expectedInstallments ?? []).reduce((sum, row) => sum + row.amount, 0);
  const incomeSum = (incomeMovements ?? []).reduce((sum, row) => sum + row.amount, 0);
  const refundSum = (refundMovements ?? []).reduce((sum, row) => sum + row.amount, 0);
  const receivedRevenueMonth = incomeSum - refundSum;
  const overdueAmount = (overdueRows ?? []).reduce((sum, row) => sum + (row.overdue_amount ?? 0), 0);
  const openAmount = (openInstallments ?? []).reduce((sum, row) => sum + row.remaining_amount, 0);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Financeiro</h1>
          <p className="text-sm capitalize text-muted-foreground">Resumo de {label}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/finance/installments" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Parcelas
          </Link>
          <Link href="/finance/overdue" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Inadimplentes
          </Link>
          <Link href="/finance/reports" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Relatorios
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
        <Link href={`/finance/dashboard?month=${prev}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
          Mes anterior
        </Link>
        <span className="rounded-lg bg-secondary px-3 py-2 text-sm font-bold capitalize">
          {label}
        </span>
        <Link href={`/finance/dashboard?month=${next}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
          Proximo mes
        </Link>
        <Link href="/finance/dashboard" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Hoje
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Receita prevista" value={formatMoney(expectedRevenueMonth)} />
        <MetricCard label="Receita recebida" value={formatMoney(receivedRevenueMonth)} />
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
          variant={(overdueStudentsCount ?? 0) > 0 ? "destructive" : "default"}
          href="/finance/overdue"
        />
        <MetricCard label="Contratos ativos" value={activeContractsCount ?? 0} />
        <MetricCard
          label="Parcelas vencidas"
          value={overdueInstallmentsCount ?? 0}
          variant={(overdueInstallmentsCount ?? 0) > 0 ? "destructive" : "default"}
          href="/finance/installments?status=pending"
        />
        <MetricCard
          label="Vencem em 7 dias"
          value={dueSoonCount ?? 0}
          href="/finance/installments"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <h2 className="font-heading text-lg font-semibold">Proximos vencimentos</h2>
              <p className="text-sm text-muted-foreground">Parcelas pendentes nos proximos 7 dias.</p>
            </div>
            <Link href={`/finance/installments?month=${monthValue}`} className="text-sm text-primary hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="divide-y divide-border">
            {(dueSoonRows ?? []).map((row) => {
              const student = row.contracts?.contract_students?.[0]?.students;
              return (
                <div key={row.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                  <div>
                    <p className="font-bold">{student?.name ?? "Aluno"}</p>
                    <p className="text-muted-foreground">
                      {row.contracts?.plans?.name ?? "Plano"} · vence em {formatDate(row.due_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatMoney(row.remaining_amount)}</p>
                    <StatusBadge value={row.status} label={STATUS_LABEL[row.status] ?? row.status} />
                  </div>
                </div>
              );
            })}
            {!dueSoonRows?.length && (
              <p className="p-4 text-sm text-muted-foreground">Nenhuma parcela vencendo nos proximos dias.</p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <h2 className="font-heading text-lg font-semibold">Pagamentos recentes</h2>
              <p className="text-sm text-muted-foreground">Ultimas entradas registradas.</p>
            </div>
            <Link href="/finance/installments?status=paid" className="text-sm text-primary hover:underline">
              Ver pagos
            </Link>
          </div>
          <div className="divide-y divide-border">
            {(recentPayments ?? []).map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                <div>
                  <p className="font-bold">{row.students?.name ?? "Aluno"}</p>
                  <p className="text-muted-foreground">
                    {row.description ?? "Pagamento"} · {formatDate(row.movement_date)}
                  </p>
                </div>
                <p className="font-bold text-emerald-700">{formatMoney(row.amount)}</p>
              </div>
            ))}
            {!recentPayments?.length && (
              <p className="p-4 text-sm text-muted-foreground">Nenhum pagamento registrado.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
