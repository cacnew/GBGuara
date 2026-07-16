import { createClient } from "@/lib/supabase/server";
import { formatDateOnly } from "@/lib/dates/format";
import { ATTENDANCE_STATUS_LABELS } from "@/lib/attendance/constants";

export async function AttendanceHistory({ studentId }: { studentId: string }) {
  const supabase = await createClient();

  const { data: attendancesRaw } = await supabase
    .from("attendances")
    .select(
      "id, status, created_at, class_sessions!inner(date, class_groups(name)), users!registered_by_user_id(name)",
    )
    .eq("student_id", studentId);

  // Ordenação por foreignTable não é confiável quando combinada com LIMIT —
  // ordena no cliente (volume por aluno é pequeno) e só então corta as 50
  // mais recentes.
  const attendances = (attendancesRaw ?? [])
    .slice()
    .sort((a, b) => (b.class_sessions?.date ?? "").localeCompare(a.class_sessions?.date ?? ""))
    .slice(0, 50);

  return (
    <div className="w-full max-w-sm space-y-3">
      <h2 className="font-heading text-lg font-semibold">
        Histórico de presença
      </h2>

      <div className="space-y-2">
        {attendances?.map((a) => (
          <div
            key={a.id}
            className="rounded-lg border border-border bg-card p-3 text-sm"
          >
            <p className="font-medium">
              {a.class_sessions?.class_groups?.name ?? "-"}
            </p>
            <p className="text-muted-foreground">
              {a.class_sessions?.date
                ? formatDateOnly(a.class_sessions.date)
                : "-"}{" "}
              · {ATTENDANCE_STATUS_LABELS[a.status] ?? a.status} ·{" "}
              {a.users?.name ? `registrado por ${a.users.name}` : "sinalização do aluno"}
            </p>
          </div>
        ))}
        {!attendances?.length && (
          <p className="text-sm text-muted-foreground">
            Nenhuma presença registrada ainda.
          </p>
        )}
      </div>
    </div>
  );
}
