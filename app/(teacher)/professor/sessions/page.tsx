import Link from "next/link";
import { getCurrentUserProfile } from "@/modules/users/queries";
import { createClient } from "@/lib/supabase/server";
import { formatDateOnly } from "@/lib/dates/format";
import { buttonVariants } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { PAGE_SIZE, getRange, parsePage } from "@/lib/pagination";

const STATUS_LABEL: Record<string, string> = {
  agendada: "Agendada",
  realizada: "Realizada",
  cancelada: "Cancelada",
  extra: "Extra",
};

export default async function TeacherSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const profile = await getCurrentUserProfile();
  const supabase = await createClient();

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("email", profile?.email ?? "")
    .maybeSingle();

  if (!teacher) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-6 text-foreground">
        <div>
          <h1 className="font-heading text-2xl font-semibold">
            Histórico de chamadas
          </h1>
          <p className="text-sm text-muted-foreground">
            Nenhuma ficha de professor vinculada ao seu e-mail.
          </p>
        </div>
      </div>
    );
  }

  const { data: sessions, count } = await supabase
    .from("class_sessions")
    .select("id, date, status, class_groups!inner(name, main_teacher_id)", {
      count: "exact",
    })
    .eq("class_groups.main_teacher_id", teacher.id)
    .order("date", { ascending: false })
    .range(...getRange(page));

  const sessionIds = (sessions ?? []).map((session) => session.id);
  const { data: attendanceRows } = sessionIds.length
    ? await supabase
        .from("attendances")
        .select("class_session_id")
        .in("class_session_id", sessionIds)
        .eq("status", "presente")
    : { data: [] };

  const attendanceCountBySession = new Map<string, number>();
  for (const row of attendanceRows ?? []) {
    attendanceCountBySession.set(
      row.class_session_id,
      (attendanceCountBySession.get(row.class_session_id) ?? 0) + 1,
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 text-foreground">
      <div>
        <h1 className="font-heading text-2xl font-semibold">
          Histórico de chamadas
        </h1>
        <p className="text-sm text-muted-foreground">
          Aulas vinculadas a você, com acesso aos alunos presentes.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Data</th>
              <th className="p-3 font-medium">Turma</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Presentes</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {sessions?.map((session) => (
              <tr key={session.id} className="border-t border-border">
                <td className="p-3">{formatDateOnly(session.date)}</td>
                <td className="p-3 text-muted-foreground">
                  {session.class_groups?.name ?? "-"}
                </td>
                <td className="p-3">{STATUS_LABEL[session.status]}</td>
                <td className="p-3">
                  {attendanceCountBySession.get(session.id) ?? 0}
                </td>
                <td className="p-3 text-right">
                  {session.status !== "cancelada" && (
                    <Link
                      href={`/attendance/${session.id}`}
                      className={buttonVariants({ size: "sm", variant: "outline" })}
                    >
                      Ver chamada
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {!sessions?.length && (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={5}>
                  Nenhuma chamada encontrada.
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
        basePath="/professor/sessions"
      />
    </div>
  );
}
