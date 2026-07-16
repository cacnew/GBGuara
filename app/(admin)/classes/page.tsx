import Link from "next/link";
import { MetricCard } from "@/components/dashboard/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { WEEK_DAYS } from "@/lib/validations/class-group";
import { Pagination } from "@/components/ui/pagination";
import { PAGE_SIZE, getRange, parsePage } from "@/lib/pagination";
import { createClient } from "@/lib/supabase/server";
import { PRESENT_STATUSES } from "@/lib/attendance/constants";

const DAY_LABEL = Object.fromEntries(
  WEEK_DAYS.map((day) => [Number(day.value), day.label.slice(0, 3)]),
);

const AUDIENCE_LABEL: Record<string, string> = {
  kids: "Kids",
  juvenil: "Teens",
  adulto: "Adulto",
  feminino: "Feminino",
  iniciante: "Iniciante",
  avancado: "Avancado",
  competicao: "Competicao",
  livre: "Livre",
};

export default async function ClassGroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const { page: pageParam, status } = await searchParams;
  const page = parsePage(pageParam);
  const supabase = await createClient();

  let query = supabase
    .from("class_groups")
    .select(
      "id, name, start_time, end_time, week_days, status, suggested_audience, suggested_student_limit, modalities(name), teachers(name)",
      { count: "exact" },
    )
    .order("name");

  if (status) query = query.eq("status", status);

  const [
    { data: classGroups, count },
    { count: activeCount },
    { count: inactiveCount },
    { count: teachersCount },
    { data: attendanceRows },
  ] = await Promise.all([
    query.range(...getRange(page)),
    supabase
      .from("class_groups")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("class_groups")
      .select("id", { count: "exact", head: true })
      .eq("status", "inactive"),
    supabase
      .from("teachers")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("attendances")
      .select("student_id, class_sessions!inner(class_group_id)")
      .in("status", PRESENT_STATUSES),
  ]);

  const studentsByClass = new Map<string, Set<string>>();
  for (const row of attendanceRows ?? []) {
    const classGroupId = row.class_sessions?.class_group_id;
    if (!classGroupId) continue;
    const set = studentsByClass.get(classGroupId) ?? new Set<string>();
    set.add(row.student_id);
    studentsByClass.set(classGroupId, set);
  }

  const weeklyClasses = (classGroups ?? []).reduce(
    (sum, group) => sum + (group.week_days?.length ?? 0),
    0,
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Gestao de turmas</h1>
          <p className="text-sm text-muted-foreground">{count ?? 0} turmas encontradas</p>
        </div>
        <Link href="/classes/new" className={buttonVariants()}>
          Nova turma
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Turmas ativas" value={activeCount ?? 0} href="/classes?status=active" />
        <MetricCard label="Turmas inativas" value={inactiveCount ?? 0} href="/classes?status=inactive" />
        <MetricCard label="Professores ativos" value={teachersCount ?? 0} href="/teachers" />
        <MetricCard label="Aulas por semana" value={weeklyClasses} />
      </div>

      <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-card p-3">
        <Link
          href="/classes"
          className={buttonVariants({
            size: "sm",
            variant: !status ? "default" : "outline",
            className: "rounded-full",
          })}
        >
          Todas
        </Link>
        <Link
          href="/classes?status=active"
          className={buttonVariants({
            size: "sm",
            variant: status === "active" ? "default" : "outline",
            className: "rounded-full",
          })}
        >
          Ativas
        </Link>
        <Link
          href="/classes?status=inactive"
          className={buttonVariants({
            size: "sm",
            variant: status === "inactive" ? "default" : "outline",
            className: "rounded-full",
          })}
        >
          Inativas
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Turma</th>
              <th className="p-3 font-medium">Professor</th>
              <th className="p-3 font-medium">Horarios</th>
              <th className="p-3 font-medium">Alunos</th>
              <th className="p-3 font-medium">Publico</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {classGroups?.map((group) => {
              const studentCount = studentsByClass.get(group.id)?.size ?? 0;
              const limit = group.suggested_student_limit;
              const occupancy = limit ? Math.min(100, Math.round((studentCount / limit) * 100)) : 0;

              return (
                <tr key={group.id} className="border-t border-border align-top hover:bg-secondary/50">
                  <td className="p-3">
                    <Link href={`/classes/${group.id}/edit`} className="font-bold hover:underline">
                      {group.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {group.modalities?.name ?? "Sem modalidade"}
                    </p>
                  </td>
                  <td className="p-3 text-muted-foreground">{group.teachers?.name ?? "-"}</td>
                  <td className="p-3 text-muted-foreground">
                    <div>{(group.week_days ?? []).map((day: number) => DAY_LABEL[day]).join(", ")}</div>
                    <div>
                      {group.start_time.slice(0, 5)} - {group.end_time.slice(0, 5)}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-muted-foreground">
                      {studentCount}
                      {limit ? `/${limit}` : ""}
                    </div>
                    {limit && (
                      <div className="mt-1 h-1.5 w-28 rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${occupancy}%` }}
                        />
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {group.suggested_audience
                      ? AUDIENCE_LABEL[group.suggested_audience] ?? group.suggested_audience
                      : "Livre"}
                  </td>
                  <td className="p-3">
                    <StatusBadge
                      value={group.status}
                      label={group.status === "active" ? "Ativa" : "Inativa"}
                    />
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/classes/${group.id}/edit`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              );
            })}
            {!classGroups?.length && (
              <tr>
                <td className="p-6 text-center text-muted-foreground" colSpan={7}>
                  Nenhuma turma cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        totalCount={count ?? 0}
        basePath="/classes"
        searchParams={{ status }}
      />
    </div>
  );
}
