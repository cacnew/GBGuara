# Relatorio de erros das implementacoes do Sergio - 2026-07-19

Base testada:
- Branch: `master`
- Commit antes do pull local: `34f111c`
- Commit apos pull: `394071d`
- Intervalo analisado: `34f111c..394071d`
- Modulo novo principal: Fase 12, sistema de medalhas/ranking.

Importante: nenhum ajuste de codigo foi feito nesta analise. Este arquivo e
apenas o registro dos erros encontrados para repasse ao Sergio.

## Validacoes que passaram

Comandos executados apos o pull:

```bash
npm run lint
npx tsc --noEmit
npx vitest run
```

Resultado:
- ESLint: passou.
- TypeScript: passou.
- Vitest: passou, 6 arquivos de teste e 47 testes.

## Erro bloqueante encontrado

### 1. `next build` falha por import server em Client Component

Comando:

```bash
npm run build
```

Resultado:

```text
Build error occurred
Error: Turbopack build failed with 1 errors:
./lib/supabase/server.ts:2:1
You're importing a module that depends on "next/headers". This API is only
available in Server Components in the App Router, but you are using it in the
Pages Router.
```

Stack/import trace principal:

```text
./lib/supabase/server.ts
./modules/medals/points.ts
./components/medals/event-form.tsx [Client Component Browser]
./app/(admin)/medals/events/new/page.tsx [Server Component]
```

Causa provavel:
- `modules/medals/points.ts` importa `createClient` de
  `@/lib/supabase/server`, que por sua vez importa `next/headers`.
- Varios componentes client importam constantes/tipos de
  `@/modules/medals/points`.
- Como `points.ts` e um barrel misto, ele exporta logica pura e tambem carrega
  codigo server-only. Isso leva `next/headers` para o bundle client.

Arquivos observados com import problematico direto:
- `components/medals/event-form.tsx`
- `components/medals/launch-for-student-button.tsx`
- `components/medals/medal-launch-form.tsx`
- `components/medals/edit-approved-medal-button.tsx`
- `components/medals/approval-queue.tsx`
- `components/students/medals-section.tsx`
- `app/(admin)/medals/points/points-form.tsx`
- `app/(student)/aluno/medalhas/page.tsx`

Exemplo concreto:

```tsx
// components/medals/event-form.tsx
"use client";
import { MEDAL_LEVEL_LABELS } from "@/modules/medals/points";
```

Enquanto:

```ts
// modules/medals/points.ts
import { createClient } from "@/lib/supabase/server";
export * from "./points-rules";
```

`MEDAL_LEVEL_LABELS` existe em `modules/medals/points-rules.ts`, que e puro e
nao importa `next/headers`. O problema e importar pelo modulo misto
`points.ts`.

## Impacto em ambiente local

Servidor local reiniciado em `http://localhost:3001`.

Rotas testadas por HTTP:

```text
/ -> 200
/login -> 200
/medals/points -> 500
/medals/events -> 500
/medals/approvals -> 500
/medals/ranking -> 500
/professor/medals/events -> 500
/professor/medals/approvals -> 500
/professor/medals/ranking -> 500
/aluno/medalhas -> 500
/aluno/ranking -> 500
/aluno/dossie -> 500
```

Erro capturado em `curl http://localhost:3001/medals/events`:

```text
./lib/supabase/server.ts:2:1
You're importing a module that depends on "next/headers". This API is only
available in Server Components in the App Router, but you are using it in the
Pages Router.

Import traces:
  #4 [Client Component Browser]:
    ./lib/supabase/server.ts [Client Component Browser]
    ./modules/medals/points.ts [Client Component Browser]
    ./app/(admin)/medals/points/points-form.tsx [Client Component Browser]
    ./app/(admin)/medals/points/points-form.tsx [Server Component]
    ./app/(admin)/medals/points/page.tsx [Server Component]
```

Conclusao: a Fase 12 nao esta deployavel no estado atual porque o build de
producao quebra, e as telas novas de medalhas/ranking ficam inacessiveis em
desenvolvimento com erro 500.

## Observacao adicional

O arquivo `1.png` ja estava nao versionado antes do pull e permaneceu
intocado. Ele nao faz parte desta analise.
