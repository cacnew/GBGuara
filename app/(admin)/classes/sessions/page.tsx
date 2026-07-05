import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateOnly } from "@/lib/dates/format";
import { buttonVariants } from "@/components/ui/button";
import { CancelSessionButton } from "./cancel-button";

const STATUS_LABEL: Record<string, string> = {
  agendada: "Agendada",
  realizada: "Realizada",
  cancelada: "Cancelada",
  extra: "Extra",
};

export default async function ClassSessionsPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: sessions } = await supabase
    .from("class_sessions")
    .select("id, date, status, class_groups(name)")
    .gte("date", today)
    .order("date");

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 text-foreground">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">
          Sessões futuras
        </h1>
        <Link href="/classes/sessions/new" className={buttonVariants()}>
          Nova sessão extra
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Data</th>
              <th className="p-3 font-medium">Turma</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {sessions?.map((session) => (
              <tr key={session.id} className="border-t border-border">
                <td className="p-3">
                  {formatDateOnly(session.date)}
                </td>
                <td className="p-3 text-muted-foreground">
                  {session.class_groups?.name ?? "-"}
                </td>
                <td className="p-3">{STATUS_LABEL[session.status]}</td>
                <td className="p-3 text-right">
                  {(session.status === "agendada" ||
                    session.status === "extra") && (
                    <CancelSessionButton sessionId={session.id} />
                  )}
                </td>
              </tr>
            ))}
            {!sessions?.length && (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={4}>
                  Nenhuma sessão futura.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
