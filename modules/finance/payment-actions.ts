"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import {
  installmentPaymentSchema,
  type InstallmentPaymentInput,
} from "@/lib/validations/installment-payment";
import {
  installmentRefundSchema,
  type InstallmentRefundInput,
} from "@/lib/validations/installment-refund";

export type PaymentActionResult = { error?: string };

const OPEN_STATUSES = ["pending", "overdue", "partially_paid"] as const;
const REFUNDABLE_STATUSES = ["paid", "partially_paid"] as const;

export async function registerInstallmentPayment(
  installmentId: string,
  input: InstallmentPaymentInput,
): Promise<PaymentActionResult> {
  const profile = await requireRole("admin");
  const parsed = installmentPaymentSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { data: installment, error: installmentError } = await supabase
    .from("contract_installments")
    .select("id, contract_id, amount, paid_amount, remaining_amount, status")
    .eq("id", installmentId)
    .single();

  if (installmentError || !installment) {
    return { error: "Parcela não encontrada" };
  }

  if (!OPEN_STATUSES.includes(installment.status as (typeof OPEN_STATUSES)[number])) {
    return { error: "Esta parcela não pode receber pagamento no status atual" };
  }

  if (data.amountPaid > installment.remaining_amount) {
    return { error: "O valor pago não pode ser maior que o valor em aberto" };
  }

  const { data: account, error: accountError } = await supabase
    .from("financial_accounts")
    .select("id")
    .eq("id", data.financialAccountId)
    .eq("school_id", profile.schoolId)
    .single();

  if (accountError || !account) {
    return { error: "Conta financeira inválida" };
  }

  const { data: contractStudent, error: contractStudentError } = await supabase
    .from("contract_students")
    .select("student_id")
    .eq("contract_id", installment.contract_id)
    .limit(1)
    .single();

  if (contractStudentError || !contractStudent) {
    return { error: "Aluno do contrato não encontrado" };
  }

  const { data: movement, error: movementError } = await supabase
    .from("financial_movements")
    .insert({
      school_id: profile.schoolId,
      student_id: contractStudent.student_id,
      contract_id: installment.contract_id,
      contract_installment_id: installment.id,
      financial_account_id: data.financialAccountId,
      type: "income",
      amount: data.amountPaid,
      movement_date: data.paymentDate,
      payment_method: data.paymentMethod,
      category: "mensalidade",
    })
    .select("id")
    .single();

  if (movementError || !movement) {
    return { error: movementError?.message ?? "Não foi possível registrar o movimento financeiro" };
  }

  const newPaidAmount = installment.paid_amount + data.amountPaid;
  const newRemainingAmount = Math.max(
    0,
    Math.round((installment.amount - newPaidAmount) * 100) / 100,
  );
  const newStatus = newRemainingAmount <= 0 ? "paid" : "partially_paid";

  const { error: updateError } = await supabase
    .from("contract_installments")
    .update({
      paid_amount: newPaidAmount,
      remaining_amount: newRemainingAmount,
      status: newStatus,
      payment_date: data.paymentDate,
      payment_method: data.paymentMethod,
    })
    .eq("id", installment.id)
    .eq("school_id", profile.schoolId);

  if (updateError) {
    await supabase.from("financial_movements").delete().eq("id", movement.id);
    return { error: updateError.message };
  }

  revalidatePath(`/students/${contractStudent.student_id}/edit`);
  return {};
}

export async function cancelInstallment(
  installmentId: string,
  reason?: string,
): Promise<PaymentActionResult> {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data: installment, error: installmentError } = await supabase
    .from("contract_installments")
    .select("id, contract_id, status, due_date, notes")
    .eq("id", installmentId)
    .single();

  if (installmentError || !installment) {
    return { error: "Parcela não encontrada" };
  }

  if (installment.status !== "pending") {
    return { error: "Só é possível cancelar parcelas pendentes" };
  }

  const today = new Date().toISOString().slice(0, 10);
  if (installment.due_date < today) {
    return { error: "Só é possível cancelar parcelas futuras (vencimento ainda não passou)" };
  }

  const { data: contractStudent } = await supabase
    .from("contract_students")
    .select("student_id")
    .eq("contract_id", installment.contract_id)
    .limit(1)
    .single();

  const { error: updateError } = await supabase
    .from("contract_installments")
    .update({
      status: "canceled",
      notes: reason ? `${installment.notes ? `${installment.notes}\n` : ""}Cancelada: ${reason}` : installment.notes,
    })
    .eq("id", installment.id)
    .eq("school_id", profile.schoolId);

  if (updateError) {
    return { error: updateError.message };
  }

  if (contractStudent) {
    revalidatePath(`/students/${contractStudent.student_id}/edit`);
  }
  return {};
}

export async function refundInstallmentPayment(
  installmentId: string,
  input: InstallmentRefundInput,
): Promise<PaymentActionResult> {
  const profile = await requireRole("admin");
  const parsed = installmentRefundSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { data: installment, error: installmentError } = await supabase
    .from("contract_installments")
    .select("id, contract_id, amount, paid_amount, status")
    .eq("id", installmentId)
    .single();

  if (installmentError || !installment) {
    return { error: "Parcela não encontrada" };
  }

  if (!REFUNDABLE_STATUSES.includes(installment.status as (typeof REFUNDABLE_STATUSES)[number])) {
    return { error: "Esta parcela não tem pagamento para estornar" };
  }

  if (data.refundAmount > installment.paid_amount) {
    return { error: "O valor do estorno não pode ser maior que o valor pago" };
  }

  const { data: account, error: accountError } = await supabase
    .from("financial_accounts")
    .select("id")
    .eq("id", data.financialAccountId)
    .eq("school_id", profile.schoolId)
    .single();

  if (accountError || !account) {
    return { error: "Conta financeira inválida" };
  }

  const { data: contractStudent, error: contractStudentError } = await supabase
    .from("contract_students")
    .select("student_id")
    .eq("contract_id", installment.contract_id)
    .limit(1)
    .single();

  if (contractStudentError || !contractStudent) {
    return { error: "Aluno do contrato não encontrado" };
  }

  const { data: movement, error: movementError } = await supabase
    .from("financial_movements")
    .insert({
      school_id: profile.schoolId,
      student_id: contractStudent.student_id,
      contract_id: installment.contract_id,
      contract_installment_id: installment.id,
      financial_account_id: data.financialAccountId,
      type: "refund",
      amount: data.refundAmount,
      movement_date: data.refundDate,
      category: "mensalidade",
      description: data.reason || null,
    })
    .select("id")
    .single();

  if (movementError || !movement) {
    return { error: movementError?.message ?? "Não foi possível registrar o estorno" };
  }

  const newPaidAmount =
    Math.round((installment.paid_amount - data.refundAmount) * 100) / 100;
  const newRemainingAmount =
    Math.round((installment.amount - newPaidAmount) * 100) / 100;
  const newStatus = newPaidAmount <= 0 ? "refunded" : "partially_paid";

  const { error: updateError } = await supabase
    .from("contract_installments")
    .update({
      paid_amount: Math.max(0, newPaidAmount),
      remaining_amount: newRemainingAmount,
      status: newStatus,
    })
    .eq("id", installment.id)
    .eq("school_id", profile.schoolId);

  if (updateError) {
    await supabase.from("financial_movements").delete().eq("id", movement.id);
    return { error: updateError.message };
  }

  revalidatePath(`/students/${contractStudent.student_id}/edit`);
  return {};
}
