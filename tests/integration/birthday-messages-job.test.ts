/**
 * Testes de integração contra o Supabase compartilhado de dev
 * (nexusdojo-dev), cobrindo o job diário de aniversário (Fase 15.3) de
 * ponta a ponta contra o banco real — a lógica pura (template, "quem faz
 * aniversário hoje") já está coberta em `template.test.ts`/
 * `recipients.test.ts`. Chama `runBirthdayMessageJob` diretamente (função
 * comum, sem `next/headers` — ver comentário em `modules/birthday-messages/
 * job.ts`), diferente de outros testes de integração que precisam replicar
 * a lógica de Server Actions não chamáveis fora de uma requisição Next.js.
 * `todayISO` fixo (não a data real do sistema) para o teste não depender
 * nem colidir com aniversariantes reais do seed. Mesmo padrão de
 * `medals-rules.test.ts`: client service_role para setup/teardown, dado de
 * teste criado e removido ao final. Requer `.env.local` (pulado
 * automaticamente sem ele).
 */
import { readFileSync, existsSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runBirthdayMessageJob } from "@/modules/birthday-messages/job";

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

// Data fixa de teste (mês/dia usado como "hoje" na chamada do job) — não é
// a data real do sistema, então não colide com aniversariantes reais.
const TEST_TODAY = "2026-03-15";
const TEST_BIRTH_DATE = "1990-03-15";

describe.skipIf(!hasEnv)("job diário de mensagens de aniversário (integração)", () => {
  let admin: SupabaseClient;
  let schoolId: string;
  let unitId: string;
  let studentId: string;
  let originalSettings: Record<string, unknown> | null = null;

  beforeAll(async () => {
    admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: referenceStudent } = await admin
      .from("students")
      .select("school_id, unit_id")
      .eq("email", "aluno@nexusdojo.dev")
      .single();
    schoolId = referenceStudent!.school_id;
    unitId = referenceStudent!.unit_id;

    const { data: existingSettings } = await admin
      .from("birthday_message_settings")
      .select("*")
      .eq("school_id", schoolId)
      .maybeSingle();
    originalSettings = existingSettings;

    const { data: student, error: studentError } = await admin
      .from("students")
      .insert({
        school_id: schoolId,
        unit_id: unitId,
        name: "Aniversariante Teste (integração 15.4)",
        birth_date: TEST_BIRTH_DATE,
        phone: null, // sem telefone => outcome determinístico ("failed"), independe de EVOLUTION_API_URL/KEY estarem configuradas neste ambiente
        status: "ativo",
      })
      .select("id")
      .single();
    expect(studentError).toBeNull();
    studentId = student!.id;

    await admin.from("birthday_message_settings").upsert(
      {
        school_id: schoolId,
        enabled: true,
        notify_students: true,
        notify_teachers: false,
      },
      { onConflict: "school_id" },
    );
  });

  afterAll(async () => {
    await admin.from("sent_birthday_messages").delete().eq("student_id", studentId);
    await admin.from("students").delete().eq("id", studentId);

    if (originalSettings) {
      await admin
        .from("birthday_message_settings")
        .update({
          enabled: originalSettings.enabled,
          notify_students: originalSettings.notify_students,
          notify_teachers: originalSettings.notify_teachers,
          message_template: originalSettings.message_template,
        })
        .eq("school_id", schoolId);
    } else {
      await admin.from("birthday_message_settings").delete().eq("school_id", schoolId);
    }
  });

  it("envia (ou registra falha) para quem faz aniversário hoje e não duplica ao rodar duas vezes no mesmo dia", async () => {
    await runBirthdayMessageJob(TEST_TODAY, admin);

    const { data: firstRunRows } = await admin
      .from("sent_birthday_messages")
      .select("id, status, date, recipient_type, error_message")
      .eq("student_id", studentId);

    expect(firstRunRows).toHaveLength(1);
    expect(firstRunRows![0].status).toBe("failed");
    expect(firstRunRows![0].date).toBe(TEST_TODAY);
    expect(firstRunRows![0].recipient_type).toBe("aluno");

    await runBirthdayMessageJob(TEST_TODAY, admin);

    const { data: secondRunRows } = await admin
      .from("sent_birthday_messages")
      .select("id")
      .eq("student_id", studentId);

    // Mesma linha, nenhuma duplicata criada na segunda execução do mesmo dia.
    expect(secondRunRows).toHaveLength(1);
    expect(secondRunRows![0].id).toBe(firstRunRows![0].id);
  });

  it("desligar a configuração da escola impede novo envio", async () => {
    await admin.from("sent_birthday_messages").delete().eq("student_id", studentId);
    await admin.from("birthday_message_settings").update({ enabled: false }).eq("school_id", schoolId);

    await runBirthdayMessageJob(TEST_TODAY, admin);

    const { data: rows } = await admin
      .from("sent_birthday_messages")
      .select("id")
      .eq("student_id", studentId);
    expect(rows).toHaveLength(0);

    await admin.from("birthday_message_settings").update({ enabled: true }).eq("school_id", schoolId);
  });
});
