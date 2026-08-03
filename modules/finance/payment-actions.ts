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
import { logAuditEvent } from "@/modules/audit/log";
import { applyInstallmentPayment, applyInstallmentRefund } from "@/modules/finance/payment-core";

export type PaymentActionResult = { error?: string };

export async function registerInstallmentPayment(
  installmentId: string,
  input: InstallmentPaymentInput,
): Promise<PaymentActionResult> {
  const profile = await requireRole("admin");
  const parsed = installmentPaymentSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();

  return applyInstallmentPayment({
    supabase,
    schoolId: profile.schoolId,
    installmentId,
    amountPaid: parsed.data.amountPaid,
    paymentDate: parsed.data.paymentDate,
    paymentMethod: parsed.data.paymentMethod,
    financialAccountId: parsed.data.financialAccountId,
    userId: profile.id,
    auditAction: "payment_registered",
  });
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

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "contract_installment",
    entityId: installment.id,
    action: "installment_canceled",
    changes: { reason: reason ?? null },
  });

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

  const supabase = await createClient();

  return applyInstallmentRefund({
    supabase,
    schoolId: profile.schoolId,
    installmentId,
    refundAmount: parsed.data.refundAmount,
    refundDate: parsed.data.refundDate,
    financialAccountId: parsed.data.financialAccountId,
    reason: parsed.data.reason,
    userId: profile.id,
    auditAction: "payment_refunded",
  });
}
