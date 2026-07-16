// Script temporário de seed: cria 12 planos (2x/3x/Full semanal x
// Mensal/Trimestral/Semestral/Anual, desconto crescente por duração) e
// gera um contrato realista para todos os alunos da escola, com histórico
// de parcelas pagas/vencidas/pendentes para popular os relatórios
// financeiros (inadimplentes, recebido no mês, a vencer, etc).
// Uso: node scripts/seed-full-finance.mjs

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const TODAY = "2026-07-15";

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

function round2(n) {
  return Math.round(n * 100) / 100;
}
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function weightedPick(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const it of items) {
    if (r < it.weight) return it;
    r -= it.weight;
  }
  return items[items.length - 1];
}
function addMonths(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + n, d)).toISOString().slice(0, 10);
}
function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

const TIERS = [
  { key: "2x", label: "2x/semana", monthly: 220.0, weight: 40 },
  { key: "3x", label: "3x/semana", monthly: 260.0, weight: 35 },
  { key: "full", label: "Acesso Full", monthly: 299.9, weight: 25 },
];

const DURATIONS = [
  { key: "monthly", label: "Mensal", months: 1, discount: 0, installments: 1, weight: 50 },
  { key: "quarterly", label: "Trimestral", months: 3, discount: 0.05, installments: 3, weight: 25 },
  { key: "semiannual", label: "Semestral", months: 6, discount: 0.1, installments: 6, weight: 15 },
  { key: "annual", label: "Anual", months: 12, discount: 0.15, installments: 12, weight: 10 },
];

const PAYMENT_DAYS = [1, 5, 10, 15, 20, 25];

const PAYMENT_METHODS = [
  { method: "pix", weight: 50 },
  { method: "credit_card", weight: 20 },
  { method: "cash", weight: 15 },
  { method: "bank_transfer", weight: 10 },
  { method: "debit_card", weight: 5 },
];

async function main() {
  const { data: priceTable, error: priceTableError } = await supabase
    .from("price_tables")
    .select("id, school_id")
    .eq("status", "active")
    .limit(1)
    .single();
  if (priceTableError) throw priceTableError;
  const schoolId = priceTable.school_id;
  console.log(`Escola: ${schoolId} | Tabela de preço: ${priceTable.id}`);

  // Aposenta o plano placeholder criado no seed anterior (não apaga por causa da FK restrict).
  const { error: legacyError } = await supabase
    .from("plans")
    .update({ status: "legacy" })
    .eq("school_id", schoolId)
    .eq("name", "Plano Mensal Ilimitado");
  if (legacyError) throw legacyError;

  console.log("\nGerando 12 planos (3 níveis x 4 durações, desconto crescente por duração):");
  const planRows = [];
  const planDefs = [];
  for (const tier of TIERS) {
    for (const duration of DURATIONS) {
      const basePrice = round2(tier.monthly * duration.months * (1 - duration.discount));
      const name = `${duration.label} — ${tier.label}`;
      planRows.push({
        school_id: schoolId,
        price_table_id: priceTable.id,
        name,
        plan_duration: duration.key,
        duration_months: duration.months,
        base_price: basePrice,
        classes_per_week: null,
        classes_total: null,
        unlimited: true,
        setup_fee: 0,
        loyalty_months: 0,
        description: `Acesso ${tier.label} às modalidades contratadas`,
        status: "active",
      });
      planDefs.push({ tierKey: tier.key, durationKey: duration.key, basePrice, installments: duration.installments });
      console.log(`  ${name}: R$ ${basePrice.toFixed(2)} (${duration.installments}x de R$ ${round2(basePrice / duration.installments).toFixed(2)})`);
    }
  }

  const { data: existingPlans, error: existingPlansError } = await supabase
    .from("plans")
    .select("id, name, plan_duration, base_price")
    .eq("school_id", schoolId)
    .eq("status", "active")
    .in("name", planRows.map((r) => r.name));
  if (existingPlansError) throw existingPlansError;

  const planNamesToCreate = planRows.filter((r) => !existingPlans.some((p) => p.name === r.name));
  let insertedPlans = [];
  if (planNamesToCreate.length > 0) {
    const { data, error: plansError } = await supabase
      .from("plans")
      .insert(planNamesToCreate)
      .select("id, name, plan_duration, base_price");
    if (plansError) throw plansError;
    insertedPlans = data;
  }
  const allPlans = [...existingPlans, ...insertedPlans];

  const planMap = new Map();
  for (const row of planRows) {
    const found = allPlans.find((p) => p.name === row.name);
    const def = planDefs.find((d) => `${DURATIONS.find((x) => x.key === d.durationKey).label} — ${TIERS.find((x) => x.key === d.tierKey).label}` === row.name);
    planMap.set(`${def.tierKey}_${def.durationKey}`, { id: found.id, basePrice: def.basePrice, installments: def.installments });
  }
  console.log(`\n${insertedPlans.length} planos novos criados, ${existingPlans.length} já existiam e foram reaproveitados.`);

  const { data: accounts, error: accountsError } = await supabase
    .from("financial_accounts")
    .select("id, type");
  if (accountsError) throw accountsError;
  const accountByType = Object.fromEntries(accounts.map((a) => [a.type, a.id]));
  const accountForMethod = {
    pix: accountByType.pix,
    credit_card: accountByType.card,
    debit_card: accountByType.card,
    cash: accountByType.cash,
    bank_transfer: accountByType.bank,
    other: accountByType.cash,
  };

  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("id, name, school_id, current_contract_id")
    .eq("school_id", schoolId);
  if (studentsError) throw studentsError;
  console.log(`\n${students.length} alunos encontrados. Criando contratos...`);

  const contractMeta = []; // { contractId, studentId, schoolId }

  for (const student of students) {
    if (student.current_contract_id) {
      await supabase.from("contracts").update({ status: "finished" }).eq("id", student.current_contract_id);
      await supabase
        .from("contract_installments")
        .update({ status: "canceled" })
        .eq("contract_id", student.current_contract_id)
        .eq("status", "pending");
    }

    const tier = weightedPick(TIERS);
    const duration = weightedPick(DURATIONS);
    const plan = planMap.get(`${tier.key}_${duration.key}`);
    const paymentDay = PAYMENT_DAYS[randomInt(0, PAYMENT_DAYS.length - 1)];
    const pastCount = randomInt(0, plan.installments);
    const firstDueDate = addMonths(`${TODAY.slice(0, 8)}${String(paymentDay).padStart(2, "0")}`, -pastCount);
    const installmentAmount = round2(plan.basePrice / plan.installments);

    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .insert({
        school_id: schoolId,
        financial_responsible_type: "student",
        financial_responsible_id: student.id,
        plan_id: plan.id,
        price_table_id: priceTable.id,
        start_date: firstDueDate,
        first_due_date: firstDueDate,
        installments_count: plan.installments,
        original_price: plan.basePrice,
        discount_type: "none",
        discount_value: 0,
        final_price: plan.basePrice,
        installment_amount: installmentAmount,
        payment_day: paymentDay,
        setup_fee_amount: 0,
        status: "active",
      })
      .select("id")
      .single();
    if (contractError) throw contractError;

    await supabase.from("contract_students").insert({ school_id: schoolId, contract_id: contract.id, student_id: student.id });
    await supabase.from("students").update({ current_contract_id: contract.id }).eq("id", student.id);

    contractMeta.push({ contractId: contract.id, studentId: student.id });
  }
  console.log(`${contractMeta.length} contratos criados.`);

  console.log("\nBuscando parcelas geradas pelo trigger...");
  const contractIds = contractMeta.map((c) => c.contractId);
  const studentByContract = Object.fromEntries(contractMeta.map((c) => [c.contractId, c.studentId]));

  const { data: installments, error: installmentsError } = await supabase
    .from("contract_installments")
    .select("*")
    .in("contract_id", contractIds);
  if (installmentsError) throw installmentsError;
  console.log(`${installments.length} parcelas encontradas.`);

  const updates = [];
  const movements = [];
  let paidCount = 0;
  let partialCount = 0;
  let overdueCount = 0;
  let futureCount = 0;
  let receivedThisMonth = 0;

  for (const inst of installments) {
    if (inst.due_date >= TODAY) {
      futureCount += 1;
      continue; // mantém pending futuro, como gerado pelo trigger
    }

    const roll = Math.random();
    const studentId = studentByContract[inst.contract_id];

    if (roll < 0.75) {
      // paga integralmente
      const paymentDate = (() => {
        const d = addDays(inst.due_date, randomInt(0, 5));
        return d > TODAY ? TODAY : d;
      })();
      const pm = weightedPick(PAYMENT_METHODS).method;
      updates.push({ ...inst, status: "paid", paid_amount: inst.amount, remaining_amount: 0, payment_date: paymentDate, payment_method: pm });
      movements.push({
        school_id: schoolId,
        student_id: studentId,
        contract_id: inst.contract_id,
        contract_installment_id: inst.id,
        financial_account_id: accountForMethod[pm],
        type: "income",
        amount: inst.amount,
        movement_date: paymentDate,
        payment_method: pm,
        category: "mensalidade",
      });
      paidCount += 1;
      if (paymentDate.slice(0, 7) === TODAY.slice(0, 7)) receivedThisMonth += inst.amount;
    } else if (roll < 0.85) {
      // parcialmente paga
      const paidAmount = round2(inst.amount * (randomInt(30, 70) / 100));
      const paymentDate = (() => {
        const d = addDays(inst.due_date, randomInt(0, 5));
        return d > TODAY ? TODAY : d;
      })();
      const pm = weightedPick(PAYMENT_METHODS).method;
      updates.push({
        ...inst,
        status: "partially_paid",
        paid_amount: paidAmount,
        remaining_amount: round2(inst.amount - paidAmount),
        payment_date: paymentDate,
        payment_method: pm,
      });
      movements.push({
        school_id: schoolId,
        student_id: studentId,
        contract_id: inst.contract_id,
        contract_installment_id: inst.id,
        financial_account_id: accountForMethod[pm],
        type: "income",
        amount: paidAmount,
        movement_date: paymentDate,
        payment_method: pm,
        category: "mensalidade",
      });
      partialCount += 1;
      if (paymentDate.slice(0, 7) === TODAY.slice(0, 7)) receivedThisMonth += paidAmount;
    } else {
      // continua pending com due_date passado -> aparece como vencida/inadimplente
      overdueCount += 1;
    }
  }

  console.log(`\nAplicando ${updates.length} atualizações de parcelas em lote...`);
  const chunkSize = 200;
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    const { error } = await supabase.from("contract_installments").upsert(chunk);
    if (error) throw error;
  }

  console.log(`Inserindo ${movements.length} movimentos financeiros em lote...`);
  for (let i = 0; i < movements.length; i += chunkSize) {
    const chunk = movements.slice(i, i + chunkSize);
    const { error } = await supabase.from("financial_movements").insert(chunk);
    if (error) throw error;
  }

  console.log("\n=== Resumo ===");
  console.log(`Parcelas pagas integralmente: ${paidCount}`);
  console.log(`Parcelas parcialmente pagas: ${partialCount}`);
  console.log(`Parcelas vencidas e não pagas (inadimplência): ${overdueCount}`);
  console.log(`Parcelas pendentes futuras: ${futureCount}`);
  console.log(`Total recebido em ${TODAY.slice(0, 7)}: R$ ${round2(receivedThisMonth).toFixed(2)}`);
  console.log("\nSeed concluído com sucesso.");
}

main().catch((err) => {
  console.error("Erro no seed:", err);
  process.exit(1);
});
