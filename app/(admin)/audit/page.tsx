import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { Pagination } from "@/components/ui/pagination";
import { PAGE_SIZE, getRange, parsePage } from "@/lib/pagination";

const ACTION_LABEL: Record<string, string> = {
  create: "Criacao",
  update: "Alteracao",
  delete: "Exclusao",
  payment_registered: "Pagamento registrado",
  partial_payment_registered: "Pagamento parcial",
  payment_refunded: "Pagamento estornado",
  installment_canceled: "Parcela cancelada",
  contract_finished: "Contrato encerrado",
  contract_paused: "Contrato pausado",
  contract_resumed: "Contrato retomado",
  attendance_created: "Presenca registrada",
  attendance_deleted: "Presenca removida",
  graduation_created: "Graduacao registrada",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function summarizeChanges(changes: unknown) {
  if (!changes || typeof changes !== "object") return "-";

  const entries = Object.entries(changes as Record<string, unknown>);
  if (entries.length === 0) return "-";

  return entries
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" | ");
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const profile = await requireRole("admin");
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const supabase = await createClient();

  const { data: logs, count } = await supabase
    .from("audit_logs")
    .select(
      "id, entity_type, entity_id, action, changes, created_at, users(name, email)",
      { count: "exact" },
    )
    .eq("school_id", profile.schoolId)
    .order("created_at", { ascending: false })
    .range(...getRange(page));

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 text-foreground">
      <div className="max-w-3xl">
        <h1 className="font-heading text-2xl font-bold">Auditoria</h1>
        <p className="text-sm text-muted-foreground">
          Registro das acoes sensiveis feitas no sistema, incluindo financeiro,
          presencas, graduacoes, usuarios e cadastros.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="bg-card text-left">
            <tr>
              <th className="p-3 font-bold">Data</th>
              <th className="p-3 font-bold">Usuario</th>
              <th className="p-3 font-bold">Acao</th>
              <th className="p-3 font-bold">Entidade</th>
              <th className="p-3 font-bold">Alteracoes</th>
            </tr>
          </thead>
          <tbody>
            {logs?.map((log) => (
              <tr key={log.id} className="border-t border-border align-top">
                <td className="whitespace-nowrap p-3 text-muted-foreground">
                  {formatDateTime(log.created_at)}
                </td>
                <td className="p-3">
                  <p className="font-bold">{log.users?.name ?? "Sistema"}</p>
                  {log.users?.email && (
                    <p className="text-xs text-muted-foreground">{log.users.email}</p>
                  )}
                </td>
                <td className="p-3">
                  {ACTION_LABEL[log.action] ?? log.action}
                </td>
                <td className="p-3 text-muted-foreground">
                  <p>{log.entity_type}</p>
                  <p className="text-xs">{log.entity_id}</p>
                </td>
                <td className="max-w-md p-3 text-muted-foreground">
                  {summarizeChanges(log.changes)}
                </td>
              </tr>
            ))}
            {!logs?.length && (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={5}>
                  Nenhum registro de auditoria encontrado.
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
        basePath="/audit"
      />
    </div>
  );
}
