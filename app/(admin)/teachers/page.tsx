import Link from "next/link";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { BeltWithPreview } from "@/components/belts/belt-preview";
import { MetricCard } from "@/components/dashboard/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { PAGE_SIZE, getRange, parsePage } from "@/lib/pagination";
import { createClient } from "@/lib/supabase/server";

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const { page: pageParam, status } = await searchParams;
  const page = parsePage(pageParam);
  const supabase = await createClient();

  let query = supabase
    .from("teachers")
    .select("id, name, phone, email, photo_url, status", { count: "exact" })
    .order("name");

  if (status) query = query.eq("status", status);

  const [
    { data: teachers, count },
    { count: activeCount },
    { count: inactiveCount },
    { data: classGroups },
    { data: graduations },
  ] = await Promise.all([
    query.range(...getRange(page)),
    supabase
      .from("teachers")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("teachers")
      .select("id", { count: "exact", head: true })
      .eq("status", "inactive"),
    supabase
      .from("class_groups")
      .select("id, name, main_teacher_id, week_days, status")
      .eq("status", "active"),
    supabase
      .from("teacher_graduations")
      .select("teacher_id, degree, belts(name), modalities(name)")
      .order("graduation_date", { ascending: false }),
  ]);

  const classesByTeacher = new Map<string, typeof classGroups>();
  for (const group of classGroups ?? []) {
    if (!group.main_teacher_id) continue;
    const list = classesByTeacher.get(group.main_teacher_id) ?? [];
    list.push(group);
    classesByTeacher.set(group.main_teacher_id, list);
  }

  const graduationByTeacher = new Map<string, NonNullable<typeof graduations>[number]>();
  for (const graduation of graduations ?? []) {
    if (!graduationByTeacher.has(graduation.teacher_id)) {
      graduationByTeacher.set(graduation.teacher_id, graduation);
    }
  }

  const totalWeeklyClasses = (classGroups ?? []).reduce(
    (sum, group) => sum + (group.week_days?.length ?? 0),
    0,
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Gestao de professores</h1>
          <p className="text-sm text-muted-foreground">
            {activeCount ?? 0} professores ativos · {count ?? 0} exibidos
          </p>
        </div>
        <Link href="/teachers/new" className={buttonVariants()}>
          Novo professor
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Professores ativos" value={activeCount ?? 0} href="/teachers?status=active" />
        <MetricCard label="Inativos" value={inactiveCount ?? 0} href="/teachers?status=inactive" />
        <MetricCard label="Turmas cobertas" value={classGroups?.length ?? 0} href="/classes" />
        <MetricCard label="Aulas por semana" value={totalWeeklyClasses} />
      </div>

      <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-card p-3">
        <Link
          href="/teachers"
          className={buttonVariants({
            size: "sm",
            variant: !status ? "default" : "outline",
            className: "rounded-full",
          })}
        >
          Todos
        </Link>
        <Link
          href="/teachers?status=active"
          className={buttonVariants({
            size: "sm",
            variant: status === "active" ? "default" : "outline",
            className: "rounded-full",
          })}
        >
          Ativos
        </Link>
        <Link
          href="/teachers?status=inactive"
          className={buttonVariants({
            size: "sm",
            variant: status === "inactive" ? "default" : "outline",
            className: "rounded-full",
          })}
        >
          Inativos
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Professor</th>
              <th className="p-3 font-medium">Faixa</th>
              <th className="p-3 font-medium">Turmas</th>
              <th className="p-3 font-medium">Contato</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Aulas/sem</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {teachers?.map((teacher) => {
              const teacherClasses = classesByTeacher.get(teacher.id) ?? [];
              const weeklyClasses = teacherClasses.reduce(
                (sum, group) => sum + (group.week_days?.length ?? 0),
                0,
              );
              const graduation = graduationByTeacher.get(teacher.id);

              return (
                <tr key={teacher.id} className="border-t border-border align-middle hover:bg-secondary/50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <AvatarInitials name={teacher.name} src={teacher.photo_url} />
                      <div>
                        <Link
                          href={`/teachers/${teacher.id}/edit`}
                          className="font-bold hover:underline"
                        >
                          {teacher.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {teacher.email ?? "Sem e-mail"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    {graduation?.belts?.name ? (
                      <BeltWithPreview
                        name={graduation.belts.name}
                        degree={graduation.degree}
                      />
                    ) : (
                      <span className="text-muted-foreground">Sem faixa</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex max-w-xs flex-wrap gap-1">
                      {teacherClasses.slice(0, 3).map((group) => (
                        <span
                          key={group.id}
                          className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium"
                        >
                          {group.name}
                        </span>
                      ))}
                      {teacherClasses.length > 3 && (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                          +{teacherClasses.length - 3}
                        </span>
                      )}
                      {!teacherClasses.length && (
                        <span className="text-muted-foreground">Sem turmas</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{teacher.phone ?? teacher.email ?? "-"}</td>
                  <td className="p-3">
                    <StatusBadge
                      value={teacher.status}
                      label={teacher.status === "active" ? "Ativo" : "Inativo"}
                    />
                  </td>
                  <td className="p-3 text-muted-foreground">{weeklyClasses}</td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/teachers/${teacher.id}/edit`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Abrir ficha
                    </Link>
                  </td>
                </tr>
              );
            })}
            {!teachers?.length && (
              <tr>
                <td className="p-6 text-center text-muted-foreground" colSpan={7}>
                  Nenhum professor cadastrado.
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
        basePath="/teachers"
        searchParams={{ status }}
      />
    </div>
  );
}
