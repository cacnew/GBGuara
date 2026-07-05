import { createClient } from "@/lib/supabase/server";
import { formatDateOnly } from "@/lib/dates/format";

export async function AttendanceHistory({ studentId }: { studentId: string }) {
  const supabase = await createClient();

  const { data: attendances } = await supabase
    .from("attendances")
    .select(
      "id, status, created_at, class_sessions(date, class_groups(name)), users(name)",
    )
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(50);

  const STATUS_LABEL: Record<string, string> = {
    presente: "Presente",
    falta: "Falta",
    falta_justificada: "Falta justificada",
  };

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
              · {STATUS_LABEL[a.status] ?? a.status} · registrado por{" "}
              {a.users?.name ?? "-"}
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
