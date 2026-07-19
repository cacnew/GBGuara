import { test, expect } from "@playwright/test";

const STUDENT_EMAIL = "aluno@nexusdojo.dev";
const STUDENT_PASSWORD = "TestSenha123!";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// A agenda so lista turmas do dia da semana selecionado (week_days da
// class_group); nenhuma turma do ambiente compartilhado roda aos domingos,
// entao depender da data corrente (sem ?date=) faz o teste falhar sempre
// que rodar num domingo. Ancora numa segunda-feira (hoje mesmo, se ja for
// segunda; senao a proxima), sempre dentro da janela de 7 dias de
// antecedencia permitida por checkSignalWindow (signal-rules.ts).
function nearestMondayISODate(): string {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const daysUntilMonday = (1 - today.getUTCDay() + 7) % 7;
  today.setUTCDate(today.getUTCDate() + daysUntilMonday);
  return today.toISOString().slice(0, 10);
}

test("aluno sinaliza e cancela presença em uma aula da agenda", async ({ page }) => {
  // waitUntil: "domcontentloaded" em vez do default "load" — no Firefox,
  // navegar pra uma rota do app (servidor dev do Next.js) enquanto já existe
  // sessão ativa nunca dispara "load", travando o goto até o navigationTimeout;
  // os expects a seguir já validam o conteúdo real carregado.
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await page.fill("#email", STUDENT_EMAIL);
  await page.fill("#password", STUDENT_PASSWORD);
  await page.click('button[type="submit"]');
  // evita depender do evento "load" do waitForURL, que pode nao disparar de
  // novo em navegacoes client-side apos o redirect da server action de login
  await expect(page.getByRole("heading", { name: "Agenda" })).toBeVisible({ timeout: 60000 });

  await page.goto(`/aluno?date=${nearestMondayISODate()}`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "Agenda" })).toBeVisible({ timeout: 30000 });

  const initialSignalButton = page.getByRole("button", { name: "Sinalizar presença" }).first();
  await expect(initialSignalButton).toBeVisible();
  const initialCard = initialSignalButton.locator("xpath=..");
  const className = (await initialCard.locator("p.font-heading").innerText()).trim();

  // ancora o card pelo nome da turma (texto estável), não pelo texto do botão,
  // que muda para "Cancelar sinalização" depois do clique. O <p> do nome fica
  // aninhado dentro de divs internas do card, então sobe até o ancestral que
  // tem a classe do card (mesmo nível em que o botão é filho direto).
  const heading = page.locator("p.font-heading", { hasText: new RegExp(`^${escapeRegExp(className)}$`) });
  const card = heading.locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");

  await card.getByRole("button", { name: "Sinalizar presença" }).click();
  await expect(page.getByText("Presença sinalizada!")).toBeVisible();
  await expect(card.getByRole("button", { name: "Cancelar sinalização" })).toBeVisible();

  // cleanup: desfaz a sinalização para não deixar dado residual no ambiente compartilhado
  await card.getByRole("button", { name: "Cancelar sinalização" }).click();
  await expect(page.getByText("Sinalização cancelada.")).toBeVisible();
  await expect(card.getByRole("button", { name: "Sinalizar presença" })).toBeVisible();

  console.log(`Sinalização testada na turma: ${className}`);
});
