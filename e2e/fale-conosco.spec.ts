import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function loadEnv(): Record<string, string> {
  return Object.fromEntries(
    readFileSync(".env.local", "utf8")
      .split("\n")
      .filter((l) => l.includes("="))
      .map((l) => {
        const idx = l.indexOf("=");
        return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
      }),
  );
}

// Conta dedicada por dev (ver docs/TEST_ACCOUNTS.md) — evita conflito com
// outras suites rodando em paralelo contra a conta demo compartilhada.
const env = loadEnv();
const STUDENT_EMAIL = env.TEST_STUDENT_EMAIL || "aluno@nexusdojo.dev";
const STUDENT_PASSWORD = "TestSenha123!";
const ADMIN_EMAIL = "admin@nexusdojo.dev";
const ADMIN_PASSWORD = "TestSenha123!";

const TITLE = `Teste E2E Fale Conosco ${Date.now()}`;
const MESSAGE = "Mensagem de teste automatizado (Playwright).";
const REPLY = "Resposta de teste automatizado (Playwright).";

test("aluno cria feedback, staff visualiza/exporta/responde, e aluno vê a resposta", async ({ page }) => {
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: student } = await admin
    .from("students")
    .select("name, school_id")
    .eq("email", STUDENT_EMAIL)
    .single();
  const studentName = student!.name;
  const schoolId = student!.school_id;

  try {
    // aluno cria a mensagem (Fase 17.2)
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await page.fill("#email", STUDENT_EMAIL);
    await page.fill("#password", STUDENT_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/aluno/, { timeout: 60000 });

    await page.goto("/aluno/fale-conosco/new", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await page.fill("#title", TITLE);
    await page.fill("#message", MESSAGE);
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByText("Mensagem enviada.")).toBeVisible();
    await expect(page.getByRole("heading", { name: TITLE })).toBeVisible({ timeout: 30000 });

    // staff (admin) vê o item no painel (Fase 17.3), exporta CSV e PDF
    // (Fase 17.6) e responde — resposta move o status para "Respondida"
    // automaticamente (Fase 17.3)
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await page.fill("#email", ADMIN_EMAIL);
    await page.fill("#password", ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 60000 });

    await page.goto("/messages/fale-conosco", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await page.getByPlaceholder("Buscar por aluno...").fill(studentName);

    const row = page.locator("a", { hasText: TITLE });
    await expect(row).toHaveCount(1);

    const [csvDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Exportar CSV" }).click(),
    ]);
    expect(csvDownload.suggestedFilename()).toMatch(/^fale-conosco-\d+\.csv$/);
    const csvPath = await csvDownload.path();
    expect(csvPath).toBeTruthy();
    expect(readFileSync(csvPath!, "utf8")).toContain(TITLE);

    const [pdfDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Exportar PDF" }).click(),
    ]);
    expect(pdfDownload.suggestedFilename()).toMatch(/^fale-conosco-\d+\.pdf$/);
    expect(await pdfDownload.path()).toBeTruthy();

    await row.click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: TITLE })).toBeVisible();
    await page.getByPlaceholder("Escreva uma mensagem...").fill(REPLY);
    await page.getByRole("button", { name: "Responder" }).click();
    // busca em "span" (badge de status), não em qualquer texto da página —
    // a tela também tem um <select> com <option>Respondida</option> (troca
    // manual de status), e um getByText genérico casaria com os dois (mesmo
    // falso negativo já documentado na Fase 17.3)
    await expect(page.locator("span", { hasText: "Respondida" })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(REPLY)).toBeVisible();

    // aluno confirma que recebeu a resposta (Fase 17.4)
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await page.fill("#email", STUDENT_EMAIL);
    await page.fill("#password", STUDENT_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/aluno/, { timeout: 60000 });

    await page.goto("/aluno/fale-conosco", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await page.locator("a", { hasText: TITLE }).click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(REPLY)).toBeVisible({ timeout: 15000 });

    console.log(`Fale Conosco testado: "${TITLE}"`);
  } finally {
    // cleanup: remove o feedback (cascade em feedback_messages) e a
    // notificação de resposta criados pelo teste, para não deixar dado
    // residual no ambiente compartilhado
    await admin.from("feedback").delete().eq("school_id", schoolId).eq("title", TITLE);
    await admin
      .from("notifications")
      .delete()
      .eq("school_id", schoolId)
      .eq("type", "feedback_replied")
      .contains("payload", { feedbackTitle: TITLE });
  }
});
