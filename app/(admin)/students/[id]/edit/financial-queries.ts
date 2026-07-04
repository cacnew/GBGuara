import { createClient } from "@/lib/supabase/server";

export type ContractDetail = {
  id: string;
  status: string;
  planName: string;
  priceTableName: string;
  startDate: string;
  endDate: string | null;
  originalPrice: number;
  discountType: string;
  discountValue: number;
  finalPrice: number;
  installmentsCount: number;
};

export type InstallmentRow = {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
};

export type SituacaoFinanceira =
  | "sem_contrato"
  | "isento"
  | "inadimplente"
  | "pausado"
  | "encerrado"
  | "regular";

export type FinancialSummary = {
  contract: ContractDetail | null;
  installments: InstallmentRow[];
  situacaoFinanceira: SituacaoFinanceira;
  proximoVencimento: string | null;
  valorEmAberto: number;
  valorVencido: number;
  totalPago: number;
  totalContratado: number;
  parcelasPagas: number;
  parcelasPendentes: number;
  parcelasVencidas: number;
};

const EMPTY_SUMMARY: FinancialSummary = {
  contract: null,
  installments: [],
  situacaoFinanceira: "sem_contrato",
  proximoVencimento: null,
  valorEmAberto: 0,
  valorVencido: 0,
  totalPago: 0,
  totalContratado: 0,
  parcelasPagas: 0,
  parcelasPendentes: 0,
  parcelasVencidas: 0,
};

export async function getStudentFinancialSummary(
  studentId: string,
): Promise<FinancialSummary> {
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("current_contract_id")
    .eq("id", studentId)
    .single();

  if (!student?.current_contract_id) {
    return EMPTY_SUMMARY;
  }

  const { data: contractRow } = await supabase
    .from("contracts")
    .select(
      "id, status, start_date, end_date, original_price, discount_type, discount_value, final_price, installments_count, plans(name), price_tables(name)",
    )
    .eq("id", student.current_contract_id)
    .single();

  if (!contractRow) {
    return EMPTY_SUMMARY;
  }

  const { data: installmentRows } = await supabase
    .from("contract_installments")
    .select("id, installment_number, due_date, amount, paid_amount, remaining_amount, status")
    .eq("contract_id", contractRow.id)
    .order("installment_number");

  const installments: InstallmentRow[] = (installmentRows ?? []).map((row) => ({
    id: row.id,
    installmentNumber: row.installment_number,
    dueDate: row.due_date,
    amount: row.amount,
    paidAmount: row.paid_amount,
    remainingAmount: row.remaining_amount,
    status: row.status,
  }));

  const today = new Date().toISOString().slice(0, 10);
  const openInstallments = installments.filter(
    (i) => i.status === "pending" || i.status === "partially_paid",
  );
  const overdueInstallments = openInstallments.filter((i) => i.dueDate < today);

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
    .eq("student_id", studentId)
    .eq("status", "active")
    .lte("start_date", today)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .maybeSingle();

  const { data: overdue } = await supabase
    .from("overdue_students")
    .select("student_id")
    .eq("student_id", studentId)
    .maybeSingle();

  let situacaoFinanceira: SituacaoFinanceira;
  if (exemption) {
    situacaoFinanceira = "isento";
  } else if (overdue) {
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
      originalPrice: contractRow.original_price,
      discountType: contractRow.discount_type,
      discountValue: contractRow.discount_value,
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
    parcelasPagas: installments.filter((i) => i.status === "paid").length,
    parcelasPendentes: openInstallments.filter((i) => i.dueDate >= today).length,
    parcelasVencidas: overdueInstallments.length,
  };
}
