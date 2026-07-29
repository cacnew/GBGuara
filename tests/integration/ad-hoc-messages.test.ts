/**
 * Testes de integração contra o Supabase compartilhado de dev
 * (nexusdojo-dev), cobrindo Mensagens Avulsas (Fase 18): RLS de
 * `ad_hoc_messages` com clients autenticados de verdade (mesmo padrão de
 * `graduation-requirements-rules.test.ts`), e a lógica de envio/validação
 * de `modules/ad-hoc-messages/send.ts` chamada diretamente (função comum,
 * sem `next/headers` — mesmo motivo de `modules/birthday-messages/job.ts`).
 *
 * `sendWhatsAppMessage`/`sendEmail` são mockados aqui — diferente do job de
 * aniversário, que consegue forçar um outcome "failed" determinístico só
 * com dado de entrada (aluno sem telefone). Aqui a validação já exige
 * telefone/e-mail antes de sequer tentar enviar, então não dá pra testar o
 * caminho de sucesso/falha sem depender de EVOLUTION_API_URL/RESEND_API_KEY
 * estarem (ou não) configuradas no `.env.local` de quem roda o teste —
 * mockar os dois clientes evita tanto uma falsa falha (config ausente numa
 * máquina) quanto, pior, uma tentativa de envio real numa máquina que tenha
 * essas chaves configuradas de verdade.
 */
import { readFileSync, existsSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/evolution/client", () => ({
  sendWhatsAppMessage: vi.fn(),
}));
vi.mock("@/lib/email/client", () => ({
  sendEmail: vi.fn(),
}));

import { sendWhatsAppMessage } from "@/lib/evolution/client";
import { sendEmail } from "@/lib/email/client";
import { sendAdHocMessage } from "@/modules/ad-hoc-messages/send";

const mockedSendWhatsApp = vi.mocked(sendWhatsAppMessage);
const mockedSendEmail = vi.mocked(sendEmail);

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
// Conta dedicada por dev (ver docs/TEST_ACCOUNTS.md) — evita conflito com
// outras suites rodando em paralelo contra a conta demo compartilhada.
const STUDENT_EMAIL = env.TEST_STUDENT_EMAIL || "aluno@nexusdojo.dev";

const MESSAGE_PREFIX = "Teste automatizado Fase 18.3";

describe.skipIf(!hasEnv)("Mensagens Avulsas (integração, Fase 18.3)", () => {
  let admin: SupabaseClient;
  let asStudent: SupabaseClient;
  let asAdmin: SupabaseClient;
  let asTeacher: SupabaseClient;
  let schoolId: string;
  let adminUserId: string;

  async function signIn(email: string, password: string) {
    const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data } = await anon.auth.signInWithPassword({ email, password });
    return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${data!.session!.access_token}` } },
    });
  }

  async function cleanupLogs() {
    await admin.from("ad_hoc_messages").delete().eq("school_id", schoolId).like("message", `${MESSAGE_PREFIX}%`);
  }

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

    const { data: adminUser } = await admin
      .from("users")
      .select("id")
      .eq("email", "admin@nexusdojo.dev")
      .single();
    adminUserId = adminUser!.id;

    asStudent = await signIn(STUDENT_EMAIL, "TestSenha123!");
    asAdmin = await signIn("admin@nexusdojo.dev", "TestSenha123!");
    asTeacher = await signIn("professor@nexusdojo.dev", "TestSenha123!");

    await cleanupLogs();
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await cleanupLogs();
  });

  afterAll(async () => {
    await cleanupLogs();
  });

  it("aluno não pode inserir em ad_hoc_messages (RLS bloqueia)", async () => {
    const { error } = await asStudent.from("ad_hoc_messages").insert({
      school_id: schoolId,
      created_by: adminUserId,
      recipient_type: "manual",
      recipient_name: "Teste RLS",
      channel: "whatsapp",
      message: `${MESSAGE_PREFIX} - aluno bloqueado`,
      status: "failed",
    });

    expect(error).not.toBeNull();
  });

  it("staff (admin/professor) insere e lê via RLS; aluno não enxerga o log de outra pessoa", async () => {
    const { error: insertError } = await asAdmin.from("ad_hoc_messages").insert({
      school_id: schoolId,
      created_by: adminUserId,
      recipient_type: "manual",
      recipient_name: "Teste RLS",
      channel: "whatsapp",
      message: `${MESSAGE_PREFIX} - insercao staff`,
      status: "sent",
    });
    expect(insertError).toBeNull();

    const { data: teacherRead } = await asTeacher
      .from("ad_hoc_messages")
      .select("id")
      .eq("message", `${MESSAGE_PREFIX} - insercao staff`);
    expect(teacherRead).toHaveLength(1);

    const { data: studentRead } = await asStudent
      .from("ad_hoc_messages")
      .select("id")
      .eq("message", `${MESSAGE_PREFIX} - insercao staff`);
    expect(studentRead).toHaveLength(0);
  });

  it("valida campos obrigatórios antes de tentar enviar, sem chamar os canais nem gravar log", async () => {
    const base = {
      recipientType: "manual" as const,
      recipientName: MESSAGE_PREFIX,
      phone: "",
      email: "",
      subject: "",
      message: "",
      sendWhatsapp: false,
      sendEmail: false,
    };
    const ctx = { supabase: admin, schoolId, userId: adminUserId };

    expect((await sendAdHocMessage({ ...base, message: "" }, ctx)).error).toBeTruthy();
    expect(
      (await sendAdHocMessage({ ...base, message: MESSAGE_PREFIX }, ctx)).error,
    ).toBeTruthy();
    expect(
      (
        await sendAdHocMessage(
          { ...base, message: MESSAGE_PREFIX, sendWhatsapp: true },
          ctx,
        )
      ).error,
    ).toBeTruthy();
    expect(
      (
        await sendAdHocMessage(
          { ...base, message: MESSAGE_PREFIX, sendEmail: true, email: "x@example.com" },
          ctx,
        )
      ).error,
    ).toBeTruthy();

    expect(mockedSendWhatsApp).not.toHaveBeenCalled();
    expect(mockedSendEmail).not.toHaveBeenCalled();

    const { data: rows } = await admin
      .from("ad_hoc_messages")
      .select("id")
      .eq("school_id", schoolId)
      .like("message", `${MESSAGE_PREFIX}%`);
    expect(rows).toHaveLength(0);
  });

  it("envio com sucesso grava status sent; falha grava status failed com error_message", async () => {
    mockedSendWhatsApp.mockResolvedValueOnce({});
    mockedSendEmail.mockResolvedValueOnce({ error: "Falha simulada de e-mail" });

    const result = await sendAdHocMessage(
      {
        recipientType: "manual",
        recipientName: "Teste envio",
        phone: "11999998888",
        email: "teste@example.com",
        subject: "Assunto teste",
        message: `${MESSAGE_PREFIX} - envio misto`,
        sendWhatsapp: true,
        sendEmail: true,
      },
      { supabase: admin, schoolId, userId: adminUserId },
    );

    expect(result.whatsappError).toBeUndefined();
    expect(result.emailError).toBe("Falha simulada de e-mail");
    expect(mockedSendWhatsApp).toHaveBeenCalledTimes(1);
    expect(mockedSendEmail).toHaveBeenCalledTimes(1);

    const { data: rows } = await admin
      .from("ad_hoc_messages")
      .select("channel, status, error_message")
      .eq("school_id", schoolId)
      .eq("message", `${MESSAGE_PREFIX} - envio misto`)
      .order("channel");

    expect(rows).toHaveLength(2);
    const whatsappRow = rows!.find((r) => r.channel === "whatsapp")!;
    const emailRow = rows!.find((r) => r.channel === "email")!;
    expect(whatsappRow.status).toBe("sent");
    expect(whatsappRow.error_message).toBeNull();
    expect(emailRow.status).toBe("failed");
    expect(emailRow.error_message).toBe("Falha simulada de e-mail");
  });
});
