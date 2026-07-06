import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Pagination } from "@/components/ui/pagination";
import { PAGE_SIZE, getRange, parsePage } from "@/lib/pagination";

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function daysOverdue(dueDate: string): number {
  const due = new Date(`${dueDate}T00:00:00Z`);
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  return Math.round((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function OverdueStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const supabase = await createClient();

  const { data: overdueRows, count } = await supabase
    .from("overdue_students")
    .select(
      "student_id, overdue_installments_count, overdue_amount, oldest_overdue_due_date",
      { count: "exact" },
    )
    .order("oldest_overdue_due_date")
    .range(...getRange(page));

  const studentIds = (overdueRows ?? [])
    .map((row) => row.student_id)
    .filter((id): id is string => Boolean(id));

  const { data: students } = studentIds.length
    ? await supabase
        .from("students")
        .select("id, name, phone, current_contract_id")
        .in("id", studentIds)
    : { data: [] };

  const contractIds = (students ?? [])
    .map((s) => s.current_contract_id)
    .filter((id): id is string => Boolean(id));

  const { data: contracts } = contractIds.length
    ? await supabase
        .from("contracts")
        .select("id, financial_responsible_type, financial_responsible_id, notes")
        .in("id", contractIds)
    : { data: [] };

  const guardianIds = (contracts ?? [])
    .filter((c) => c.financial_responsible_type === "guardian")
    .map((c) => c.financial_responsible_id)
    .filter((id): id is string => Boolean(id));

  const { data: guardians } = guardianIds.length
    ? await supabase.from("guardians").select("id, name").in("id", guardianIds)
    : { data: [] };

  function resolveResponsavel(contractId: string | null, studentName: string): string {
    const contract = (contracts ?? []).find((c) => c.id === contractId);
    if (!contract) return "-";
    if (contract.financial_responsible_type === "student") return studentName;
    if (contract.financial_responsible_type === "guardian") {
      const guardian = (guardians ?? []).find(
        (g) => g.id === contract.financial_responsible_id,
      );
      return guardian?.name ?? "-";
    }
    return contract.notes ?? "Outro";
  }

  const rows = (overdueRows ?? []).map((row) => {
    const student = (students ?? []).find((s) => s.id === row.student_id);
    return {
      studentId: row.student_id,
      studentName: student?.name ?? "-",
      phone: student?.phone ?? null,
      responsavel: resolveResponsavel(student?.current_contract_id ?? null, student?.name ?? "-"),
      overdueAmount: row.overdue_amount ?? 0,
      daysOverdue: row.oldest_overdue_due_date ? daysOverdue(row.oldest_overdue_due_date) : 0,
    };
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 text-foreground">
      <h1 className="font-heading text-2xl font-semibold">Inadimplentes</h1>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Aluno</th>
              <th className="p-3 font-medium">Responsável financeiro</th>
              <th className="p-3 font-medium">Valor vencido</th>
              <th className="p-3 font-medium">Dias em atraso</th>
              <th className="p-3 font-medium">Telefone</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.studentId} className="border-t border-border">
                <td className="p-3">{row.studentName}</td>
                <td className="p-3 text-muted-foreground">{row.responsavel}</td>
                <td className="p-3 text-destructive">{formatMoney(row.overdueAmount)}</td>
                <td className="p-3 text-muted-foreground">{row.daysOverdue}</td>
                <td className="p-3 text-muted-foreground">{row.phone ?? "-"}</td>
                <td className="p-3 text-right">
                  <Link
                    href={`/students/${row.studentId}/edit`}
                    className="text-primary hover:underline"
                  >
                    Ficha
                  </Link>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={6}>
                  Nenhum aluno inadimplente no momento.
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
        basePath="/finance/overdue"
      />
    </div>
  );
}
