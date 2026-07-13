/**
 * Testes de integração contra o Supabase compartilhado de dev
 * (nexusdojo-dev), cobrindo as regras da seção 3 de modules/modulo_aluno.md
 * que vivem na camada de RLS/banco (não em lógica TS pura — essas estão em
 * eligibility.test.ts e signal-rules.test.ts).
 *
 * `signalAttendance`/`cancelSignal`/`closeRollCall` são Server Actions que
 * dependem de `next/headers` (contexto de requisição do Next.js) e não são
 * chamáveis diretamente aqui — esses testes replicam exatamente as mesmas
 * operações de banco que essas funções fazem, usando clients Supabase
 * crus (service_role para setup, client autenticado como o aluno real para
 * validar RLS), da mesma forma que a verificação manual feita durante as
 * Fases 9.4/9.5/9.7. Requer `.env.local` (pulado automaticamente sem ele).
 */
import { readFileSync, existsSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

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

describe.skipIf(!hasEnv)("regras de negócio do módulo do aluno (integração)", () => {
  let admin: SupabaseClient;
  let asStudent: SupabaseClient;
  let studentId: string;
  let otherStudentId: string;
  let schoolId: string;
  let classGroupId: string;
  let sessionId: string;
  const testDate = "2026-08-03"; // segunda-feira futura, controlada.

  beforeAll(async () => {
    admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: student } = await admin
      .from("students")
      .select("id, school_id")
      .eq("email", "aluno@nexusdojo.dev")
      .single();
    studentId = student!.id;
    schoolId = student!.school_id;

    const { data: other } = await admin
      .from("students")
      .select("id")
      .eq("status", "ativo")
      .neq("id", studentId)
      .limit(1)
      .single();
    otherStudentId = other!.id;

    const { data: classGroup } = await admin
      .from("class_groups")
      .select("id")
      .eq("school_id", schoolId)
      .eq("status", "active")
      .limit(1)
      .single();
    classGroupId = classGroup!.id;

    const { data: session } = await admin
      .from("class_sessions")
      .insert({ school_id: schoolId, class_group_id: classGroupId, date: testDate })
      .select("id")
      .single();
    sessionId = session!.id;

    const { data: signIn } = await createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ).auth.signInWithPassword({ email: "aluno@nexusdojo.dev", password: "TestSenha123!" });

    asStudent = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${signIn!.session!.access_token}` } },
    });
  });

  afterAll(async () => {
    await admin.from("notifications").delete().eq("class_session_id", sessionId);
    await admin.from("attendances").delete().eq("class_session_id", sessionId);
    await admin.from("class_sessions").delete().eq("id", sessionId);
  });

  it("dupla sinalização: unique(class_session_id, student_id) bloqueia inserir a mesma presença duas vezes", async () => {
    const { error: first } = await asStudent.from("attendances").insert({
      school_id: schoolId,
      class_session_id: sessionId,
      student_id: studentId,
      status: "signaled",
      signaled_at: new Date().toISOString(),
    });
    expect(first).toBeNull();

    const { error: second } = await asStudent.from("attendances").insert({
      school_id: schoolId,
      class_session_id: sessionId,
      student_id: studentId,
      status: "signaled",
      signaled_at: new Date().toISOString(),
    });
    expect(second).not.toBeNull();
    expect(second?.code).toBe("23505");

    // limpa para os próximos testes deste arquivo.
    await admin.from("attendances").delete().eq("class_session_id", sessionId).eq("student_id", studentId);
  });

  it("aluno só pode se inserir como 'signaled' de si mesmo (RLS)", async () => {
    const { error: asConfirmed } = await asStudent.from("attendances").insert({
      school_id: schoolId,
      class_session_id: sessionId,
      student_id: studentId,
      status: "confirmed",
    });
    expect(asConfirmed).not.toBeNull();

    const { error: forOther } = await asStudent.from("attendances").insert({
      school_id: schoolId,
      class_session_id: sessionId,
      student_id: otherStudentId,
      status: "signaled",
    });
    expect(forOther).not.toBeNull();
  });

  it("cancelamento é soft (signaled -> cancelled) e reativável, mas não escala para confirmed", async () => {
    const { data: signaled, error: insertErr } = await asStudent
      .from("attendances")
      .insert({
        school_id: schoolId,
        class_session_id: sessionId,
        student_id: studentId,
        status: "signaled",
        signaled_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    expect(insertErr).toBeNull();

    const { data: cancelled, error: cancelErr } = await asStudent
      .from("attendances")
      .update({ status: "cancelled" })
      .eq("id", signaled!.id)
      .select("id, status")
      .single();
    expect(cancelErr).toBeNull();
    expect(cancelled?.status).toBe("cancelled");

    const { data: reactivated, error: reactivateErr } = await asStudent
      .from("attendances")
      .update({ status: "signaled", signaled_at: new Date().toISOString() })
      .eq("id", signaled!.id)
      .select("id, status")
      .single();
    expect(reactivateErr).toBeNull();
    expect(reactivated?.status).toBe("signaled");

    // Confirma de novo -> cancela -> tenta escalar direto pra confirmed: RLS bloqueia (0 linhas afetadas).
    await admin.from("attendances").update({ status: "cancelled" }).eq("id", signaled!.id);
    const { data: escalated } = await asStudent
      .from("attendances")
      .update({ status: "confirmed" })
      .eq("id", signaled!.id)
      .select("id")
      .maybeSingle();
    expect(escalated).toBeNull();

    await admin.from("attendances").delete().eq("id", signaled!.id);
  });

  it("inclusão manual pelo professor cria attendance added_by_instructor + confirmada", async () => {
    const { data: staffUser } = await admin
      .from("users")
      .select("id")
      .eq("school_id", schoolId)
      .eq("role", "admin")
      .limit(1)
      .single();

    const { data: manual, error } = await admin
      .from("attendances")
      .insert({
        school_id: schoolId,
        class_session_id: sessionId,
        student_id: otherStudentId,
        status: "added_by_instructor",
        confirmed_at: new Date().toISOString(),
        confirmed_by: staffUser!.id,
        registered_by_user_id: staffUser!.id,
      })
      .select("id, status, confirmed_at")
      .single();

    expect(error).toBeNull();
    expect(manual?.status).toBe("added_by_instructor");
    expect(manual?.confirmed_at).not.toBeNull();

    await admin.from("attendances").delete().eq("id", manual!.id);
  });

  it("fechar a chamada consolida sinalizado-sem-confirmação em no_show", async () => {
    const { data: signaled } = await admin
      .from("attendances")
      .insert({
        school_id: schoolId,
        class_session_id: sessionId,
        student_id: studentId,
        status: "signaled",
        signaled_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    // Réplica do que closeRollCall faz: consolida signaled -> no_show.
    const { data: pending } = await admin
      .from("attendances")
      .select("id")
      .eq("class_session_id", sessionId)
      .eq("status", "signaled");

    await admin
      .from("attendances")
      .update({ status: "no_show" })
      .in(
        "id",
        (pending ?? []).map((a) => a.id),
      );

    const { data: after } = await admin
      .from("attendances")
      .select("status")
      .eq("id", signaled!.id)
      .single();

    expect(after?.status).toBe("no_show");

    await admin.from("attendances").delete().eq("id", signaled!.id);
  });
});
