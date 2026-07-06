import { getCurrentUserProfile } from "@/modules/users/queries";
import { TodaysClasses } from "@/components/classes/todays-classes";
import { SummaryList } from "@/components/dashboard/summary-list";
import { getTeacherDashboardData } from "./queries";

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export default async function TeacherDashboardPage() {
  const profile = await getCurrentUserProfile();
  const data = profile ? await getTeacherDashboardData(profile.email) : null;

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 text-foreground">
      <div>
        <h1 className="font-heading text-2xl font-semibold">
          Dashboard do professor
        </h1>
        <p className="text-muted-foreground">Olá, {profile?.name}.</p>
      </div>

      <h2 className="font-heading text-lg font-semibold">Turmas do dia</h2>
      <TodaysClasses />

      {data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryList
            title="Últimas chamadas"
            emptyMessage="Nenhuma chamada registrada por você ainda."
            items={data.recentSessions.map((s) => ({
              id: s.id,
              primary: s.className,
              trailing: formatDate(s.date),
              href: `/attendance/${s.id}`,
            }))}
            viewAllHref="/professor/sessions"
          />
          <SummaryList
            title="Alunos recentes"
            emptyMessage="Nenhum aluno cadastrado ainda."
            items={data.recentStudents.map((s) => ({
              id: s.id,
              primary: s.name,
              trailing: formatDate(s.enrollmentDate),
            }))}
          />
          <SummaryList
            title="Observações recentes"
            emptyMessage="Nenhuma observação registrada por você ainda."
            items={data.recentNotes.map((n) => ({
              id: n.id,
              primary: n.studentName,
              secondary: n.note,
              trailing: formatDate(n.date),
            }))}
          />
        </div>
      )}
    </div>
  );
}
