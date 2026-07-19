import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const STUDENT_EMAIL = "aluno@nexusdojo.dev";
const STUDENT_PASSWORD = "TestSenha123!";
const ADMIN_EMAIL = "admin@nexusdojo.dev";
const ADMIN_PASSWORD = "TestSenha123!";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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

test("aluno lança medalha, staff aprova, e ela passa a constar no dossiê do aluno", async ({
  page,
}) => {
  const env = loadEnv();
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: student } = await admin
    .from("students")
    .select("id, name")
    .eq("email", STUDENT_EMAIL)
    .single();
  const studentId = student!.id;
  const studentName = student!.name;

  let medalId: string | undefined;

  try {
    // aluno loga e lança uma medalha para um evento existente do catálogo
    await page.goto("/login");
    await page.fill("#email", STUDENT_EMAIL);
    await page.fill("#password", STUDENT_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/aluno/, { timeout: 60000 });

    await page.goto("/aluno/medalhas/new");
    await page.waitForLoadState("networkidle");

    const eventSelect = page.locator("#eventId");
    await expect(eventSelect).toBeVisible();
    const firstEventOption = eventSelect.locator("option").nth(1);
    const eventValue = await firstEventOption.getAttribute("value");
    const eventLabel = (await firstEventOption.innerText()).trim();
    expect(eventValue).toBeTruthy();
    await eventSelect.selectOption(eventValue!);
    await page.locator("#level").selectOption("ouro");

    await page.getByRole("button", { name: "Lançar medalha" }).click();
    await expect(page.getByText("Medalha lançada para análise.")).toBeVisible();
    await expect(page).toHaveURL(/\/aluno\/medalhas$/, { timeout: 30000 });

    const { data: created } = await admin
      .from("medals")
      .select("id, status")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    medalId = created!.id;
    expect(created!.status).toBe("pending");

    // staff (admin) loga e aprova o lançamento na fila
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill("#email", ADMIN_EMAIL);
    await page.fill("#password", ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 60000 });

    await page.goto("/medals/approvals");
    await page.waitForLoadState("networkidle");
    await page.getByPlaceholder("Buscar por aluno...").fill(studentName);

    // a busca é por substring e o catálogo de demo tem vários alunos com nomes
    // do tipo "Aluno Dev NN - Fulano", então casar só pelo nome (ex: "Aluno")
    // e pelo evento não é suficiente para achar a linha certa — ancora pelo
    // parágrafo com o nome EXATO do aluno, então restringe pelo evento
    const studentNameParagraph = page.locator("p.font-medium", {
      hasText: new RegExp(`^${escapeRegExp(studentName)}$`),
    });
    const queueRow = studentNameParagraph
      .locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]")
      .filter({ hasText: eventLabel.split(" — ")[0] });
    await expect(queueRow).toHaveCount(1);
    await queueRow.getByRole("button", { name: "Aprovar" }).click();
    await expect(page.getByText("Medalha aprovada.")).toBeVisible();

    const { data: afterApprove } = await admin
      .from("medals")
      .select("status")
      .eq("id", medalId)
      .single();
    expect(afterApprove?.status).toBe("approved");

    // aluno loga de novo e confirma que a medalha aprovada aparece no dossiê
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill("#email", STUDENT_EMAIL);
    await page.fill("#password", STUDENT_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/aluno/, { timeout: 60000 });

    await page.goto("/aluno/dossie");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Medalhas" })).toBeVisible();

    // o aluno demo já pode ter outra medalha aprovada para o mesmo evento
    // (dados de demonstração da 12.10) — filtra também pelo nível exato
    // "Ouro" sem sufixo de modalidade/categoria (que não preenchemos no
    // lançamento) para achar o card certo, não só pelo nome do evento
    // "div.rounded-lg" sozinho também casa com o container da seção inteira
    // (MedalsSection usa a mesma classe no wrapper e em cada card) — restringe
    // a "bg-background", classe só dos cards individuais, não do wrapper
    const medalCard = page
      .locator("div.rounded-lg.bg-background", { hasText: eventLabel.split(" — ")[0] })
      .filter({ has: page.getByText("Ouro", { exact: true }) });
    await expect(medalCard).toHaveCount(1);

    console.log(`Medalha testada: evento "${eventLabel}" para o aluno ${studentName}`);
  } finally {
    // cleanup: remove o lançamento criado pelo teste para não acumular dado
    // residual no ambiente compartilhado a cada execução
    if (medalId) {
      await admin.from("medals").delete().eq("id", medalId);
    }
  }
});
