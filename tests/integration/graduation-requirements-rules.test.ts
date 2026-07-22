/**
 * Testes de integração contra o Supabase compartilhado de dev
 * (nexusdojo-dev), cobrindo a RLS de `belt_graduation_requirements`
 * (Fase 13.1) — mesmo padrão de `tests/integration/medals-rules.test.ts`
 * (Fase 12.9): client service_role para setup/teardown, clients
 * autenticados como aluno/admin/professor para validar RLS de verdade
 * (não bypassada). Requer `.env.local` (pulado automaticamente sem ele).
 *
 * Nota de design (já documentada na Fase 13.1): a policy de escrita libera
 * qualquer staff da escola (`current_school_id()`, sem checar role) — o
 * "admin-only" é reforçado na aplicação (`requireRole("admin")` em
 * `app/(admin)/graduation/settings/actions.ts`), não na RLS. Por isso este
 * teste confirma que professor (staff não-admin) também consegue escrever
 * via RLS direta, em vez de assumir (incorretamente) que a RLS sozinha
 * bloqueia esse caso.
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

describe.skipIf(!hasEnv)("RLS de belt_graduation_requirements (integração, Fase 13.4)", () => {
  let admin: SupabaseClient;
  let asStudent: SupabaseClient;
  let asAdmin: SupabaseClient;
  let asTeacher: SupabaseClient;
  let schoolId: string;
  let beltSystemId: string;
  let fromBeltId: string;
  let toBeltId: string;
  let originalRequiredClasses: number | null = null;
  let rowExistedBefore = false;

  async function signIn(email: string, password: string) {
    const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data } = await anon.auth.signInWithPassword({ email, password });
    return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${data!.session!.access_token}` } },
    });
  }

  async function deleteTestRow() {
    await admin
      .from("belt_graduation_requirements")
      .delete()
      .eq("belt_system_id", beltSystemId)
      .eq("from_belt_id", fromBeltId);
  }

  beforeAll(async () => {
    admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: student } = await admin
      .from("students")
      .select("school_id, current_belt_id, belts(belt_system_id)")
      .eq("email", "aluno@nexusdojo.dev")
      .single();
    // O client de teste não usa os tipos gerados do Database (createClient
    // sem generic), então o TS infere `belts` como array mesmo sendo uma
    // relação to-one; em runtime o Supabase retorna objeto único.
    const studentRow = student as unknown as {
      school_id: string;
      current_belt_id: string;
      belts: { belt_system_id: string };
    };
    schoolId = studentRow.school_id;
    fromBeltId = studentRow.current_belt_id;
    beltSystemId = studentRow.belts.belt_system_id;

    const { data: belts } = await admin
      .from("belts")
      .select("id, ordering")
      .eq("belt_system_id", beltSystemId)
      .order("ordering");
    const currentIdx = (belts ?? []).findIndex((b) => b.id === fromBeltId);
    toBeltId = belts![currentIdx + 1].id;

    const { data: existing } = await admin
      .from("belt_graduation_requirements")
      .select("required_classes")
      .eq("belt_system_id", beltSystemId)
      .eq("from_belt_id", fromBeltId)
      .maybeSingle();
    rowExistedBefore = Boolean(existing);
    originalRequiredClasses = existing?.required_classes ?? null;

    asStudent = await signIn("aluno@nexusdojo.dev", "TestSenha123!");
    asAdmin = await signIn("admin@nexusdojo.dev", "TestSenha123!");
    asTeacher = await signIn("professor@nexusdojo.dev", "TestSenha123!");
  });

  afterAll(async () => {
    if (rowExistedBefore) {
      await admin
        .from("belt_graduation_requirements")
        .update({ required_classes: originalRequiredClasses })
        .eq("belt_system_id", beltSystemId)
        .eq("from_belt_id", fromBeltId);
    } else {
      await deleteTestRow();
    }
  });

  it("aluno não pode inserir (RLS bloqueia com erro)", async () => {
    await deleteTestRow();
    const { error } = await asStudent.from("belt_graduation_requirements").insert({
      school_id: schoolId,
      belt_system_id: beltSystemId,
      from_belt_id: fromBeltId,
      to_belt_id: toBeltId,
      required_classes: 10,
    });

    expect(error).not.toBeNull();
  });

  it("aluno lê a meta configurada por staff, mas não consegue atualizá-la (RLS bloqueia update)", async () => {
    const { error: insertError } = await admin.from("belt_graduation_requirements").insert({
      school_id: schoolId,
      belt_system_id: beltSystemId,
      from_belt_id: fromBeltId,
      to_belt_id: toBeltId,
      required_classes: 30,
    });
    expect(insertError).toBeNull();

    const { data: readBack, error: readError } = await asStudent
      .from("belt_graduation_requirements")
      .select("required_classes")
      .eq("belt_system_id", beltSystemId)
      .eq("from_belt_id", fromBeltId)
      .single();
    expect(readError).toBeNull();
    expect(readBack?.required_classes).toBe(30);

    const { data: blocked } = await asStudent
      .from("belt_graduation_requirements")
      .update({ required_classes: 999 })
      .eq("belt_system_id", beltSystemId)
      .eq("from_belt_id", fromBeltId)
      .select("id")
      .maybeSingle();
    expect(blocked).toBeNull();

    const { data: unchanged } = await admin
      .from("belt_graduation_requirements")
      .select("required_classes")
      .eq("belt_system_id", beltSystemId)
      .eq("from_belt_id", fromBeltId)
      .single();
    expect(unchanged?.required_classes).toBe(30);
  });

  it("admin escreve a meta via RLS normalmente", async () => {
    const { error } = await asAdmin.from("belt_graduation_requirements").upsert(
      {
        school_id: schoolId,
        belt_system_id: beltSystemId,
        from_belt_id: fromBeltId,
        to_belt_id: toBeltId,
        required_classes: 40,
      },
      { onConflict: "belt_system_id,from_belt_id" },
    );
    expect(error).toBeNull();

    const { data } = await admin
      .from("belt_graduation_requirements")
      .select("required_classes")
      .eq("belt_system_id", beltSystemId)
      .eq("from_belt_id", fromBeltId)
      .single();
    expect(data?.required_classes).toBe(40);
  });

  it("professor (staff não-admin) também escreve via RLS — admin-only é regra de aplicação, não de RLS", async () => {
    const { error } = await asTeacher.from("belt_graduation_requirements").upsert(
      {
        school_id: schoolId,
        belt_system_id: beltSystemId,
        from_belt_id: fromBeltId,
        to_belt_id: toBeltId,
        required_classes: 50,
      },
      { onConflict: "belt_system_id,from_belt_id" },
    );
    expect(error).toBeNull();

    const { data } = await admin
      .from("belt_graduation_requirements")
      .select("required_classes")
      .eq("belt_system_id", beltSystemId)
      .eq("from_belt_id", fromBeltId)
      .single();
    expect(data?.required_classes).toBe(50);
  });
});
