// Script temporário de seed: gera um contrato de teste com parcelas em estados
// mistos (paga / vencida / pendente futura) para a conta demo do aluno.
// Uso: node scripts/seed-student-finance.mjs
// Requer .env.local com NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const STUDENT_EMAIL = "aluno@nexusdojo.dev";

function loadEnvLocal() {
  const content = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function main() {
  const { data: usersPage, error: usersError } = await supabase.auth.admin.listUsers({ perPage: 200 });
  if (usersError) throw usersError;
  const authUser = usersPage.users.find((u) => u.email === STUDENT_EMAIL);
  if (!authUser) throw new Error(`Usuário auth não encontrado para ${STUDENT_EMAIL}`);

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, school_id, current_contract_id, name")
    .eq("auth_user_id", authUser.id)
    .single();
  if (studentError) throw studentError;
  console.log(`Aluno encontrado: ${student.name} (${student.id})`);

  if (student.current_contract_id) {
    console.log(`Aluno já tem contrato ativo (${student.current_contract_id}) — encerrando antes de criar o novo.`);
    const { error: finishError } = await supabase
      .from("contracts")
      .update({ status: "finished" })
      .eq("id", student.current_contract_id);
    if (finishError) throw finishError;
    const { error: cancelError } = await supabase
      .from("contract_installments")
      .update({ status: "canceled" })
      .eq("contract_id", student.current_contract_id)
      .eq("status", "pending");
    if (cancelError) throw cancelError;
  }

  let { data: priceTable, error: priceTableError } = await supabase
    .from("price_tables")
    .select("id")
    .eq("school_id", student.school_id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (priceTableError) throw priceTableError;

  if (!priceTable) {
    console.log("Nenhuma tabela de preço ativa encontrada — criando 'Tabela Padrão 2026'.");
    const { data: newPriceTable, error: createPriceTableError } = await supabase
      .from("price_tables")
      .insert({
        school_id: student.school_id,
        name: "Tabela Padrão 2026",
        description: "Tabela de preço padrão (dados de demonstração)",
        valid_from: "2026-01-01",
        valid_until: null,
        status: "active",
      })
      .select("id")
      .single();
    if (createPriceTableError) throw createPriceTableError;
    priceTable = newPriceTable;
  }

  let { data: plan, error: planError } = await supabase
    .from("plans")
    .select("id, base_price")
    .eq("school_id", student.school_id)
    .eq("price_table_id", priceTable.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (planError) throw planError;

  if (!plan) {
    console.log("Nenhum plano ativo encontrado — criando 'Plano Mensal Ilimitado'.");
    const { data: newPlan, error: createPlanError } = await supabase
      .from("plans")
      .insert({
        school_id: student.school_id,
        price_table_id: priceTable.id,
        name: "Plano Mensal Ilimitado",
        plan_duration: "monthly",
        duration_months: 1,
        base_price: 250,
        classes_per_week: null,
        classes_total: null,
        unlimited: true,
        setup_fee: 0,
        loyalty_months: 0,
        description: "Plano padrão (dados de demonstração)",
        status: "active",
      })
      .select("id, base_price")
      .single();
    if (createPlanError) throw createPlanError;
    plan = newPlan;
  }
  console.log(`Usando plano ${plan.id} (preço base ${plan.base_price})`);

  const { data: pixAccount, error: pixAccountError } = await supabase
    .from("financial_accounts")
    .select("id")
    .eq("school_id", student.school_id)
    .eq("type", "pix")
    .limit(1)
    .single();
  if (pixAccountError) throw pixAccountError;

  const installmentsCount = 3;
  const installmentAmount = Math.round((plan.base_price / installmentsCount) * 100) / 100;

  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .insert({
      school_id: student.school_id,
      financial_responsible_type: "student",
      financial_responsible_id: student.id,
      plan_id: plan.id,
      price_table_id: priceTable.id,
      start_date: "2026-06-01",
      first_due_date: "2026-06-01",
      installments_count: installmentsCount,
      original_price: plan.base_price,
      discount_type: "none",
      discount_value: 0,
      final_price: plan.base_price,
      installment_amount: installmentAmount,
      payment_day: 1,
      setup_fee_amount: 0,
      status: "active",
    })
    .select("id")
    .single();
  if (contractError) throw contractError;
  console.log(`Contrato criado: ${contract.id}`);

  const { error: linkError } = await supabase
    .from("contract_students")
    .insert({ school_id: student.school_id, contract_id: contract.id, student_id: student.id });
  if (linkError) throw linkError;

  const { error: updateStudentError } = await supabase
    .from("students")
    .update({ current_contract_id: contract.id })
    .eq("id", student.id);
  if (updateStudentError) throw updateStudentError;

  const { data: installments, error: installmentsError } = await supabase
    .from("contract_installments")
    .select("id, installment_number, amount, due_date")
    .eq("contract_id", contract.id)
    .order("installment_number");
  if (installmentsError) throw installmentsError;
  console.log(`Parcelas geradas pelo trigger: ${installments.length}`);
  installments.forEach((i) => console.log(`  #${i.installment_number} venc. ${i.due_date} valor ${i.amount}`));

  const paidInstallment = installments[0];
  const { error: payError } = await supabase
    .from("contract_installments")
    .update({
      status: "paid",
      paid_amount: paidInstallment.amount,
      remaining_amount: 0,
      payment_date: "2026-06-01",
      payment_method: "pix",
    })
    .eq("id", paidInstallment.id);
  if (payError) throw payError;

  const { error: movementError } = await supabase.from("financial_movements").insert({
    school_id: student.school_id,
    student_id: student.id,
    contract_id: contract.id,
    contract_installment_id: paidInstallment.id,
    financial_account_id: pixAccount.id,
    type: "income",
    amount: paidInstallment.amount,
    movement_date: "2026-06-01",
    payment_method: "pix",
    category: "mensalidade",
  });
  if (movementError) throw movementError;

  console.log("Parcela #1 marcada como paga.");
  console.log("Parcela #2 (venc. 2026-07-01) fica pendente com vencimento passado -> aparece como vencida.");
  console.log("Parcela #3 (venc. 2026-08-01) fica pendente futura.");
  console.log("\nSeed concluído com sucesso.");
}

main().catch((err) => {
  console.error("Erro no seed:", err);
  process.exit(1);
});
