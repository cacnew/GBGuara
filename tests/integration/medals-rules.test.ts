/**
 * Testes de integração contra o Supabase compartilhado de dev
 * (nexusdojo-dev), cobrindo as regras de RLS do sistema de medalhas
 * (Fase 12) que vivem na camada de banco, não em lógica TS pura (essa
 * parte está em points.test.ts/ranking.test.ts). Mesmo padrão de
 * `tests/integration/attendance-rules.test.ts` (Fase 9.11): client
 * service_role para setup/teardown, clients autenticados como o aluno e
 * como o admin demo para validar RLS de verdade (não bypassada). Requer
 * `.env.local` (pulado automaticamente sem ele).
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

describe.skipIf(!hasEnv)("regras de negócio do sistema de medalhas (integração)", () => {
  let admin: SupabaseClient;
  let asStudent: SupabaseClient;
  let asStaff: SupabaseClient;
  let studentId: string;
  let otherStudentId: string;
  let schoolId: string;
  let staffUserId: string;
  let eventId: string;
  const createdMedalIds: string[] = [];

  async function signIn(email: string, password: string) {
    const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data } = await anon.auth.signInWithPassword({ email, password });
    return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${data!.session!.access_token}` } },
    });
  }

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
      .eq("school_id", schoolId)
      .eq("status", "ativo")
      .neq("id", studentId)
      .limit(1)
      .single();
    otherStudentId = other!.id;

    const { data: staffUser } = await admin
      .from("users")
      .select("id")
      .eq("school_id", schoolId)
      .eq("role", "admin")
      .limit(1)
      .single();
    staffUserId = staffUser!.id;

    const { data: event } = await admin
      .from("medal_events")
      .insert({
        school_id: schoolId,
        name: "Evento de teste (integração 12.9)",
        event_date: "2026-06-01",
        created_by_user_id: staffUserId,
      })
      .select("id")
      .single();
    eventId = event!.id;

    asStudent = await signIn("aluno@nexusdojo.dev", "TestSenha123!");
    asStaff = await signIn("admin@nexusdojo.dev", "TestSenha123!");
  });

  afterAll(async () => {
    if (createdMedalIds.length) {
      await admin.from("medals").delete().in("id", createdMedalIds);
    }
    await admin.from("medal_event_point_rules").delete().eq("event_id", eventId);
    await admin.from("medal_events").delete().eq("id", eventId);
  });

  it("aluno lança medalha para si mesmo sempre como pending", async () => {
    const { data, error } = await asStudent
      .from("medals")
      .insert({
        school_id: schoolId,
        student_id: studentId,
        event_id: eventId,
        level: "ouro",
        status: "pending",
        submitted_by_student_id: studentId,
      })
      .select("id, status")
      .single();

    expect(error).toBeNull();
    expect(data?.status).toBe("pending");
    createdMedalIds.push(data!.id);
  });

  it("aluno não pode lançar medalha em nome de outro aluno (RLS bloqueia)", async () => {
    const { error } = await asStudent.from("medals").insert({
      school_id: schoolId,
      student_id: otherStudentId,
      event_id: eventId,
      level: "ouro",
      status: "pending",
      submitted_by_student_id: studentId,
    });

    expect(error).not.toBeNull();
  });

  it("aluno não pode se autoaprovar (status approved no insert é bloqueado)", async () => {
    const { error } = await asStudent.from("medals").insert({
      school_id: schoolId,
      student_id: studentId,
      event_id: eventId,
      level: "ouro",
      status: "approved",
      submitted_by_student_id: studentId,
    });

    expect(error).not.toBeNull();
  });

  it("aluno não vê lançamento pendente/rejeitado de outro aluno, mas vê aprovado de qualquer aluno", async () => {
    const { data: otherPending } = await admin
      .from("medals")
      .insert({
        school_id: schoolId,
        student_id: otherStudentId,
        event_id: eventId,
        level: "prata",
        status: "pending",
        submitted_by_student_id: otherStudentId,
      })
      .select("id")
      .single();
    createdMedalIds.push(otherPending!.id);

    const { data: otherApproved } = await admin
      .from("medals")
      .insert({
        school_id: schoolId,
        student_id: otherStudentId,
        event_id: eventId,
        level: "bronze",
        status: "approved",
        submitted_by_student_id: otherStudentId,
        reviewed_by_user_id: staffUserId,
        reviewed_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    createdMedalIds.push(otherApproved!.id);

    const { data: visible } = await asStudent
      .from("medals")
      .select("id")
      .in("id", [otherPending!.id, otherApproved!.id]);

    const visibleIds = (visible ?? []).map((row) => row.id);
    expect(visibleIds).not.toContain(otherPending!.id);
    expect(visibleIds).toContain(otherApproved!.id);
  });

  it("staff (sessão real, não service role) aprova e rejeita lançamentos pendentes", async () => {
    const { data: pendingRows } = await asStudent
      .from("medals")
      .select("id")
      .eq("student_id", studentId)
      .eq("status", "pending")
      .limit(1);
    const pendingId = pendingRows![0].id;

    const { data: approved, error: approveError } = await asStaff
      .from("medals")
      .update({
        status: "approved",
        reviewed_by_user_id: staffUserId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", pendingId)
      .select("id, status")
      .single();

    expect(approveError).toBeNull();
    expect(approved?.status).toBe("approved");

    const { data: rejectable } = await admin
      .from("medals")
      .insert({
        school_id: schoolId,
        student_id: studentId,
        event_id: eventId,
        level: "bronze",
        status: "pending",
        submitted_by_student_id: studentId,
      })
      .select("id")
      .single();
    createdMedalIds.push(rejectable!.id);

    const { data: rejected, error: rejectError } = await asStaff
      .from("medals")
      .update({
        status: "rejected",
        reviewed_by_user_id: staffUserId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: "Comprovante ilegível (teste de integração)",
      })
      .eq("id", rejectable!.id)
      .select("id, status, rejection_reason")
      .single();

    expect(rejectError).toBeNull();
    expect(rejected?.status).toBe("rejected");
    expect(rejected?.rejection_reason).not.toBeNull();
  });

  it("edição do aluno num lançamento rejeitado volta o status a pending e limpa a revisão anterior", async () => {
    const { data: rejectedRow } = await asStudent
      .from("medals")
      .select("id")
      .eq("student_id", studentId)
      .eq("status", "rejected")
      .limit(1)
      .single();

    const { data: reedited, error } = await asStudent
      .from("medals")
      .update({
        category: "Categoria reenviada (teste)",
        status: "pending",
        rejection_reason: null,
        reviewed_by_user_id: null,
        reviewed_at: null,
      })
      .eq("id", rejectedRow!.id)
      .select("id, status, reviewed_by_user_id, reviewed_at")
      .single();

    expect(error).toBeNull();
    expect(reedited?.status).toBe("pending");
    expect(reedited?.reviewed_by_user_id).toBeNull();
    expect(reedited?.reviewed_at).toBeNull();
  });

  it("aluno não pode editar uma medalha já aprovada (RLS bloqueia, 0 linhas afetadas)", async () => {
    const { data: approvedRow } = await asStudent
      .from("medals")
      .select("id")
      .eq("student_id", studentId)
      .eq("status", "approved")
      .limit(1)
      .single();

    const { data: blocked } = await asStudent
      .from("medals")
      .update({ category: "Tentativa de edição pós-aprovação" })
      .eq("id", approvedRow!.id)
      .select("id")
      .maybeSingle();

    expect(blocked).toBeNull();
  });

  it("aluno não pode criar evento no catálogo (só staff)", async () => {
    const { error } = await asStudent.from("medal_events").insert({
      school_id: schoolId,
      name: "Evento criado por aluno (deve falhar)",
      event_date: "2026-06-01",
    });

    expect(error).not.toBeNull();
  });

  it("staff pode criar evento e configurar pontuação específica (override)", async () => {
    const { data: newEvent, error: eventError } = await asStaff
      .from("medal_events")
      .insert({
        school_id: schoolId,
        name: "Evento com override (teste de integração)",
        event_date: "2026-06-02",
        created_by_user_id: staffUserId,
      })
      .select("id")
      .single();

    expect(eventError).toBeNull();

    const { error: overrideError } = await asStaff
      .from("medal_event_point_rules")
      .insert({ event_id: newEvent!.id, level: "ouro", points: 10 });

    expect(overrideError).toBeNull();

    await admin.from("medal_event_point_rules").delete().eq("event_id", newEvent!.id);
    await admin.from("medal_events").delete().eq("id", newEvent!.id);
  });
});
