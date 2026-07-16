// Script de seed: gera sessões e presenças cobrindo os 3 fluxos de origem
// (aluno sinaliza + professor confirma / professor marca direto na tela
// antiga / professor inclui manualmente na chamada nova), com histórico
// realista nas últimas ~8 semanas, para popular dashboards, histórico de
// chamadas, ficha do aluno e painel do aluno.
// A conta demo (aluno@nexusdojo.dev) é deixada de fora da geração em massa
// de propósito — reservada para teste ao vivo dos fluxos via Playwright.
// Uso: node scripts/seed-attendance.mjs

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const TODAY = "2026-07-15";
const PAST_WEEKS = 8;
const FUTURE_DAYS = 7;

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
function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
function weekdayOf(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

async function main() {
  const rangeStart = addDays(TODAY, -PAST_WEEKS * 7);
  const rangeEnd = addDays(TODAY, FUTURE_DAYS);

  const { data: classGroups, error: cgError } = await supabase
    .from("class_groups")
    .select("id, school_id, name, week_days")
    .eq("status", "active");
  if (cgError) throw cgError;
  const schoolId = classGroups[0].school_id;
  console.log(`${classGroups.length} turmas ativas.`);

  const { data: usersRows, error: usersError } = await supabase
    .from("users")
    .select("id, role");
  if (usersError) throw usersError;
  const staffIds = usersRows.map((u) => u.id);

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
  const students = allStudents.filter((s) => s.id !== demoStudentId);
  console.log(`${students.length} alunos elegíveis para o seed em massa (excluindo a conta demo).`);

  // 1) Determinar todas as ocorrências (class_group_id, date) esperadas.
  const occurrences = [];
  for (const cg of classGroups) {
    let date = rangeStart;
    while (date <= rangeEnd) {
      if ((cg.week_days ?? []).includes(weekdayOf(date))) {
        occurrences.push({ classGroupId: cg.id, date });
      }
      date = addDays(date, 1);
    }
  }
  console.log(`${occurrences.length} ocorrências de turma esperadas no período ${rangeStart}..${rangeEnd}.`);

  // 2) Buscar sessões já existentes nesse período e mapear.
  const { data: existingSessions, error: sessionsError } = await supabase
    .from("class_sessions")
    .select("id, class_group_id, date, status, attendance_closed_at")
    .gte("date", rangeStart)
    .lte("date", rangeEnd);
  if (sessionsError) throw sessionsError;

  const sessionByKey = new Map();
  for (const s of existingSessions) {
    sessionByKey.set(`${s.class_group_id}|${s.date}`, s);
  }

  const missingSessions = occurrences.filter(
    (o) => !sessionByKey.has(`${o.classGroupId}|${o.date}`),
  );
  console.log(`Criando ${missingSessions.length} sessões que ainda não existiam...`);

  const chunkSize = 300;
  for (let i = 0; i < missingSessions.length; i += chunkSize) {
    const chunk = missingSessions.slice(i, i + chunkSize);
    const { data: inserted, error } = await supabase
      .from("class_sessions")
      .insert(
        chunk.map((o) => ({
          school_id: schoolId,
          class_group_id: o.classGroupId,
          date: o.date,
        })),
      )
      .select("id, class_group_id, date, status, attendance_closed_at");
    if (error) throw error;
    for (const s of inserted) sessionByKey.set(`${s.class_group_id}|${s.date}`, s);
  }

  const allSessions = Array.from(sessionByKey.values());
  console.log(`${allSessions.length} sessões no total (existentes + novas).`);

  // 3) Buscar attendances já existentes no período (para não duplicar).
  const sessionIds = allSessions.map((s) => s.id);
  const existingAttendanceKeys = new Set();
  for (let i = 0; i < sessionIds.length; i += chunkSize) {
    const chunk = sessionIds.slice(i, i + chunkSize);
    const { data: existingAtt, error } = await supabase
      .from("attendances")
      .select("class_session_id, student_id")
      .in("class_session_id", chunk);
    if (error) throw error;
    for (const a of existingAtt) existingAttendanceKeys.add(`${a.class_session_id}|${a.student_id}`);
  }
  console.log(`${existingAttendanceKeys.size} presenças já existentes no período (não serão duplicadas).`);

  // 4) Persona + turmas "de casa" por aluno, para gerar clusters realistas.
  const studentProfile = new Map();
  for (const s of students) {
    const personaRoll = Math.random();
    const persona =
      personaRoll < 0.2 ? "high" : personaRoll < 0.75 ? "medium" : "low";
    const homeGroups = new Set();
    const homeCount = randomInt(1, 2);
    while (homeGroups.size < homeCount) {
      homeGroups.add(pick(classGroups).id);
    }
    studentProfile.set(s.id, { persona, homeGroups });
  }

  const PERSONA_RATE = { high: 0.45, medium: 0.2, low: 0.05 };
  const DROP_IN_RATE = 0.03;

  const attendanceRows = [];
  let flowA = 0;
  let flowB = 0;
  let flowC = 0;
  let flowD = 0;
  let flowE = 0;
  let futureSignals = 0;

  for (const session of allSessions) {
    const isPast = session.date < TODAY;
    const isFuture = session.date > TODAY;

    for (const student of students) {
      const key = `${session.id}|${student.id}`;
      if (existingAttendanceKeys.has(key)) continue;

      const profile = studentProfile.get(student.id);
      const isHome = profile.homeGroups.has(session.class_group_id);
      const baseRate = isHome ? PERSONA_RATE[profile.persona] : DROP_IN_RATE;

      // Alunos "low" ficam sem presença nos últimos 20 dias, para aparecerem
      // como "ausentes há 15+ dias" nos dashboards.
      const effectiveRate =
        profile.persona === "low" && session.date >= addDays(TODAY, -20) ? 0 : baseRate;

      if (isFuture) {
        if (Math.random() < 0.04) {
          attendanceRows.push({
            school_id: schoolId,
            class_session_id: session.id,
            student_id: student.id,
            status: "signaled",
            signaled_at: `${addDays(session.date, -1)}T10:00:00Z`,
          });
          futureSignals += 1;
        }
        continue;
      }

      if (Math.random() >= effectiveRate) continue;

      const roll = Math.random();
      const staffId = pick(staffIds);
      const signaledAt = `${session.date}T${String(randomInt(6, 20)).padStart(2, "0")}:00:00Z`;

      if (roll < 0.35) {
        attendanceRows.push({
          school_id: schoolId,
          class_session_id: session.id,
          student_id: student.id,
          status: "confirmed",
          signaled_at: signaledAt,
          confirmed_at: signaledAt,
          confirmed_by: staffId,
        });
        flowA += 1;
      } else if (roll < 0.65) {
        attendanceRows.push({
          school_id: schoolId,
          class_session_id: session.id,
          student_id: student.id,
          status: "presente",
          registered_by_user_id: staffId,
        });
        flowB += 1;
      } else if (roll < 0.8) {
        attendanceRows.push({
          school_id: schoolId,
          class_session_id: session.id,
          student_id: student.id,
          status: "added_by_instructor",
          confirmed_at: signaledAt,
          confirmed_by: staffId,
          registered_by_user_id: staffId,
        });
        flowC += 1;
      } else if (roll < 0.92) {
        if (isPast) {
          attendanceRows.push({
            school_id: schoolId,
            class_session_id: session.id,
            student_id: student.id,
            status: "no_show",
            signaled_at: signaledAt,
          });
          flowD += 1;
        } else {
          attendanceRows.push({
            school_id: schoolId,
            class_session_id: session.id,
            student_id: student.id,
            status: "signaled",
            signaled_at: signaledAt,
          });
        }
      } else {
        attendanceRows.push({
          school_id: schoolId,
          class_session_id: session.id,
          student_id: student.id,
          status: "cancelled",
          signaled_at: signaledAt,
        });
        flowE += 1;
      }
    }
  }

  console.log(`\nGerando ${attendanceRows.length} presenças novas...`);
  console.log(
    `  fluxo A (sinalizou+confirmado): ${flowA} | fluxo B (marcado direto): ${flowB} | fluxo C (incluído manualmente): ${flowC} | no_show: ${flowD} | cancelado: ${flowE} | sinalizações futuras: ${futureSignals}`,
  );

  for (let i = 0; i < attendanceRows.length; i += chunkSize) {
    const chunk = attendanceRows.slice(i, i + chunkSize);
    const { error } = await supabase.from("attendances").insert(chunk);
    if (error) throw error;
  }

  // 5) Fechar sessões passadas (status realizada + attendance_closed_at no
  // fim do próprio dia da sessão), deixando hoje e o futuro em aberto.
  const pastSessions = allSessions.filter((s) => s.date < TODAY);
  const pastByDate = new Map();
  for (const s of pastSessions) {
    if (!pastByDate.has(s.date)) pastByDate.set(s.date, []);
    pastByDate.get(s.date).push(s.id);
  }
  console.log(`\nFechando ${pastSessions.length} sessões passadas (realizada + attendance_closed_at) em ${pastByDate.size} datas...`);
  for (const [date, ids] of pastByDate) {
    const { error } = await supabase
      .from("class_sessions")
      .update({ status: "realizada", attendance_closed_at: `${date}T22:00:00Z` })
      .in("id", ids)
      .eq("status", "agendada");
    if (error) throw error;
  }

  console.log("\nSeed de presença concluído com sucesso.");
}

main().catch((err) => {
  console.error("Erro no seed:", err);
  process.exit(1);
});
