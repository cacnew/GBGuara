import { defineConfig } from "vitest/config";

// `e2e/**` é exclusivamente do Playwright (`npm run test:e2e`, ver
// `playwright.config.ts`) — sem esta exclusão, o include default do
// vitest (`**/*.{test,spec}.ts`) também tenta rodar os `*.spec.ts` de lá
// e falha, porque `test()` do Playwright não pode ser chamado fora do
// runner dele.
export default defineConfig({
  test: {
    exclude: ["**/node_modules/**", "e2e/**"],
  },
});
