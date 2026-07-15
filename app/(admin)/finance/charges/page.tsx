import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { ChargesClient, type ChargeableInstallment } from "./charges-client";

function monthBounds(month?: string) {
  const base = month ? new Date(`${month}-01T00:00:00Z`) : new Date();
  const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1));
  const end = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 1));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    monthValue: start.toISOString().slice(0, 7),
  };
}

export default async function ChargesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; student?: string }>;
}) {
  const profile = await requireRole("admin");
  const { month, student } = await searchParams;
  const { start, end, monthValue } = monthBounds(month);
  const supabase = await createClient();

  const { data: school } = await supabase
    .from("schools")
    .select("pix_key")
    .eq("id", profile.schoolId)
    .single();

  const { data: accounts } = await supabase
    .from("financial_accounts")
    .select("id, name")
    .eq("status", "active")
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

  let installments: ChargeableInstallment[] = [];

  if (contractIdsFilter === null || contractIdsFilter.length > 0) {
    let query = supabase
      .from("contract_installments")
      .select(
        "id, installment_number, due_date, amount, remaining_amount, status, contracts(plans(name), contract_students(students(id, name)))",
      )
      .gte("reference_month", start)
      .lt("reference_month", end)
      .neq("status", "canceled")
      .order("due_date");

    if (contractIdsFilter !== null) {
      query = query.in("contract_id", contractIdsFilter);
    }

    const { data } = await query;

    const installmentIds = (data ?? []).map((row) => row.id);
    const { data: charges } =
      installmentIds.length > 0
        ? await supabase
            .from("installment_charges")
            .select("contract_installment_id, pix_payload, sent_at")
            .in("contract_installment_id", installmentIds)
            .order("sent_at", { ascending: false })
        : { data: [] };

    const latestChargeByInstallment = new Map<string, { pixPayload: string | null; sentAt: string }>();
    for (const charge of charges ?? []) {
      if (!latestChargeByInstallment.has(charge.contract_installment_id)) {
        latestChargeByInstallment.set(charge.contract_installment_id, {
          pixPayload: charge.pix_payload,
          sentAt: charge.sent_at,
        });
      }
    }

    installments = (data ?? []).map((row) => ({
      id: row.id,
      installmentNumber: row.installment_number,
      dueDate: row.due_date,
      amount: row.amount,
      remainingAmount: row.remaining_amount,
      status: row.status,
      studentId: row.contracts?.contract_students?.[0]?.students?.id ?? null,
      studentName: row.contracts?.contract_students?.[0]?.students?.name ?? "-",
      planName: row.contracts?.plans?.name ?? "-",
      lastCharge: latestChargeByInstallment.get(row.id) ?? null,
    }));
  }

  const paidCount = installments.filter((i) => i.status === "paid").length;
  const today = new Date().toISOString().slice(0, 10);
  const overdueCount = installments.filter(
    (i) => (i.status === "pending" || i.status === "partially_paid") && i.dueDate < today,
  ).length;
  const pendingCount = installments.filter(
    (i) => (i.status === "pending" || i.status === "partially_paid") && i.dueDate >= today,
  ).length;

  return (
    <ChargesClient
      hasPixKey={Boolean(school?.pix_key)}
      monthValue={monthValue}
      studentFilter={student ?? ""}
      installments={installments}
      accounts={accounts ?? []}
      counts={{ paid: paidCount, pending: pendingCount, overdue: overdueCount }}
    />
  );
}
