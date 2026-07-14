import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const ADMIN_EMAIL = "admin@nexusdojo.dev";
const ADMIN_PASSWORD = "TestSenha123!";
const STUDENT_EMAIL = "aluno@nexusdojo.dev";
const ORIGINAL_PASSWORD = "TestSenha123!";

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

test("admin reseta senha do aluno; aluno é forçado a trocar no próximo login", async ({ page }) => {
  const env = loadEnv();
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: student } = await admin
    .from("students")
    .select("id")
    .eq("email", STUDENT_EMAIL)
    .single();
  const studentId = student!.id;

  // login admin
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.fill("#email", ADMIN_EMAIL);
  await page.fill("#password", ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 60000 });

  await page.goto(`/students/${studentId}/edit`);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Resetar senha" }).click();

  await expect(page.getByText("Resetar senha do aluno?")).toBeVisible();
  await page.getByRole("button", { name: "Resetar senha", exact: true }).last().click();

  await expect(page.getByText("Senha redefinida")).toBeVisible({ timeout: 30000 });
  const tempPassword = await page.locator("code").innerText();
  expect(tempPassword.length).toBeGreaterThanOrEqual(12);

  await page.getByRole("button", { name: "Concluído" }).click();

  const { data: afterReset } = await admin
    .from("students")
    .select("must_change_password")
    .eq("id", studentId)
    .single();
  expect(afterReset?.must_change_password).toBe(true);

  // aluno tenta logar com a senha antiga -> deve falhar
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.fill("#email", STUDENT_EMAIL);
  await page.fill("#password", ORIGINAL_PASSWORD);
  await page.click('button[type="submit"]');
  await expect(page.getByText(/inválid|incorret|Invalid/i)).toBeVisible({ timeout: 30000 });

  // aluno loga com a senha temporária -> deve ser forçado para /aluno/nova-senha
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.fill("#email", STUDENT_EMAIL);
  await page.fill("#password", tempPassword);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/aluno\/nova-senha/, { timeout: 60000 });
  await expect(page.getByRole("heading", { name: "Defina uma nova senha" })).toBeVisible();

  // tenta acessar outra rota do aluno -> deve continuar preso na tela obrigatória
  await page.goto("/aluno");
  await expect(page).toHaveURL(/\/aluno\/nova-senha/, { timeout: 30000 });

  // define nova senha (restaura a senha padrão da conta demo)
  await page.fill("#password", ORIGINAL_PASSWORD);
  await page.fill("#confirmPassword", ORIGINAL_PASSWORD);
  await page.getByRole("button", { name: "Definir nova senha" }).click();
  await expect(page).toHaveURL(/\/aluno$/, { timeout: 30000 });

  const { data: afterChange } = await admin
    .from("students")
    .select("must_change_password")
    .eq("id", studentId)
    .single();
  expect(afterChange?.must_change_password).toBe(false);

  const { data: auditRows } = await admin
    .from("audit_logs")
    .select("action")
    .eq("entity_id", studentId)
    .eq("action", "student_password_reset");
  expect(auditRows?.length).toBeGreaterThan(0);
});
