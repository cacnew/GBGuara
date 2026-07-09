import Link from "next/link";
import { getCurrentUserProfile } from "@/modules/users/queries";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SummaryList } from "@/components/dashboard/summary-list";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonVariants } from "@/components/ui/button";
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">
            Olá, {profile?.name ?? "admin"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Visao operacional da escola para hoje.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/today" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Turmas de hoje
          </Link>
          <Link href="/students/new" className={buttonVariants({ size: "sm" })}>
            Novo aluno
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Alunos ativos" value={data.activeStudents} href="/students" />
        <MetricCard
          label="Inadimplentes"
          value={data.overdueStudentsCount}
          variant={data.overdueStudentsCount > 0 ? "destructive" : "default"}
          href="/finance/overdue"
        />
        <MetricCard label="Turmas ativas" value={data.activeClassGroups} href="/classes" />
        <MetricCard
          label="Receita recebida"
          value={formatMoney(data.receivedRevenueMonth)}
          href="/finance/dashboard"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)]">
        <section className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <h2 className="font-heading text-lg font-semibold">Visao operacional - hoje</h2>
              <p className="text-sm text-muted-foreground">Aulas previstas pela grade recorrente.</p>
            </div>
            <Link href="/today" className="text-sm text-primary hover:underline">
              Abrir chamada
            </Link>
          </div>
          <div className="divide-y divide-border">
            {data.todaysClasses.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                <div>
                  <p className="font-bold">{row.name}</p>
                  <p className="text-muted-foreground">
                    {row.modalityName ?? "-"} · {row.teacherName ?? "sem professor definido"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    {row.startTime?.slice(0, 5)}
                    {row.endTime ? ` - ${row.endTime.slice(0, 5)}` : ""}
                  </p>
                  <StatusBadge value="agendada" label="Prevista" />
                </div>
              </div>
            ))}
            {!data.todaysClasses.length && (
              <p className="p-4 text-sm text-muted-foreground">Nenhuma turma prevista para hoje.</p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="font-heading text-lg font-semibold">Alertas</h2>
          <div className="mt-3 space-y-3">
            <Link
              href="/finance/overdue"
              className="block rounded-lg border border-border p-3 hover:bg-secondary"
            >
              <p className="text-sm font-bold">Inadimplencia</p>
              <p className="text-sm text-muted-foreground">
                {data.overdueStudentsCount} aluno(s), {formatMoney(data.overdueAmount)} vencidos.
              </p>
            </Link>
            <Link
              href="/finance/installments"
              className="block rounded-lg border border-border p-3 hover:bg-secondary"
            >
              <p className="text-sm font-bold">Proximos vencimentos</p>
              <p className="text-sm text-muted-foreground">
                {data.upcomingDueCount} parcela(s) vencem nos proximos 7 dias.
              </p>
            </Link>
            <div className="rounded-lg border border-border p-3">
              <p className="text-sm font-bold">Frequencia</p>
              <p className="text-sm text-muted-foreground">
                {data.absentStudentsCount} aluno(s) sem frequencia ha 15+ dias.
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SummaryList
          title="Aniversariantes"
          viewAllHref="/students/birthdays"
          emptyMessage="Nenhum aniversariante neste mês."
          items={data.birthdayStudents.map((row) => ({
            id: row.id,
            primary: row.name,
            secondary: row.phone ?? undefined,
            trailing: formatDate(row.birthDate).slice(0, 5),
            href: `/students/${row.id}/edit`,
          }))}
        />

        <SummaryList
          title="Ultimas graduacoes"
          emptyMessage="Nenhuma graduacao registrada."
          items={data.recentGraduations.map((row) => ({
            id: row.id,
            primary: row.studentName,
            secondary: `${row.beltName} - grau ${row.degree}`,
            trailing: formatDate(row.date),
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
          title="Ausentes ha 15+ dias"
          emptyMessage="Nenhum aluno ausente."
          items={data.absentStudents.map((row) => ({
            id: row.studentId,
            primary: row.studentName,
            secondary: row.lastAttendance
              ? `Ultima presenca: ${formatDate(row.lastAttendance)}`
              : "Nunca compareceu",
            href: `/students/${row.studentId}/edit`,
          }))}
        />
      </div>
    </div>
  );
}
