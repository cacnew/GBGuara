# DECISIONS.md — NexusDojo

Registro de decisões técnicas tomadas durante o projeto. Cada entrada
explica o "porquê", não o "o quê" (isso já está no código/commits).

---

## Stack de UI (Fase 0.1 / 0.2)

- **shadcn/ui**: componentes copiados para o repo (não é dependência de
  runtime fechada), o que facilita customizar visual (paleta Tatame Red) sem
  brigar com um design system externo. Instalado via `shadcn init -d`
  (defaults do próprio CLI, compatível com Tailwind v4 detectado no projeto).
- **lucide-react**: instalado automaticamente como dependência do
  `shadcn/ui` — ícones usados nos componentes gerados e no restante do app.
- **sonner**: biblioteca de toast/notificação leve, recomendada no
  documento mestre (seção 5) e comumente usada junto com shadcn/ui.
- **recharts**: biblioteca de gráficos para os dashboards (Fase 7) —
  recomendada no documento mestre, boa integração com React/Tailwind.

## Libs de dados/formulário (Fase 0.3)

- **react-hook-form + zod**: conforme documento mestre. Formulários
  controlados com validação declarativa.
- **@hookform/resolvers**: não estava listado explicitamente no documento
  mestre, mas é a ponte oficial entre `react-hook-form` e `zod`
  (`zodResolver`) — sem ele não dá para usar as duas libs juntas.
- **@tanstack/react-query**: `QueryProvider` (`lib/providers/query-provider.tsx`)
  já plugado no `app/layout.tsx` para os módulos que precisarem de
  client-side data fetching/cache mais adiante.
- **date-fns**: manipulação de datas (vencimentos, presenças, graduações).

## Estrutura de pastas (Fase 0.4)

- Estrutura criada conforme seção 7 do `NEXUSDOJO_PROJECT.md`, com uma
  exceção: `lib/utils.ts` (arquivo, criado pelo `shadcn/ui` com o helper
  `cn()`) foi mantido como arquivo em vez de virar pasta `lib/utils/`,
  porque o `components.json` do shadcn já aponta o alias `@/lib/utils`
  para esse arquivo. Criar uma pasta com o mesmo nome quebraria essa
  convenção sem necessidade real no momento.
- Pastas de módulos futuros (`lib/permissions`, `lib/dates`, `lib/money`,
  `modules/*`, `app/(auth|admin|teacher|public)`, `app/api`) criadas vazias
  com `.gitkeep`, para serem preenchidas nas fases correspondentes do
  `TASK.md`.

## Supabase CLI (Fase 0.6)

- Instalado como devDependency local (`npm install --save-dev supabase`),
  não globalmente — é a forma oficialmente suportada pela Supabase para
  Windows/npm. Uso via `npx supabase <comando>`.
- `supabase init` + `supabase start` validados localmente via Docker
  (Studio em `http://127.0.0.1:54323`); serviços parados após o teste
  (`supabase stop`) para não deixar containers rodando sem necessidade.
- `project_id` em `supabase/config.toml` ajustado de `Gracie_Barra`
  (default a partir do nome da pasta) para `nexusdojo`.

## Schema de banco (Fase 1+)

- **SQL puro via Supabase CLI** (`supabase/migrations`), sem ORM (Drizzle
  descartado). Motivo: alinhamento mais direto com RLS nativo do Supabase e
  com a estrutura de pastas já sugerida no documento mestre do projeto.

## Paleta visual (Fase 0.7)

- **Opção 1 — Tatame Red**: preto profundo (`#0B0B0F`), grafite
  (`#18181B`), cinza (`#27272A`), branco suave (`#F4F4F5`), vermelho tatame
  (`#C8102E`). Escolhida por ser a estética mais alinhada à identidade de
  "escola de luta" descrita no documento mestre (seção 15).
