import Link from "next/link";
import { getCurrentUserProfile } from "@/modules/users/queries";
import { buttonVariants } from "@/components/ui/button";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SummaryList } from "@/components/dashboard/summary-list";
import { getAdminDashboardData } from "./queries";

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export default async function AdminDashboardPage() {
  const profile = await getCurrentUserProfile();
  const data = await getAdminDashboardData();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 text-foreground">
      <div>
        <h1 className="font-heading text-2xl font-semibold">
          Dashboard do administrador
        </h1>
        <p className="text-muted-foreground">Olá, {profile?.name}.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard label="Alunos ativos" value={data.activeStudents} href="/students" />
        <MetricCard
          label="Alunos inadimplentes"
          value={data.overdueStudentsCount}
          variant="destructive"
          href="/finance/overdue"
        />
        <MetricCard label="Professores ativos" value={data.activeTeachers} href="/teachers" />
        <MetricCard label="Turmas ativas" value={data.activeClassGroups} href="/classes" />
        <MetricCard
          label="Receita prevista do mês"
          value={formatMoney(data.expectedRevenueMonth)}
        />
        <MetricCard
          label="Receita recebida do mês"
          value={formatMoney(data.receivedRevenueMonth)}
        />
        <MetricCard
          label="Valor vencido"
          value={formatMoney(data.overdueAmount)}
          variant="destructive"
          href="/finance/overdue"
        />
        <MetricCard label="Presenças no mês" value={data.attendancesMonth} />
        <MetricCard
          label="Sem frequência há 15+ dias"
          value={data.absentStudentsCount}
          variant={data.absentStudentsCount > 0 ? "destructive" : "default"}
        />
        <MetricCard
          label="Próximos vencimentos (7 dias)"
          value={data.upcomingDueCount}
          href="/finance/installments"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SummaryList
          title="Inadimplentes"
          viewAllHref="/finance/overdue"
          emptyMessage="Nenhum aluno inadimplente."
          items={data.overdueList.map((row) => ({
            id: row.studentId,
            primary: row.studentName,
            secondary: `${row.daysOverdue} dias em atraso`,
            trailing: formatMoney(row.amount),
            href: `/students/${row.studentId}/edit`,
          }))}
        />

        <SummaryList
          title="Ausentes há 15+ dias"
          emptyMessage="Nenhum aluno ausente."
          items={data.absentStudents.map((row) => ({
            id: row.studentId,
            primary: row.studentName,
            secondary: row.lastAttendance
              ? `Última presença: ${formatDate(row.lastAttendance)}`
              : "Nunca compareceu",
            href: `/students/${row.studentId}/edit`,
          }))}
        />

        <SummaryList
          title="Últimas presenças"
          emptyMessage="Nenhuma presença registrada."
          items={data.recentAttendances.map((row) => ({
            id: row.id,
            primary: row.studentName,
            secondary: row.className,
            trailing: formatDate(row.date),
          }))}
        />

        <SummaryList
          title="Últimas graduações"
          emptyMessage="Nenhuma graduação registrada."
          items={data.recentGraduations.map((row) => ({
            id: row.id,
            primary: row.studentName,
            secondary: `${row.beltName} — grau ${row.degree}`,
            trailing: formatDate(row.date),
          }))}
        />

        <SummaryList
          title="Turmas do dia"
          viewAllHref="/today"
          emptyMessage="Nenhuma turma prevista para hoje."
          items={data.todaysClasses.map((row) => ({
            id: row.id,
            primary: row.name,
            secondary: `${row.modalityName ?? "-"} · ${row.teacherName ?? "sem professor definido"}`,
            trailing: row.startTime?.slice(0, 5),
          }))}
        />

        <SummaryList
          title="Pagamentos recentes"
          viewAllHref="/finance/installments"
          emptyMessage="Nenhum pagamento registrado."
          items={data.recentPayments.map((row) => ({
            id: row.id,
            primary: row.studentName,
            secondary: formatDate(row.date),
            trailing: formatMoney(row.amount),
          }))}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/students" className={buttonVariants({ className: "w-fit" })}>
          Alunos
        </Link>
        <Link href="/leads" className={buttonVariants({ variant: "outline", className: "w-fit" })}>
          Leads
        </Link>
        <Link href="/today" className={buttonVariants({ variant: "outline", className: "w-fit" })}>
          Turmas do dia
        </Link>
        <Link href="/classes" className={buttonVariants({ variant: "outline", className: "w-fit" })}>
          Turmas
        </Link>
        <Link
          href="/classes/sessions"
          className={buttonVariants({ variant: "outline", className: "w-fit" })}
        >
          Sessões futuras
        </Link>
        <Link href="/teachers" className={buttonVariants({ variant: "outline", className: "w-fit" })}>
          Professores
        </Link>
        <Link
          href="/teachers/login/new"
          className={buttonVariants({ variant: "outline", className: "w-fit" })}
        >
          Cadastrar login de professor
        </Link>
        <Link
          href="/modalities"
          className={buttonVariants({ variant: "outline", className: "w-fit" })}
        >
          Modalidades
        </Link>
        <Link
          href="/belts"
          className={buttonVariants({ variant: "outline", className: "w-fit" })}
        >
          Faixas
        </Link>
        <Link
          href="/finance/price-tables"
          className={buttonVariants({ variant: "outline", className: "w-fit" })}
        >
          Tabelas de preço
        </Link>
        <Link
          href="/finance/plans"
          className={buttonVariants({ variant: "outline", className: "w-fit" })}
        >
          Planos
        </Link>
        <Link
          href="/finance/installments"
          className={buttonVariants({ variant: "outline", className: "w-fit" })}
        >
          Parcelas
        </Link>
        <Link
          href="/finance/overdue"
          className={buttonVariants({ variant: "outline", className: "w-fit" })}
        >
          Inadimplentes
        </Link>
      </div>
    </div>
  );
}
