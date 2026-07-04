"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { contractSchema, type ContractInput } from "@/lib/validations/contract";

export type ContractActionResult = { error?: string };

export type ActiveContractInfo = {
  id: string;
  planName: string;
  startDate: string;
};

export async function getActiveContractForStudent(
  studentId: string,
): Promise<ActiveContractInfo | null> {
  await requireRole("admin");
  const supabase = await createClient();

  const { data } = await supabase
    .from("contracts")
    .select("id, start_date, plans(name), contract_students!inner(student_id)")
    .eq("contract_students.student_id", studentId)
    .eq("status", "active")
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    planName: data.plans?.name ?? "-",
    startDate: data.start_date,
  };
}

function calculateFinalPrice(
  basePrice: number,
  discountType: ContractInput["discountType"],
  discountValue: number,
): number {
  if (discountType === "fixed") {
    return Math.max(0, Math.round((basePrice - discountValue) * 100) / 100);
  }
  if (discountType === "percentage") {
    return Math.max(
      0,
      Math.round(basePrice * (1 - discountValue / 100) * 100) / 100,
    );
  }
  return basePrice;
}

export async function createContract(
  studentId: string,
  input: ContractInput,
): Promise<ContractActionResult> {
  const profile = await requireRole("admin");
  const parsed = contractSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("id, base_price")
    .eq("id", data.planId)
    .single();

  if (planError || !plan) {
    return { error: "Plano não encontrado" };
  }

  const activeContract = await getActiveContractForStudent(studentId);

  if (activeContract && activeContract.id !== data.endPreviousContractId) {
    return {
      error:
        "Este aluno já possui um contrato ativo. Confirme o encerramento do contrato anterior antes de continuar.",
    };
  }

  if (activeContract) {
    const { error: endError } = await supabase
      .from("contracts")
      .update({
        status: "finished",
        end_date: new Date().toISOString().slice(0, 10),
      })
      .eq("id", activeContract.id)
      .eq("school_id", profile.schoolId);

    if (endError) {
      return { error: endError.message };
    }
  }

  const originalPrice = plan.base_price;
  const finalPrice = calculateFinalPrice(
    originalPrice,
    data.discountType,
    data.discountValue,
  );
  const installmentAmount =
    Math.round((finalPrice / data.installmentsCount) * 100) / 100;
  const paymentDay = Number(data.firstDueDate.slice(8, 10));

  const financialResponsibleId =
    data.financialResponsibleType === "student"
      ? studentId
      : data.financialResponsibleType === "guardian"
        ? data.financialResponsibleGuardianId || null
        : null;

  const notes =
    data.financialResponsibleType === "other" &&
    data.financialResponsibleOtherName
      ? `Responsável financeiro (outro): ${data.financialResponsibleOtherName}`
      : null;

  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .insert({
      school_id: profile.schoolId,
      financial_responsible_type: data.financialResponsibleType,
      financial_responsible_id: financialResponsibleId,
      plan_id: data.planId,
      price_table_id: data.priceTableId,
      start_date: data.startDate,
      end_date: data.endDate || null,
      status: "active",
      original_price: originalPrice,
      discount_type: data.discountType,
      discount_value: data.discountValue,
      final_price: finalPrice,
      installments_count: data.installmentsCount,
      installment_amount: installmentAmount,
      first_due_date: data.firstDueDate,
      payment_day: paymentDay,
      setup_fee_amount: data.setupFeeAmount,
      notes,
    })
    .select("id")
    .single();

  if (contractError || !contract) {
    return { error: contractError?.message ?? "Não foi possível criar o contrato" };
  }

  const { error: linkError } = await supabase.from("contract_students").insert({
    school_id: profile.schoolId,
    contract_id: contract.id,
    student_id: studentId,
  });

  if (linkError) {
    return { error: linkError.message };
  }

  const { error: studentError } = await supabase
    .from("students")
    .update({ current_contract_id: contract.id })
    .eq("id", studentId);

  if (studentError) {
    return { error: studentError.message };
  }

  revalidatePath(`/students/${studentId}/edit`);
  return {};
}
