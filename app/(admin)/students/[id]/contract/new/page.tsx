import { notFound } from "next/navigation";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { getActiveContractForStudent } from "./actions";
import { ContractWizard } from "./contract-wizard";

export default async function NewContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: studentId } = await params;
  await requireRole("admin");
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, name")
    .eq("id", studentId)
    .single();

  if (!student) notFound();

  const [{ data: priceTables }, { data: plans }, { data: guardianLinks }, activeContract] =
    await Promise.all([
      supabase
        .from("price_tables")
        .select("id, name")
        .eq("status", "active")
        .order("name"),
      supabase
        .from("plans")
        .select("id, price_table_id, name, base_price, setup_fee")
        .eq("status", "active")
        .order("name"),
      supabase
        .from("student_guardians")
        .select("is_financial_responsible, guardians(id, name)")
        .eq("student_id", studentId),
      getActiveContractForStudent(studentId),
    ]);

  const guardians = (guardianLinks ?? [])
    .filter((link) => link.guardians)
    .map((link) => ({
      id: link.guardians!.id,
      name: link.guardians!.name,
      isFinancialResponsible: link.is_financial_responsible,
    }));

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="w-full max-w-sm">
        <h1 className="font-heading text-2xl font-semibold">Associar plano</h1>
        <p className="text-sm text-muted-foreground">{student.name}</p>
      </div>
      <ContractWizard
        studentId={student.id}
        studentName={student.name}
        priceTables={priceTables ?? []}
        plans={(plans ?? []).map((plan) => ({
          id: plan.id,
          priceTableId: plan.price_table_id,
          name: plan.name,
          basePrice: plan.base_price,
          setupFee: plan.setup_fee,
        }))}
        guardians={guardians}
        activeContract={activeContract}
      />
    </div>
  );
}
