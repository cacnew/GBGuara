import { getCurrentUserProfile } from "@/modules/users/queries";
import { TodaysClasses } from "@/components/classes/todays-classes";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SummaryList } from "@/components/dashboard/summary-list";
import { getTeacherDashboardData } from "./queries";

function formatDate(value: string) {
  const [, month, day] = value.split("-");
  return `${day}/${month}`;
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
        <p className="text-muted-foreground">Ola, {profile?.name}.</p>
      </div>

      <h2 className="font-heading text-lg font-semibold">Turmas do dia</h2>
      <TodaysClasses />

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <MetricCard label="Aulas hoje" value={data.metrics.classesToday} />
            <MetricCard
              label="Proximas aulas"
              value={data.metrics.upcomingClasses}
              href="/professor/schedule"
            />
            <MetricCard
              label="Alunos para acompanhar"
              value={data.metrics.attentionStudents}
            />
            <MetricCard
              label="Sugestoes de graduacao"
              value={data.metrics.pendingGraduationSuggestions}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <SummaryList
              title="Agenda da semana"
              emptyMessage="Nenhuma turma ativa vinculada a voce."
              items={data.upcomingClasses.map((item) => ({
                id: item.id,
                primary: item.className,
                secondary: item.modalityName,
                trailing: `${formatDate(item.date)} ${item.startTime}`,
              }))}
              viewAllHref="/professor/schedule"
            />
            <SummaryList
              title="Alunos para acompanhar"
              emptyMessage="Nenhum aluno em alerta agora."
              items={data.attentionStudents.map((student) => ({
                id: student.id,
                primary: student.name,
                secondary: student.reason,
                trailing: student.trailing,
                href: `/professor/students/${student.id}`,
              }))}
            />
            <SummaryList
              title="Sugestoes pendentes"
              emptyMessage="Nenhuma sugestao de graduacao pendente."
              items={data.pendingGraduationSuggestions.map((suggestion) => ({
                id: suggestion.id,
                primary: suggestion.studentName,
                secondary: `${suggestion.suggestedBeltName} · grau ${suggestion.suggestedDegree}`,
                trailing: formatDate(suggestion.date),
                href: `/professor/students/${suggestion.studentId}`,
              }))}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <SummaryList
              title="Ultimas chamadas"
              emptyMessage="Nenhuma chamada registrada por voce ainda."
              items={data.recentSessions.map((session) => ({
                id: session.id,
                primary: session.className,
                trailing: formatDate(session.date),
                href: `/attendance/${session.id}`,
              }))}
              viewAllHref="/professor/sessions"
            />
            <SummaryList
              title="Alunos recentes"
              emptyMessage="Nenhum aluno cadastrado ainda."
              items={data.recentStudents.map((student) => ({
                id: student.id,
                primary: student.name,
                trailing: formatDate(student.enrollmentDate),
                href: `/professor/students/${student.id}`,
              }))}
            />
            <SummaryList
              title="Observacoes recentes"
              emptyMessage="Nenhuma observacao registrada por voce ainda."
              items={data.recentNotes.map((note) => ({
                id: note.id,
                primary: note.studentName,
                secondary: note.note,
                trailing: formatDate(note.date),
              }))}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SummaryList
              title="Conteudos recentes"
              emptyMessage="Nenhum conteudo de aula registrado ainda."
              items={data.recentLessonContents.map((item) => ({
                id: item.id,
                primary: item.className,
                secondary: item.content,
                trailing: formatDate(item.date),
                href: `/attendance/${item.id}`,
              }))}
            />
          </div>
        </>
      )}
    </div>
  );
}
