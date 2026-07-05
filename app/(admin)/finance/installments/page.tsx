import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  paid: "Paga",
  partially_paid: "Parcial",
  overdue: "Vencida",
  canceled: "Cancelada",
  refunded: "Estornada",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  pix: "Pix",
  cash: "Dinheiro",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  bank_transfer: "Transferência",
  other: "Outro",
};

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function nextMonth(month: string) {
  const [year, mon] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, mon, 1));
  return date.toISOString().slice(0, 10);
}

export default async function InstallmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string;
    status?: string;
    student?: string;
    planId?: string;
    paymentMethod?: string;
  }>;
}) {
  const { month, status, student, planId, paymentMethod } = await searchParams;
  const supabase = await createClient();

  const { data: plans } = await supabase
    .from("plans")
    .select("id, name")
    .order("name");

  let contractIdsFilter: string[] | null = null;

  if (student) {
    const { data: students } = await supabase
      .from("students")
      .select("id")
      .ilike("name", `%${student}%`);
    const studentIds = (students ?? []).map((s) => s.id);

    if (studentIds.length === 0) {
      contractIdsFilter = [];
    } else {
      const { data: links } = await supabase
        .from("contract_students")
        .select("contract_id")
        .in("student_id", studentIds);
      contractIdsFilter = [...new Set((links ?? []).map((l) => l.contract_id))];
    }
  }

  if (planId) {
    const { data: contracts } = await supabase
      .from("contracts")
      .select("id")
      .eq("plan_id", planId);
    const planContractIds = (contracts ?? []).map((c) => c.id);
    contractIdsFilter =
      contractIdsFilter === null
        ? planContractIds
        : contractIdsFilter.filter((id) => planContractIds.includes(id));
  }

  let installments: {
    id: string;
    installment_number: number;
    due_date: string;
    amount: number;
    remaining_amount: number;
    status: string;
    payment_method: string | null;
    contracts:
      | {
          plans: { name: string } | null;
          contract_students: { students: { id: string; name: string } | null }[] | null;
        }
      | null;
  }[] = [];

  if (contractIdsFilter === null || contractIdsFilter.length > 0) {
    let query = supabase
      .from("contract_installments")
      .select(
        "id, installment_number, due_date, amount, remaining_amount, status, payment_method, contracts(plans(name), contract_students(students(id, name)))",
      )
      .order("due_date");

    if (contractIdsFilter !== null) {
      query = query.in("contract_id", contractIdsFilter);
    }
    if (status) query = query.eq("status", status);
    if (paymentMethod) query = query.eq("payment_method", paymentMethod);
    if (month) {
      query = query.gte("due_date", `${month}-01`).lt("due_date", nextMonth(month));
    }

    const { data } = await query;
    installments = data ?? [];
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 text-foreground">
      <h1 className="font-heading text-2xl font-semibold">Parcelas</h1>

      <form className="flex flex-wrap gap-2 text-sm">
        <input
          type="month"
          name="month"
          defaultValue={month}
          className="h-8 rounded-lg border border-border bg-background px-2.5"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-8 rounded-lg border border-border bg-background px-2.5"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="student"
          placeholder="Buscar aluno..."
          defaultValue={student}
          className="h-8 rounded-lg border border-border bg-background px-2.5"
        />
        <select
          name="planId"
          defaultValue={planId ?? ""}
          className="h-8 rounded-lg border border-border bg-background px-2.5"
        >
          <option value="">Todos os planos</option>
          {(plans ?? []).map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </select>
        <select
          name="paymentMethod"
          defaultValue={paymentMethod ?? ""}
          className="h-8 rounded-lg border border-border bg-background px-2.5"
        >
          <option value="">Todas as formas</option>
          {Object.entries(PAYMENT_METHOD_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-8 rounded-lg border border-border bg-background px-3 text-sm hover:bg-muted"
        >
          Filtrar
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Aluno</th>
              <th className="p-3 font-medium">Plano</th>
              <th className="p-3 font-medium">Parcela</th>
              <th className="p-3 font-medium">Vencimento</th>
              <th className="p-3 font-medium">Valor</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Forma de pagamento</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {installments.map((installment) => {
              const studentLink = installment.contracts?.contract_students?.[0]?.students;
              return (
                <tr key={installment.id} className="border-t border-border">
                  <td className="p-3">{studentLink?.name ?? "-"}</td>
                  <td className="p-3 text-muted-foreground">
                    {installment.contracts?.plans?.name ?? "-"}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {installment.installment_number}
                  </td>
                  <td className="p-3 text-muted-foreground">{installment.due_date}</td>
                  <td className="p-3 text-muted-foreground">
                    {formatMoney(installment.amount)}
                  </td>
                  <td className="p-3">{STATUS_LABEL[installment.status] ?? installment.status}</td>
                  <td className="p-3 text-muted-foreground">
                    {installment.payment_method
                      ? PAYMENT_METHOD_LABEL[installment.payment_method] ?? installment.payment_method
                      : "-"}
                  </td>
                  <td className="p-3 text-right">
                    {studentLink && (
                      <Link
                        href={`/students/${studentLink.id}/edit`}
                        className="text-primary hover:underline"
                      >
                        Ficha
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
            {!installments.length && (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={8}>
                  Nenhuma parcela encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
