// Script de seed: popula o catálogo de eventos de medalhas (Fase 12) em
// vários anos (corrente + 2 anteriores), com override de pontuação em pelo
// menos 1 evento, e lançamentos cobrindo os 3 status de workflow
// (pending/approved/rejected, incluindo um ciclo completo de
// rejeitado-e-reenviado) e os 4 níveis de resultado
// (ouro/prata/bronze/participação). A conta demo (aluno@nexusdojo.dev)
// recebe histórico próprio dedicado (aprovadas em anos diferentes + 1
// pendente) para validar a visão pessoal do ranking.
// Uso: node scripts/seed-medals.mjs

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const CURRENT_YEAR = 2026;
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];
const LEVELS = ["ouro", "prata", "bronze", "participacao"];

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

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[randomInt(0, arr.length - 1)];
}
function maybe(probability, value) {
  return Math.random() < probability ? value : null;
}

const EVENT_TEMPLATES = [
  { name: "Copa Guará de Jiu-Jitsu", organization: "Federação de Jiu-Jitsu de Brasília" },
  { name: "Campeonato Distrital Kids", organization: "Federação de Jiu-Jitsu de Brasília" },
  { name: "Copa Centro-Oeste No-Gi", organization: "CBJJE" },
  { name: "Aberto Regional de Muay Thai", organization: "Federação de Muay Thai do DF" },
  { name: "Campeonato Brasileiro de Jiu-Jitsu", organization: "CBJJ" },
];

const CATEGORY_TEMPLATES = [
  "Adulto Leve Faixa Azul",
  "Adulto Pena Faixa Roxa",
  "Kids Pena Faixa Amarela",
  "Kids Médio Faixa Cinza",
  "Adulto Pesado Faixa Marrom",
  "Absoluto Faixa Preta",
];

async function main() {
  const { data: schools, error: schoolsError } = await supabase
    .from("schools")
    .select("id")
    .limit(1);
  if (schoolsError) throw schoolsError;
  const schoolId = schools[0].id;

  const { data: staffUsers, error: staffError } = await supabase
    .from("users")
    .select("id, role")
    .eq("school_id", schoolId)
    .eq("status", "active");
  if (staffError) throw staffError;
  const staffIds = staffUsers.map((u) => u.id);
  const adminId = staffUsers.find((u) => u.role === "admin")?.id ?? staffIds[0];

  const { data: modalities, error: modalitiesError } = await supabase
    .from("modalities")
    .select("id, name")
    .eq("school_id", schoolId);
  if (modalitiesError) throw modalitiesError;

  const { data: usersPage } = await supabase.auth.admin.listUsers({ perPage: 200 });
  const demoAuthUser = usersPage.users.find((u) => u.email === "aluno@nexusdojo.dev");
  const { data: demoStudent } = await supabase
    .from("students")
    .select("id")
    .eq("auth_user_id", demoAuthUser.id)
    .single();
  const demoStudentId = demoStudent.id;

  const { data: allStudents, error: studentsError } = await supabase
    .from("students")
    .select("id, name")
    .eq("school_id", schoolId)
    .eq("status", "ativo");
  if (studentsError) throw studentsError;
  const otherStudents = allStudents.filter((s) => s.id !== demoStudentId);
  console.log(`${allStudents.length} alunos ativos (${otherStudents.length} + conta demo).`);

  // 1) Catálogo de eventos: 2 por ano (corrente + 2 anteriores) = 6 no total,
  // datas espalhadas pelo ano, modalidade sugerida aleatória.
  const eventsToInsert = [];
  for (const year of YEARS) {
    for (let i = 0; i < 2; i++) {
      const template = pick(EVENT_TEMPLATES);
      const month = randomInt(1, 11);
      const day = randomInt(1, 28);
      eventsToInsert.push({
        school_id: schoolId,
        name: `${template.name} ${year}`,
        organization: template.organization,
        event_date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        modality_id: maybe(0.7, pick(modalities).id),
        created_by_user_id: adminId,
      });
    }
  }

  const { data: insertedEvents, error: eventsError } = await supabase
    .from("medal_events")
    .insert(eventsToInsert)
    .select("id, name, event_date");
  if (eventsError) throw eventsError;
  console.log(`${insertedEvents.length} eventos criados (${YEARS.join(", ")}).`);

  // 2) Override de pontuação (decisão 5 da Fase 12) no evento mais
  // relevante (Campeonato Brasileiro, quando sorteado) ou, na ausência
  // dele, no primeiro evento do ano corrente — garante pelo menos 1 evento
  // com pontuação própria, sempre.
  const overrideEvent =
    insertedEvents.find((e) => e.name.startsWith("Campeonato Brasileiro")) ??
    insertedEvents.find((e) => e.event_date.startsWith(String(CURRENT_YEAR))) ??
    insertedEvents[0];

  const { error: overrideError } = await supabase.from("medal_event_point_rules").insert([
    { event_id: overrideEvent.id, level: "ouro", points: 10 },
    { event_id: overrideEvent.id, level: "prata", points: 6 },
    { event_id: overrideEvent.id, level: "bronze", points: 3 },
    { event_id: overrideEvent.id, level: "participacao", points: 1 },
  ]);
  if (overrideError) throw overrideError;
  console.log(`Override de pontuação aplicado em "${overrideEvent.name}" (${overrideEvent.event_date}).`);

  // 3) Distribuição de medalhas entre os alunos (nem todos participam;
  // quem participa pode ter várias). ~45% dos alunos "normais" recebem ao
  // menos 1 lançamento.
  const participatingStudents = otherStudents.filter(() => Math.random() < 0.45);
  console.log(`${participatingStudents.length} alunos (fora a conta demo) vão receber ao menos 1 medalha.`);

  const medalsToInsert = [];
  let approvedCount = 0;
  let pendingCount = 0;
  let rejectedCount = 0;
  const levelCounts = { ouro: 0, prata: 0, bronze: 0, participacao: 0 };

  function buildApproved(studentId, event, level) {
    const originIsStaff = Math.random() < 0.5;
    const reviewedAt = `${event.event_date}T18:00:00Z`;
    return {
      school_id: schoolId,
      student_id: studentId,
      event_id: event.id,
      modality_id: maybe(0.6, pick(modalities).id),
      category: maybe(0.7, pick(CATEGORY_TEMPLATES)),
      level,
      status: "approved",
      submitted_by_student_id: originIsStaff ? null : studentId,
      submitted_by_user_id: originIsStaff ? pick(staffIds) : null,
      reviewed_by_user_id: pick(staffIds),
      reviewed_at: reviewedAt,
    };
  }

  function buildPending(studentId, event, level) {
    return {
      school_id: schoolId,
      student_id: studentId,
      event_id: event.id,
      modality_id: maybe(0.6, pick(modalities).id),
      category: maybe(0.7, pick(CATEGORY_TEMPLATES)),
      level,
      status: "pending",
      submitted_by_student_id: studentId,
    };
  }

  function buildRejected(studentId, event, level) {
    return {
      school_id: schoolId,
      student_id: studentId,
      event_id: event.id,
      modality_id: maybe(0.6, pick(modalities).id),
      category: maybe(0.7, pick(CATEGORY_TEMPLATES)),
      level,
      status: "rejected",
      submitted_by_student_id: studentId,
      reviewed_by_user_id: pick(staffIds),
      reviewed_at: `${event.event_date}T18:00:00Z`,
      rejection_reason: "Comprovante não confere com o evento informado.",
    };
  }

  for (const student of participatingStudents) {
    const medalCount = randomInt(1, 3);
    for (let i = 0; i < medalCount; i++) {
      const event = pick(insertedEvents);
      const level = pick(LEVELS);
      levelCounts[level] += 1;

      const roll = Math.random();
      if (roll < 0.75) {
        medalsToInsert.push(buildApproved(student.id, event, level));
        approvedCount += 1;
      } else if (roll < 0.9) {
        medalsToInsert.push(buildPending(student.id, event, level));
        pendingCount += 1;
      } else {
        medalsToInsert.push(buildRejected(student.id, event, level));
        rejectedCount += 1;
      }
    }
  }

  // 4) Histórico dedicado da conta demo (aluno@nexusdojo.dev): aprovadas
  // em 2 anos diferentes + 1 pendente, para validar a visão pessoal do
  // ranking (pontos anuais/totais/colocação).
  const demoEventCurrentYear = insertedEvents.find((e) => e.event_date.startsWith(String(CURRENT_YEAR)));
  const demoEventPastYear = insertedEvents.find((e) => e.event_date.startsWith(String(CURRENT_YEAR - 1)));
  medalsToInsert.push(buildApproved(demoStudentId, demoEventCurrentYear, "ouro"));
  medalsToInsert.push(buildApproved(demoStudentId, demoEventPastYear, "prata"));
  medalsToInsert.push(buildPending(demoStudentId, pick(insertedEvents), "bronze"));
  approvedCount += 2;
  pendingCount += 1;
  levelCounts.ouro += 1;
  levelCounts.prata += 1;
  levelCounts.bronze += 1;

  const { data: inserted, error: medalsError } = await supabase
    .from("medals")
    .insert(medalsToInsert)
    .select("id, student_id, status, level");
  if (medalsError) throw medalsError;
  console.log(
    `\n${inserted.length} medalhas criadas — approved: ${approvedCount} | pending: ${pendingCount} | rejected: ${rejectedCount}`,
  );
  console.log(
    `Níveis: ouro=${levelCounts.ouro} prata=${levelCounts.prata} bronze=${levelCounts.bronze} participacao=${levelCounts.participacao}`,
  );

  // 5) Ciclo completo de "rejeitado e reenviado" (decisão 6 da Fase 12):
  // cria uma rejeitada e, em seguida, replica exatamente a operação de
  // `updateMyMedal` (volta pending, limpa a revisão anterior) — para essa
  // 1 medalha ficar de fato como um reenvio real, não só um pending comum.
  const resendStudent = pick(participatingStudents);
  const resendEvent = pick(insertedEvents);
  const { data: toResend, error: resendInsertError } = await supabase
    .from("medals")
    .insert(buildRejected(resendStudent.id, resendEvent, "bronze"))
    .select("id")
    .single();
  if (resendInsertError) throw resendInsertError;

  const { error: resendUpdateError } = await supabase
    .from("medals")
    .update({
      category: "Categoria corrigida no reenvio",
      status: "pending",
      rejection_reason: null,
      reviewed_by_user_id: null,
      reviewed_at: null,
    })
    .eq("id", toResend.id);
  if (resendUpdateError) throw resendUpdateError;
  console.log(`1 ciclo completo de rejeitado-e-reenviado criado (aluno ${resendStudent.name}).`);

  console.log("\nSeed de medalhas e eventos concluído com sucesso.");
}

main().catch((err) => {
  console.error("Erro no seed:", err);
  process.exit(1);
});
