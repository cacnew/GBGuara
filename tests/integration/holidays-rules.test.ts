/**
 * Testes de integração da Fase 16.5, contra o Supabase compartilhado de
 * dev (nexusdojo-dev). Duas partes:
 *
 * 1) Cálculo de datas móveis (Páscoa/Carnaval/Sexta-feira Santa/Corpus
 *    Christi, Fase 16.1) — a lógica vive inteiramente em SQL
 *    (`public.easter_date`/`public.seed_national_holidays`), sem
 *    equivalente em TS puro pra testar offline, então chama as funções
 *    reais via `rpc` contra o banco (mesmo espírito de outros testes que
 *    dependem do Supabase real, ex: `medals-rules.test.ts`).
 *
 * 2) Bloqueio de sinalização/chamada em dia sem aula (Fase 16.3) — a
 *    checagem em si vive dentro de `signalAttendance`
 *    (`modules/students/agenda.ts`) e `openOrReuseClassSession`
 *    (`modules/classes/sessions.ts`), Server Actions com `"use server"`
 *    que dependem de `next/headers` e não são chamáveis diretamente aqui
 *    (mesma limitação documentada em `attendance-rules.test.ts`). As duas
 *    fazem exatamente a mesma checagem: `getHolidayForDate(supabase,
 *    schoolId, date)` — se retornar um feriado, bloqueia; senão, segue o
 *    fluxo normal. Testar essa função direto, sob RLS real (como aluno e
 *    como staff), cobre o comportamento de bloqueio das duas sem duplicar
 *    lógica de negócio no teste.
 *
 * Requer `.env.local` (pulado automaticamente sem ele).
 */
import { readFileSync, existsSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getHolidayForDate } from "@/modules/holidays/lookup";

const ENV_PATH = ".env.local";

function loadEnv(): Record<string, string> {
  if (!existsSync(ENV_PATH)) return {};
  return Object.fromEntries(
    readFileSync(ENV_PATH, "utf8")
      .split("\n")
      .filter((l) => l.includes("="))
      .map((l) => {
        const idx = l.indexOf("=");
        return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
      }),
  );
}

const env = loadEnv();
const hasEnv = Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
const STUDENT_EMAIL = env.TEST_STUDENT_EMAIL || "aluno@nexusdojo.dev";

async function signIn(email: string, password: string) {
  const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data } = await anon.auth.signInWithPassword({ email, password });
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${data!.session!.access_token}` } },
  });
}

// Soma dias a uma data `YYYY-MM-DD` sem passar por `new Date(string)` — mesmo
// helper (duplicado de propósito, é só matemática de calendário) de
// `modules/holiday-notifications/job.ts`.
function addDaysISO(dateISO: string, days: number): string {
  const [year, month, day] = dateISO.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

describe.skipIf(!hasEnv)("cálculo de datas móveis (Fase 16.1/16.5)", () => {
  let admin: SupabaseClient;

  beforeAll(() => {
    admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  });

  // Datas oficiais da Páscoa conferidas manualmente na Fase 16.1.
  const KNOWN_EASTER_DATES: Array<[number, string]> = [
    [2024, "2024-03-31"],
    [2025, "2025-04-20"],
    [2026, "2026-04-05"],
    [2027, "2027-03-28"],
    [2028, "2028-04-16"],
  ];

  it.each(KNOWN_EASTER_DATES)("easter_date(%i) bate com a data oficial da Páscoa", async (year, expected) => {
    const { data, error } = await admin.rpc("easter_date", { p_year: year });
    expect(error).toBeNull();
    expect(data).toBe(expected);
  });

  it("seed_national_holidays calcula Carnaval/Sexta-feira Santa/Corpus Christi como offsets corretos da Páscoa, num ano novo (fora do que o trigger já semeia)", async () => {
    const testYear = 2030;
    const { data: school, error: schoolError } = await admin
      .from("schools")
      .insert({ name: "TMP TESTE 16.5 - datas móveis" })
      .select("id")
      .single();
    expect(schoolError).toBeNull();
    const schoolId = school!.id;

    try {
      // O trigger `schools_create_default_holidays` já semeou o ano
      // corrente + próximo para essa escola nova (Fase 16.1); chamar de
      // novo para `testYear` (2030) soma os 3 feriados móveis a mais,
      // sem conflitar com o que o trigger já inseriu.
      const { error: seedError } = await admin.rpc("seed_national_holidays", {
        p_school_id: schoolId,
        p_year: testYear,
      });
      expect(seedError).toBeNull();

      const { data: easter } = await admin.rpc("easter_date", { p_year: testYear });
      const expectedCarnaval = addDaysISO(easter as string, -47);
      const expectedSextaSanta = addDaysISO(easter as string, -2);
      const expectedCorpusChristi = addDaysISO(easter as string, 60);

      const { data: mobileHolidays } = await admin
        .from("holidays")
        .select("name, date")
        .eq("school_id", schoolId)
        .in("name", ["Carnaval", "Sexta-feira Santa", "Corpus Christi"])
        .gte("date", `${testYear}-01-01`)
        .lt("date", `${testYear + 1}-01-01`);

      const byName = new Map((mobileHolidays ?? []).map((h) => [h.name, h.date]));
      expect(byName.get("Carnaval")).toBe(expectedCarnaval);
      expect(byName.get("Sexta-feira Santa")).toBe(expectedSextaSanta);
      expect(byName.get("Corpus Christi")).toBe(expectedCorpusChristi);

      // Idempotência (Fase 16.1): rodar de novo para o mesmo ano não duplica.
      await admin.rpc("seed_national_holidays", { p_school_id: schoolId, p_year: testYear });
      const { data: afterSecondRun } = await admin
        .from("holidays")
        .select("id")
        .eq("school_id", schoolId)
        .gte("date", `${testYear}-01-01`)
        .lt("date", `${testYear + 1}-01-01`);
      expect(afterSecondRun).toHaveLength(12);
    } finally {
      await admin.from("schools").delete().eq("id", schoolId);
    }
  });
});

describe.skipIf(!hasEnv)(
  "bloqueio de sinalização/chamada em dia sem aula (Fase 16.3/16.5)",
  () => {
    let admin: SupabaseClient;
    let asStudent: SupabaseClient;
    let asStaff: SupabaseClient;
    let schoolId: string;

    const BLOCKED_DATE = "2026-08-10"; // controlada, sem feriado real cadastrado.
    const FREE_DATE = "2026-08-11"; // controlada, sem feriado nenhum.

    beforeAll(async () => {
      admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: student } = await admin
        .from("students")
        .select("school_id")
        .eq("email", STUDENT_EMAIL)
        .single();
      schoolId = student!.school_id;

      asStudent = await signIn(STUDENT_EMAIL, "TestSenha123!");
      asStaff = await signIn("admin@nexusdojo.dev", "TestSenha123!");
    });

    afterAll(async () => {
      await admin.from("holidays").delete().eq("school_id", schoolId).in("date", [BLOCKED_DATE, FREE_DATE]);
    });

    it("has_class=false: getHolidayForDate retorna o feriado (bloqueia) tanto pro aluno quanto pro staff", async () => {
      const { error } = await admin.from("holidays").insert({
        school_id: schoolId,
        name: "Feriado Teste 16.5",
        date: BLOCKED_DATE,
        has_class: false,
        custom_message: null,
      });
      expect(error).toBeNull();

      const studentResult = await getHolidayForDate(asStudent, schoolId, BLOCKED_DATE);
      expect(studentResult).not.toBeNull();
      expect(studentResult?.name).toBe("Feriado Teste 16.5");

      const staffResult = await getHolidayForDate(asStaff, schoolId, BLOCKED_DATE);
      expect(staffResult).not.toBeNull();
      expect(staffResult?.name).toBe("Feriado Teste 16.5");

      await admin.from("holidays").delete().eq("school_id", schoolId).eq("date", BLOCKED_DATE);
    });

    it("has_class=true: getHolidayForDate retorna null (libera normalmente), mesmo com feriado cadastrado na data", async () => {
      const { error } = await admin.from("holidays").insert({
        school_id: schoolId,
        name: "Feriado Teste 16.5 (com aula)",
        date: BLOCKED_DATE,
        has_class: true,
        custom_message: null,
      });
      expect(error).toBeNull();

      const studentResult = await getHolidayForDate(asStudent, schoolId, BLOCKED_DATE);
      expect(studentResult).toBeNull();

      const staffResult = await getHolidayForDate(asStaff, schoolId, BLOCKED_DATE);
      expect(staffResult).toBeNull();

      await admin.from("holidays").delete().eq("school_id", schoolId).eq("date", BLOCKED_DATE);
    });

    it("sem feriado cadastrado na data: getHolidayForDate retorna null (comportamento normal)", async () => {
      const studentResult = await getHolidayForDate(asStudent, schoolId, FREE_DATE);
      expect(studentResult).toBeNull();

      const staffResult = await getHolidayForDate(asStaff, schoolId, FREE_DATE);
      expect(staffResult).toBeNull();
    });
  },
);
