import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateOnly } from "@/lib/dates/format";
import { buttonVariants } from "@/components/ui/button";
import { CancelSessionButton } from "./cancel-button";
import { Pagination } from "@/components/ui/pagination";
import { PAGE_SIZE, getRange, parsePage } from "@/lib/pagination";
import { PRESENT_STATUSES } from "@/lib/attendance/constants";

const STATUS_LABEL: Record<string, string> = {
  agendada: "Agendada",
  realizada: "Realizada",
  cancelada: "Cancelada",
  extra: "Extra",
};

const PERIOD_LABEL: Record<string, string> = {
  all: "Todas",
  past: "Passadas",
  upcoming: "Futuras",
};

function buildPeriodHref(period: string) {
  return `/classes/sessions?period=${period}`;
}

export default async function ClassSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; period?: string }>;
}) {
  const { page: pageParam, period: periodParam } = await searchParams;
  const page = parsePage(pageParam);
  const period = periodParam === "upcoming" || periodParam === "all" ? periodParam : "past";
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  let request = supabase
    .from("class_sessions")
    .select("id, date, status, class_groups(name)", { count: "exact" });

  if (period === "past") {
    request = request.lt("date", today);
  } else if (period === "upcoming") {
    request = request.gte("date", today);
  }

  const { data: sessions, count } = await request
    .order("date", { ascending: period === "upcoming" })
    .range(...getRange(page));

  const sessionIds = (sessions ?? []).map((session) => session.id);
  const { data: attendanceRows } = sessionIds.length
    ? await supabase
        .from("attendances")
        .select("class_session_id")
        .in("class_session_id", sessionIds)
        .in("status", PRESENT_STATUSES)
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Sessões</h1>
          <p className="text-sm text-muted-foreground">
            Consulte aulas passadas, futuras e os alunos presentes em cada chamada.
          </p>
        </div>
        <Link href="/classes/sessions/new" className={buttonVariants()}>
          Nova sessão extra
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(PERIOD_LABEL).map(([value, label]) => (
          <Link
            key={value}
            href={buildPeriodHref(value)}
            className={buttonVariants({
              size: "sm",
              variant: period === value ? "default" : "outline",
            })}
          >
            {label}
          </Link>
        ))}
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
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    {session.status !== "cancelada" && (
                      <Link
                        href={`/attendance/${session.id}`}
                        className={buttonVariants({ size: "sm", variant: "outline" })}
                      >
                        Ver chamada
                      </Link>
                    )}
                    {(session.status === "agendada" || session.status === "extra") &&
                      session.date >= today && (
                        <CancelSessionButton sessionId={session.id} />
                      )}
                  </div>
                </td>
              </tr>
            ))}
            {!sessions?.length && (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={5}>
                  Nenhuma sessão encontrada.
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
        basePath="/classes/sessions"
        searchParams={{ period }}
      />
    </div>
  );
}
