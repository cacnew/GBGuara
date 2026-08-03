import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import type { Database } from "@/lib/supabase/database.types";
import { logAuditEvent } from "@/modules/audit/log";

/**
 * Núcleo de aplicação de pagamento/estorno de parcela (Fase 19.3),
 * extraído de `modules/finance/payment-actions.ts` para ser chamável tanto
 * pela Server Action do admin (sessão via `requireRole`) quanto pelo
 * webhook do Asaas (`app/api/webhooks/asaas/route.ts`, sem sessão,
 * `service_role`). Fica num módulo sem `"use server"` de propósito — um
 * arquivo com essa diretiva torna toda função exportada uma Server Action,
 * e passar um client do Supabase como argumento arriscaria a checagem de
 * serialização de Server Actions; mesma separação já usada por
 * `modules/birthday-messages/job.ts` (job/rota de API chamando uma função
 * comum, não uma action).
 */

type Client = SupabaseClient<Database>;

export type PaymentActionResult = { error?: string };

export const OPEN_STATUSES = ["pending", "overdue", "partially_paid"] as const;
export const REFUNDABLE_STATUSES = ["paid", "partially_paid"] as const;

export async function applyInstallmentPayment({
  supabase,
  schoolId,
  installmentId,
  amountPaid,
  paymentDate,
  paymentMethod,
  financialAccountId,
  userId,
  auditAction,
}: {
  supabase: Client;
  schoolId: string;
  installmentId: string;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: string;
  financialAccountId: string;
  userId: string | null;
  auditAction: string;
}): Promise<PaymentActionResult> {
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

  if (amountPaid > installment.remaining_amount) {
    return { error: "O valor pago não pode ser maior que o valor em aberto" };
  }

  const { data: account, error: accountError } = await supabase
    .from("financial_accounts")
    .select("id")
    .eq("id", financialAccountId)
    .eq("school_id", schoolId)
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
      school_id: schoolId,
      student_id: contractStudent.student_id,
      contract_id: installment.contract_id,
      contract_installment_id: installment.id,
      financial_account_id: financialAccountId,
      type: "income",
      amount: amountPaid,
      movement_date: paymentDate,
      payment_method: paymentMethod,
      category: "mensalidade",
    })
    .select("id")
    .single();

  if (movementError || !movement) {
    return { error: movementError?.message ?? "Não foi possível registrar o movimento financeiro" };
  }

  const newPaidAmount = installment.paid_amount + amountPaid;
  const newRemainingAmount = Math.max(0, Math.round((installment.amount - newPaidAmount) * 100) / 100);
  const newStatus = newRemainingAmount <= 0 ? "paid" : "partially_paid";

  const { error: updateError } = await supabase
    .from("contract_installments")
    .update({
      paid_amount: newPaidAmount,
      remaining_amount: newRemainingAmount,
      status: newStatus,
      payment_date: paymentDate,
      payment_method: paymentMethod,
    })
    .eq("id", installment.id)
    .eq("school_id", schoolId);

  if (updateError) {
    await supabase.from("financial_movements").delete().eq("id", movement.id);
    return { error: updateError.message };
  }

  await logAuditEvent({
    supabase,
    schoolId,
    userId,
    entityType: "contract_installment",
    entityId: installment.id,
    action: auditAction,
    changes: { amountPaid, newStatus },
  });

  revalidatePath(`/students/${contractStudent.student_id}/edit`);
  return {};
}

export async function applyInstallmentRefund({
  supabase,
  schoolId,
  installmentId,
  refundAmount,
  refundDate,
  financialAccountId,
  reason,
  userId,
  auditAction,
}: {
  supabase: Client;
  schoolId: string;
  installmentId: string;
  refundAmount: number;
  refundDate: string;
  financialAccountId: string;
  reason?: string;
  userId: string | null;
  auditAction: string;
}): Promise<PaymentActionResult> {
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

  if (refundAmount > installment.paid_amount) {
    return { error: "O valor do estorno não pode ser maior que o valor pago" };
  }

  const { data: account, error: accountError } = await supabase
    .from("financial_accounts")
    .select("id")
    .eq("id", financialAccountId)
    .eq("school_id", schoolId)
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
      school_id: schoolId,
      student_id: contractStudent.student_id,
      contract_id: installment.contract_id,
      contract_installment_id: installment.id,
      financial_account_id: financialAccountId,
      type: "refund",
      amount: refundAmount,
      movement_date: refundDate,
      category: "mensalidade",
      description: reason || null,
    })
    .select("id")
    .single();

  if (movementError || !movement) {
    return { error: movementError?.message ?? "Não foi possível registrar o estorno" };
  }

  const newPaidAmount = Math.round((installment.paid_amount - refundAmount) * 100) / 100;
  const newRemainingAmount = Math.round((installment.amount - newPaidAmount) * 100) / 100;
  const newStatus = newPaidAmount <= 0 ? "refunded" : "partially_paid";

  const { error: updateError } = await supabase
    .from("contract_installments")
    .update({
      paid_amount: Math.max(0, newPaidAmount),
      remaining_amount: newRemainingAmount,
      status: newStatus,
    })
    .eq("id", installment.id)
    .eq("school_id", schoolId);

  if (updateError) {
    await supabase.from("financial_movements").delete().eq("id", movement.id);
    return { error: updateError.message };
  }

  await logAuditEvent({
    supabase,
    schoolId,
    userId,
    entityType: "contract_installment",
    entityId: installment.id,
    action: auditAction,
    changes: { refundAmount, newStatus },
  });

  revalidatePath(`/students/${contractStudent.student_id}/edit`);
  return {};
}
