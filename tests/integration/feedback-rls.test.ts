/**
 * Testes de integração contra o Supabase compartilhado de dev
 * (nexusdojo-dev), cobrindo a RLS de `feedback` (Fase 17.1) com clients
 * autenticados de verdade — mesmo padrão de
 * `graduation-requirements-rules.test.ts`/`ad-hoc-messages.test.ts`.
 *
 * Escopo do critério de pronto (17.7): aluno não vê feedback de outro
 * aluno; professor não vê feedback não direcionado a ele; admin vê tudo.
 * Todas as linhas são inseridas via client de service role (bypassa RLS
 * no insert) para isolar o teste na policy de SELECT, que é o alvo desta
 * subtarefa.
 *
 * Contas de professor não seguem o padrão `TEST_STUDENT_EMAIL` (esse
 * cobre só aluno, ver docs/TEST_ACCOUNTS.md) — usa as mesmas contas fixas
 * já validadas manualmente na Fase 17.3: `camila.duarte@demo.nexusdojo.dev`
 * é, neste ambiente compartilhado, a única professora com `teachers.email`
 * batendo com o login (necessário para `current_teacher_id()` resolver);
 * `bruno.almeida@demo.nexusdojo.dev` não tem essa correspondência, então
 * `current_teacher_id()` retorna null para ela e a policy de professor
 * bloqueia por completo — mesma limitação já registrada na Fase 17.3
 * (achado do ambiente, não do código), reaproveitada aqui como o caso
 * negativo de "professor não vê feedback não direcionado a ele".
 */
import { readFileSync, existsSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

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
// Segundo aluno só para o caso negativo "não vê feedback de outro aluno" —
// conta demo compartilhada (não faz parte do padrão TEST_STUDENT_EMAIL, que
// cobre só o aluno "dono" usado pelas outras suites). Se o dev não tiver
// TEST_STUDENT_EMAIL configurado, STUDENT_EMAIL cai no fallback e coincide
// com esta conta — nesse caso o teste de cross-aluno é pulado (ver skipIf
// abaixo) em vez de comparar a conta com ela mesma.
const OTHER_STUDENT_EMAIL = "aluno@nexusdojo.dev";
const HAS_OTHER_STUDENT = STUDENT_EMAIL !== OTHER_STUDENT_EMAIL;
const TEACHER_EMAIL = "camila.duarte@demo.nexusdojo.dev";
const OTHER_TEACHER_EMAIL = "bruno.almeida@demo.nexusdojo.dev";
const PASSWORD = "TestSenha123!";

const PREFIX = "Teste RLS Fase 17.7";

describe.skipIf(!hasEnv)("Fale Conosco — RLS de feedback (integração, Fase 17.7)", () => {
  let admin: SupabaseClient;
  let asStudent: SupabaseClient;
  let asOtherStudent: SupabaseClient | null;
  let asAdmin: SupabaseClient;
  let asTeacher: SupabaseClient;
  let asOtherTeacher: SupabaseClient;
  let schoolId: string;
  let studentId: string;
  let teacherId: string;

  async function signIn(email: string, password: string) {
    const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data } = await anon.auth.signInWithPassword({ email, password });
    return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${data!.session!.access_token}` } },
    });
  }

  async function cleanup() {
    await admin.from("feedback").delete().eq("school_id", schoolId).like("title", `${PREFIX}%`);
  }

  beforeAll(async () => {
    admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: student } = await admin
      .from("students")
      .select("id, school_id")
      .eq("email", STUDENT_EMAIL)
      .single();
    schoolId = student!.school_id;
    studentId = student!.id;

    const { data: teacher } = await admin
      .from("teachers")
      .select("id")
      .eq("email", TEACHER_EMAIL)
      .eq("school_id", schoolId)
      .single();
    teacherId = teacher!.id;

    asStudent = await signIn(STUDENT_EMAIL, PASSWORD);
    asOtherStudent = HAS_OTHER_STUDENT ? await signIn(OTHER_STUDENT_EMAIL, PASSWORD) : null;
    asAdmin = await signIn("admin@nexusdojo.dev", PASSWORD);
    asTeacher = await signIn(TEACHER_EMAIL, PASSWORD);
    asOtherTeacher = await signIn(OTHER_TEACHER_EMAIL, PASSWORD);

    await cleanup();
  });

  afterEach(cleanup);
  afterAll(cleanup);

  it.skipIf(!HAS_OTHER_STUDENT)("aluno não vê feedback de outro aluno", async () => {
    const title = `${PREFIX} - aluno`;
    const { error: insertError } = await admin.from("feedback").insert({
      school_id: schoolId,
      student_id: studentId,
      type: "duvida",
      title,
      target: "administrador",
      status: "recebida",
    });
    expect(insertError).toBeNull();

    const { data: ownRead } = await asStudent.from("feedback").select("id").eq("title", title);
    expect(ownRead).toHaveLength(1);

    const { data: otherRead } = await asOtherStudent!.from("feedback").select("id").eq("title", title);
    expect(otherRead).toHaveLength(0);
  });

  it("professor não vê feedback não direcionado a ele", async () => {
    const title = `${PREFIX} - professor`;
    const { error: insertError } = await admin.from("feedback").insert({
      school_id: schoolId,
      student_id: studentId,
      type: "duvida",
      title,
      target: "professor",
      teacher_id: teacherId,
      status: "recebida",
    });
    expect(insertError).toBeNull();

    const { data: targetedRead } = await asTeacher.from("feedback").select("id").eq("title", title);
    expect(targetedRead).toHaveLength(1);

    const { data: otherTeacherRead } = await asOtherTeacher.from("feedback").select("id").eq("title", title);
    expect(otherTeacherRead).toHaveLength(0);
  });

  it("admin vê todo feedback da escola, independente do destino", async () => {
    const adminTargetTitle = `${PREFIX} - admin-destino-admin`;
    const teacherTargetTitle = `${PREFIX} - admin-destino-professor`;

    const { error: insertError } = await admin.from("feedback").insert([
      {
        school_id: schoolId,
        student_id: studentId,
        type: "sugestao",
        title: adminTargetTitle,
        target: "administrador",
        status: "recebida",
      },
      {
        school_id: schoolId,
        student_id: studentId,
        type: "elogio",
        title: teacherTargetTitle,
        target: "professor",
        teacher_id: teacherId,
        status: "recebida",
      },
    ]);
    expect(insertError).toBeNull();

    const { data: adminRead } = await asAdmin
      .from("feedback")
      .select("id, title")
      .in("title", [adminTargetTitle, teacherTargetTitle]);
    expect(adminRead).toHaveLength(2);
  });
});
