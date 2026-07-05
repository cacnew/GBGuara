"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import {
  installmentDueDateSchema,
  type InstallmentDueDateInput,
} from "@/lib/validations/contract-management";
import { logAuditEvent } from "@/modules/audit/log";

export type ContractActionResult = { error?: string };

async function getStudentIdForContract(
  supabase: Awaited<ReturnType<typeof createClient>>,
  contractId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("contract_students")
    .select("student_id")
    .eq("contract_id", contractId)
    .limit(1)
    .single();
  return data?.student_id ?? null;
}

export async function pauseContract(contractId: string): Promise<ContractActionResult> {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data: contract, error: fetchError } = await supabase
    .from("contracts")
    .select("id, status")
    .eq("id", contractId)
    .single();

  if (fetchError || !contract) {
    return { error: "Contrato não encontrado" };
  }

  if (contract.status !== "active") {
    return { error: "Só é possível pausar um contrato ativo" };
  }

  const { error } = await supabase
    .from("contracts")
    .update({ status: "paused" })
    .eq("id", contractId)
    .eq("school_id", profile.schoolId);

  if (error) {
    return { error: error.message };
  }

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "contract",
    entityId: contractId,
    action: "contract_paused",
  });

  const studentId = await getStudentIdForContract(supabase, contractId);
  if (studentId) revalidatePath(`/students/${studentId}/edit`);
  return {};
}

export async function resumeContract(contractId: string): Promise<ContractActionResult> {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data: contract, error: fetchError } = await supabase
    .from("contracts")
    .select("id, status")
    .eq("id", contractId)
    .single();

  if (fetchError || !contract) {
    return { error: "Contrato não encontrado" };
  }

  if (contract.status !== "paused") {
    return { error: "Só é possível retomar um contrato pausado" };
  }

  const { error } = await supabase
    .from("contracts")
    .update({ status: "active" })
    .eq("id", contractId)
    .eq("school_id", profile.schoolId);

  if (error) {
    return { error: error.message };
  }

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "contract",
    entityId: contractId,
    action: "contract_resumed",
  });

  const studentId = await getStudentIdForContract(supabase, contractId);
  if (studentId) revalidatePath(`/students/${studentId}/edit`);
  return {};
}

export async function endContract(contractId: string): Promise<ContractActionResult> {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data: contract, error: fetchError } = await supabase
    .from("contracts")
    .select("id, status")
    .eq("id", contractId)
    .single();

  if (fetchError || !contract) {
    return { error: "Contrato não encontrado" };
  }

  if (contract.status !== "active" && contract.status !== "paused") {
    return { error: "Este contrato já está encerrado" };
  }

  const { error } = await supabase
    .from("contracts")
    .update({
      status: "finished",
      end_date: new Date().toISOString().slice(0, 10),
    })
    .eq("id", contractId)
    .eq("school_id", profile.schoolId);

  if (error) {
    return { error: error.message };
  }

  await supabase
    .from("contract_installments")
    .update({ status: "canceled" })
    .eq("contract_id", contractId)
    .eq("status", "pending");

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "contract",
    entityId: contractId,
    action: "contract_ended",
  });

  const studentId = await getStudentIdForContract(supabase, contractId);
  if (studentId) revalidatePath(`/students/${studentId}/edit`);
  return {};
}

export async function editInstallmentDueDate(
  installmentId: string,
  input: InstallmentDueDateInput,
): Promise<ContractActionResult> {
  const profile = await requireRole("admin");
  const parsed = installmentDueDateSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();

  const { data: installment, error: fetchError } = await supabase
    .from("contract_installments")
    .select("id, contract_id, status")
    .eq("id", installmentId)
    .single();

  if (fetchError || !installment) {
    return { error: "Parcela não encontrada" };
  }

  if (installment.status !== "pending") {
    return { error: "Só é possível editar o vencimento de parcelas pendentes" };
  }

  const { error } = await supabase
    .from("contract_installments")
    .update({ due_date: parsed.data.dueDate })
    .eq("id", installment.id)
    .eq("school_id", profile.schoolId);

  if (error) {
    return { error: error.message };
  }

  const studentId = await getStudentIdForContract(supabase, installment.contract_id);
  if (studentId) revalidatePath(`/students/${studentId}/edit`);
  return {};
}
