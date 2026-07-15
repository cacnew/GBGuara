"use server";

import { requireStudent } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export type StudentInstallment = {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  isOverdue: boolean;
};

export type StudentContract = {
  id: string;
  status: string;
  planName: string;
  priceTableName: string;
  startDate: string;
  endDate: string | null;
  finalPrice: number;
  installmentsCount: number;
};

export type SituacaoFinanceira =
  | "sem_contrato"
  | "isento"
  | "inadimplente"
  | "pausado"
  | "encerrado"
  | "regular";

export type StudentFinance = {
  contract: StudentContract | null;
  installments: StudentInstallment[];
  situacaoFinanceira: SituacaoFinanceira;
  proximoVencimento: string | null;
  valorEmAberto: number;
  valorVencido: number;
  totalPago: number;
  totalContratado: number;
};

const EMPTY: StudentFinance = {
  contract: null,
  installments: [],
  situacaoFinanceira: "sem_contrato",
  proximoVencimento: null,
  valorEmAberto: 0,
  valorVencido: 0,
  totalPago: 0,
  totalContratado: 0,
};

/**
 * Área financeira do aluno (Fase 10.5, TAREFA 4 da spec `modulo_aluno2.md`):
 * mesma leitura que `financial-queries.ts` do admin, mas escopada pela
 * própria sessão do aluno (RLS de `contracts`/`contract_installments` já
 * restringe ao próprio aluno desde a Fase 9.1; `plans`/`price_tables`/
 * `student_financial_exemptions` ganharam policy de leitura própria na
 * mesma migration desta subtarefa). Só leitura — aluno não cria/edita
 * cobranças, isso é ação do admin (Fase 10.6).
 */
export async function getStudentFinance(): Promise<StudentFinance> {
  const profile = await requireStudent();
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("current_contract_id")
    .eq("id", profile.id)
    .single();

  if (!student?.current_contract_id) {
    return EMPTY;
  }

  const { data: contractRow } = await supabase
    .from("contracts")
    .select(
      "id, status, start_date, end_date, final_price, installments_count, plans(name), price_tables(name)",
    )
    .eq("id", student.current_contract_id)
    .single();

  if (!contractRow) {
    return EMPTY;
  }

  const { data: installmentRows } = await supabase
    .from("contract_installments")
    .select("id, installment_number, due_date, amount, paid_amount, remaining_amount, status")
    .eq("contract_id", contractRow.id)
    .order("installment_number");

  const today = new Date().toISOString().slice(0, 10);
  const installments: StudentInstallment[] = (installmentRows ?? []).map((row) => ({
    id: row.id,
    installmentNumber: row.installment_number,
    dueDate: row.due_date,
    amount: row.amount,
    paidAmount: row.paid_amount,
    remainingAmount: row.remaining_amount,
    status: row.status,
    isOverdue:
      (row.status === "pending" || row.status === "partially_paid") && row.due_date < today,
  }));

  const openInstallments = installments.filter(
    (i) => i.status === "pending" || i.status === "partially_paid",
  );
  const overdueInstallments = openInstallments.filter((i) => i.isOverdue);

  const valorEmAberto = openInstallments.reduce((sum, i) => sum + i.remainingAmount, 0);
  const valorVencido = overdueInstallments.reduce((sum, i) => sum + i.remainingAmount, 0);
  const totalPago = installments.reduce((sum, i) => sum + i.paidAmount, 0);
  const proximoVencimento =
    openInstallments.length > 0
      ? openInstallments.reduce((min, i) => (i.dueDate < min ? i.dueDate : min), openInstallments[0].dueDate)
      : null;

  const { data: exemption } = await supabase
    .from("student_financial_exemptions")
    .select("id")
    .eq("student_id", profile.id)
    .eq("status", "active")
    .lte("start_date", today)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .maybeSingle();

  let situacaoFinanceira: SituacaoFinanceira;
  if (exemption) {
    situacaoFinanceira = "isento";
  } else if (overdueInstallments.length > 0) {
    situacaoFinanceira = "inadimplente";
  } else if (contractRow.status === "paused") {
    situacaoFinanceira = "pausado";
  } else if (contractRow.status === "finished" || contractRow.status === "canceled") {
    situacaoFinanceira = "encerrado";
  } else {
    situacaoFinanceira = "regular";
  }

  return {
    contract: {
      id: contractRow.id,
      status: contractRow.status,
      planName: contractRow.plans?.name ?? "-",
      priceTableName: contractRow.price_tables?.name ?? "-",
      startDate: contractRow.start_date,
      endDate: contractRow.end_date,
      finalPrice: contractRow.final_price,
      installmentsCount: contractRow.installments_count,
    },
    installments,
    situacaoFinanceira,
    proximoVencimento,
    valorEmAberto,
    valorVencido,
    totalPago,
    totalContratado: contractRow.final_price,
  };
}
