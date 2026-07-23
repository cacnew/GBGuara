/**
 * Testes de integração contra o Supabase compartilhado de dev
 * (nexusdojo-dev), cobrindo as regras da Fase 14 (Posição da Semana) que
 * vivem na camada de RLS/banco ou dependem de mais de uma chamada
 * sequencial (não em lógica TS pura): "somente uma posição publicada por
 * vez" (`deactivateOtherPublishedPositions`, replicada aqui do mesmo jeito
 * que `closeRollCall` é replicada em `attendance-rules.test.ts`, já que são
 * Server Actions com `requireUser()`/`requireStudent()` não chamáveis fora
 * de uma requisição Next.js) e a regra RLS+vigência de leitura do aluno
 * (`getActiveWeeklyPositionForStudent`, `modules/weekly-positions/positions.ts`,
 * Fase 14.3). Mesmo padrão de `medals-rules.test.ts` (Fase 12.9). Requer
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

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const env = loadEnv();
const hasEnv = Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);

describe.skipIf(!hasEnv)("regras de negócio da Posição da Semana (integração)", () => {
  let admin: SupabaseClient;
  let asStudent: SupabaseClient;
  let schoolId: string;
  let staffUserId: string;
  const today = new Date().toISOString().slice(0, 10);
  const createdIds: string[] = [];
  let originallyPublishedIds: string[] = [];

  async function signIn(email: string, password: string) {
    const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data } = await anon.auth.signInWithPassword({ email, password });
    return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${data!.session!.access_token}` } },
    });
  }

  function basePosition(overrides: Record<string, unknown>) {
    return {
      school_id: schoolId,
      title: "Posição de teste (integração 14.4)",
      description: "Descrição de teste temporária.",
      image_url: "https://placehold.co/600x400/png",
      created_by_user_id: staffUserId,
      ...overrides,
    };
  }

  async function insertPosition(overrides: Record<string, unknown>) {
    const { data, error } = await admin
      .from("weekly_positions")
      .insert(basePosition(overrides))
      .select("id, published")
      .single();
    expect(error).toBeNull();
    createdIds.push(data!.id);
    return data!;
  }

  // Réplica exata de `deactivateOtherPublishedPositions`
  // (`modules/weekly-positions/positions.ts`, Fase 14.2) — não é chamável
  // diretamente aqui por depender de `requireUser()`.
  async function deactivateOtherPublished(keepId?: string) {
    let query = admin
      .from("weekly_positions")
      .update({ published: false })
      .eq("school_id", schoolId)
      .eq("published", true);
    if (keepId) query = query.neq("id", keepId);
    await query;
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
    schoolId = student!.school_id;

    const { data: staffUser } = await admin
      .from("users")
      .select("id")
      .eq("school_id", schoolId)
      .eq("role", "admin")
      .limit(1)
      .single();
    staffUserId = staffUser!.id;

    // Snapshot do que já estava publicado antes dos testes rodarem, para
    // restaurar depois — `deactivateOtherPublished` afeta a escola inteira,
    // não só as linhas criadas por este arquivo.
    const { data: alreadyPublished } = await admin
      .from("weekly_positions")
      .select("id")
      .eq("school_id", schoolId)
      .eq("published", true);
    originallyPublishedIds = (alreadyPublished ?? []).map((p) => p.id);

    asStudent = await signIn("aluno@nexusdojo.dev", "TestSenha123!");
  });

  afterAll(async () => {
    if (createdIds.length) {
      await admin.from("weekly_positions").delete().in("id", createdIds);
    }
    if (originallyPublishedIds.length) {
      await admin
        .from("weekly_positions")
        .update({ published: true })
        .in("id", originallyPublishedIds);
    }
  });

  it("publicar uma posição nova desativa a anteriormente publicada da mesma escola", async () => {
    const positionA = await insertPosition({
      title: "A - vigente hoje",
      start_date: today,
      published: true,
    });
    expect(positionA.published).toBe(true);

    // Mesma sequência de `createWeeklyPosition`: desativa outras publicadas
    // antes de inserir a nova já publicada.
    await deactivateOtherPublished();
    const positionB = await insertPosition({
      title: "B - vigente hoje",
      start_date: today,
      published: true,
    });

    const { data: refreshedA } = await admin
      .from("weekly_positions")
      .select("published")
      .eq("id", positionA.id)
      .single();

    expect(refreshedA?.published).toBe(false);
    expect(positionB.published).toBe(true);
  });

  it("editar uma posição existente para publicada desativa as demais, mantendo a própria (keepId)", async () => {
    const positionC = await insertPosition({
      title: "C - inicialmente rascunho",
      start_date: today,
      published: false,
    });
    const positionD = await insertPosition({
      title: "D - publicada antes da edição",
      start_date: today,
      published: true,
    });

    // Mesma sequência de `updateWeeklyPosition`: desativa outras publicadas
    // (exceto a própria) antes de marcar a própria como publicada.
    await deactivateOtherPublished(positionC.id);
    await admin.from("weekly_positions").update({ published: true }).eq("id", positionC.id);

    const { data: refreshedC } = await admin
      .from("weekly_positions")
      .select("published")
      .eq("id", positionC.id)
      .single();
    const { data: refreshedD } = await admin
      .from("weekly_positions")
      .select("published")
      .eq("id", positionD.id)
      .single();

    expect(refreshedC?.published).toBe(true);
    expect(refreshedD?.published).toBe(false);
  });

  it("aluno não enxerga posição em rascunho (RLS bloqueia, independente de vigência)", async () => {
    const draft = await insertPosition({
      title: "Rascunho nunca publicado",
      start_date: today,
      published: false,
    });

    const { data, error } = await asStudent
      .from("weekly_positions")
      .select("id")
      .eq("id", draft.id)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("aluno só enxerga a posição publicada dentro da vigência (filtro de aplicação)", async () => {
    const vigente = await insertPosition({
      title: "Vigente hoje",
      start_date: addDays(today, -2),
      end_date: addDays(today, 2),
      published: true,
    });
    const futura = await insertPosition({
      title: "Publicada mas ainda não começou",
      start_date: addDays(today, 5),
      end_date: null,
      published: true,
    });
    const expirada = await insertPosition({
      title: "Publicada mas já encerrou",
      start_date: addDays(today, -10),
      end_date: addDays(today, -1),
      published: true,
    });

    // Mesma query de `getActiveWeeklyPositionForStudent`.
    const { data, error } = await asStudent
      .from("weekly_positions")
      .select("id")
      .eq("published", true)
      .lte("start_date", today)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .in("id", [vigente.id, futura.id, expirada.id]);

    expect(error).toBeNull();
    const ids = (data ?? []).map((p) => p.id);
    expect(ids).toEqual([vigente.id]);
  });
});
