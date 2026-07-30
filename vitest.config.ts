import path from "node:path";
import { defineConfig } from "vitest/config";

// `e2e/**` é exclusivamente do Playwright (`npm run test:e2e`, ver
// `playwright.config.ts`) — sem esta exclusão, o include default do
// vitest (`**/*.{test,spec}.ts`) também tenta rodar os `*.spec.ts` de lá
// e falha, porque `test()` do Playwright não pode ser chamado fora do
// runner dele.
export default defineConfig({
  test: {
    exclude: ["**/node_modules/**", "e2e/**"],
    // Default de 5s estourava sob carga (várias suítes de integração
    // batendo no Supabase real em paralelo, Fase 17.1) — nenhum teste
    // individual é lento, é contenção de rede quando os ~14 arquivos
    // rodam juntos.
    testTimeout: 20000,
  },
  resolve: {
    // Mesmo mapeamento do `tsconfig.json` (`@/*` -> raiz do projeto).
    // Necessário desde a Fase 15.4, quando um teste de integração passou a
    // importar `modules/birthday-messages/job.ts` diretamente — esse
    // arquivo usa imports `@/...` (ex: `@/lib/supabase/admin`) que o
    // Next.js resolve nativamente, mas o Vitest não sem este alias.
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
