"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { buildPixPayload } from "@/lib/pix/emv";
import { generatePixQrSvg } from "@/lib/pix/qr";
import { logAuditEvent } from "@/modules/audit/log";

export type ChargeActionResult = { error?: string; pixPayload?: string; qrSvg?: string };

const CHARGEABLE_STATUSES = ["pending", "partially_paid", "overdue"] as const;

export async function updateSchoolPixKey(pixKey: string): Promise<{ error?: string }> {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { error } = await supabase
    .from("schools")
    .update({ pix_key: pixKey.trim() || null })
    .eq("id", profile.schoolId);

  if (error) return { error: error.message };

  revalidatePath("/finance/installments");
  return {};
}

/**
 * Fase 10.6: "Enviar cobrança" — gera o Pix copia-e-cola (EMV) localmente
 * a partir da chave configurada em `schools.pix_key`, sem gateway. Fica
 * visível para o aluno na área financeira (Fase 10.5) e dispara uma
 * notificação (`type: "charge_sent"`).
 */
export async function sendPixCharge(installmentId: string): Promise<ChargeActionResult> {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data: school } = await supabase
    .from("schools")
    .select("name, city, pix_key")
    .eq("id", profile.schoolId)
    .single();

  if (!school?.pix_key) {
    return { error: "Configure a chave Pix da escola antes de enviar cobranças." };
  }

  const { data: installment, error: installmentError } = await supabase
    .from("contract_installments")
    .select("id, contract_id, installment_number, remaining_amount, status, due_date")
    .eq("id", installmentId)
    .single();

  if (installmentError || !installment) {
    return { error: "Parcela não encontrada." };
  }

  if (!CHARGEABLE_STATUSES.includes(installment.status as (typeof CHARGEABLE_STATUSES)[number])) {
    return { error: "Esta parcela não pode receber cobrança no status atual." };
  }

  const { data: contractStudent } = await supabase
    .from("contract_students")
    .select("student_id")
    .eq("contract_id", installment.contract_id)
    .limit(1)
    .single();

  if (!contractStudent) {
    return { error: "Aluno do contrato não encontrado." };
  }

  const pixPayload = buildPixPayload({
    pixKey: school.pix_key,
    merchantName: school.name,
    merchantCity: school.city ?? "",
    amount: installment.remaining_amount,
    txid: `NEXUSDOJO${installment.installment_number}`,
  });

  const { error: insertError } = await supabase.from("installment_charges").insert({
    school_id: profile.schoolId,
    contract_installment_id: installment.id,
    charge_type: "pix",
    pix_key: school.pix_key,
    pix_payload: pixPayload,
    amount: installment.remaining_amount,
    sent_by: profile.id,
  });

  if (insertError) return { error: insertError.message };

  await supabase.from("notifications").insert({
    school_id: profile.schoolId,
    student_id: contractStudent.student_id,
    type: "charge_sent",
    payload: {
      installmentNumber: installment.installment_number,
      amount: installment.remaining_amount,
      dueDate: installment.due_date,
    },
  });

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "contract_installment",
    entityId: installment.id,
    action: "charge_sent",
    changes: { amount: installment.remaining_amount },
  });

  revalidatePath("/finance/installments");
  revalidatePath("/finance/charges");

  const qrSvg = await generatePixQrSvg(pixPayload);
  return { pixPayload, qrSvg };
}
