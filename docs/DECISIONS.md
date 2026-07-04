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

## Paleta, tipografia e tema (Fase 0.7)

- Tokens de cor da paleta Tatame Red aplicados via CSS custom properties em
  `app/globals.css` (Tailwind v4 é CSS-first, sem `tailwind.config.js`).
  Convenção do shadcn/ui mantida: `:root` = tema claro, `.dark` = tema
  escuro; o `<html>` já nasce com a classe `dark` (tema escuro é o padrão
  do produto).
- Toggle de tema em `components/layout/theme-toggle.tsx`: alterna a classe
  `dark` no `<html>` e persiste a preferência em `localStorage`
  (`nexusdojo-theme`). Um script inline no `<head>` (`app/layout.tsx`) lê
  essa preferência antes da hidratação para evitar flash de tema errado.
- Sem dependência nova para o toggle (não usamos `next-themes`) — a lógica
  é simples o suficiente para não justificar mais uma lib nesta fase.
- Tipografia: `Inter` (texto, `--font-sans`) e `Outfit` (títulos,
  `--font-heading`), carregadas via `next/font/google`, substituindo as
  fontes Geist do template padrão do `create-next-app`.
- `app/page.tsx` e os SVGs de boilerplate do `create-next-app` foram
  substituídos por uma página inicial mínima da marca (usada aqui também
  para validar visualmente paleta/tipografia/toggle).

## Padrão de RLS multi-tenant (Fase 1.3)

- Função `public.current_school_id()` (SECURITY DEFINER, STABLE) resolve o
  `school_id` do usuário autenticado a partir de `public.users`, evitando
  recursão de RLS quando a própria tabela `users` referencia a si mesma em
  uma policy — padrão oficial recomendado pela documentação da Supabase.
  Todas as tabelas com `school_id` devem usar essa função nas suas policies
  em vez de reescrever a subquery toda vez.
- **RLS sozinha não basta**: além de `ENABLE ROW LEVEL SECURITY` + policy,
  é preciso `GRANT` explícito de tabela para o papel `authenticated` (o
  Postgres nega por privilégio antes mesmo de avaliar as policies). O papel
  `anon` não recebe grant em nenhuma tabela de dados da escola — descoberto
  na prática ao testar via REST com um JWT real (retornava "permission
  denied" mesmo com a policy correta até o grant ser adicionado).
- Testado localmente ponta a ponta: criado usuário via Admin API do GoTrue
  (`/auth/v1/admin/users`), logado via `/auth/v1/token?grant_type=password`
  e consultado `schools`/`units`/`users` via REST com o JWT real — usuário
  da "Escola A" só enxergou dados da própria escola, nunca os de uma
  "Escola B" criada só para o teste negativo.

## Supabase Auth: client/server helpers (Fase 1.4)

- `@supabase/ssr` + `@supabase/supabase-js` instalados. `lib/supabase/client.ts`
  (browser) e `lib/supabase/server.ts` (Server Components/Actions, via
  `next/headers`) seguem o padrão oficial de SSR da Supabase.
- `proxy.ts` na raiz (não `middleware.ts`) chama
  `lib/supabase/middleware.ts#updateSession` para renovar o token de sessão
  a cada request. O Next.js 16 deprecou a convenção `middleware.ts` em
  favor de `proxy.ts` (mesma API, arquivo/nome de função diferentes) — o
  próprio build avisou isso; migramos imediatamente para não carregar uma
  convenção já deprecada desde o início do projeto. A checagem de rota
  protegida (redirecionar não autenticado para `/login`) fica para a Fase
  1.6 — por enquanto o proxy só renova sessão.
- Login por e-mail/senha validado localmente de ponta a ponta: usuário
  criado via Admin API do GoTrue, chamada real a
  `supabase.auth.signInWithPassword` a partir de uma Route Handler
  temporária usando `lib/supabase/server.ts` (removida após confirmar).

## Onboarding: escola + admin (Fase 1.5)

- `lib/supabase/admin.ts`: client separado com a `service_role` key
  (bypassa RLS), usado só em código server-side privilegiado — nunca
  exposto ao browser. Necessário porque o onboarding cria o primeiro
  usuário de uma escola nova, quando ainda não existe ninguém autenticado
  para satisfazer as policies normais de `users`/`schools`.
- Duas etapas não podem estar na mesma transação Postgres porque uma delas
  não é uma operação de banco: (1) criar o usuário no `auth.users` via
  Admin API do GoTrue (`admin.auth.admin.createUser`), depois (2) criar
  `schools` + `users` via a função `public.create_school_with_admin`
  (transação real no Postgres). Se (2) falhar, a Server Action apaga o
  `auth.users` criado em (1) para não deixar conta órfã sem perfil.
- Formulário em `app/(public)/onboarding/page.tsx` (RHF + Zod, reaproveitando
  o padrão já validado na Fase 0.3) chama a Server Action
  `app/(public)/onboarding/actions.ts#onboardSchool` diretamente (sem
  `<form action>` nativo), o que permite mostrar toast de erro/sucesso e
  navegar via `router.push` no client.
- `<Toaster />` do `sonner` plugado no layout raiz (estava instalado desde
  a Fase 0.2, mas nunca tinha sido usado até agora).
- Testado localmente ponta a ponta via Docker (rota temporária removida
  depois): escola + unidade default + admin criados corretamente numa
  chamada; e-mail duplicado retorna erro tratado sem tentar gravar nada no
  banco.
- O redirecionamento pós-sucesso vai para `/login`, que só é criada na
  Fase 1.6 — até lá, o redirect aponta para uma rota que ainda não existe
  (esperado, será resolvido na próxima subtarefa).

## Login e proteção de rotas por role (Fase 1.6)

- **Proteção por layout, não por `proxy.ts`**: `app/(admin)` e
  `app/(teacher)` são route groups — invisíveis na URL. O `proxy.ts` não
  tem como saber, só pelo `pathname`, a qual grupo uma rota pertence.
  Então a checagem de "está autenticado" + "tem o role certo" vive nos
  Server Components `app/(admin)/layout.tsx` e `app/(teacher)/layout.tsx`,
  via `modules/users/queries.ts#getCurrentUserProfile()`. O `proxy.ts`
  continua só renovando a sessão (Fase 1.4).
- Não autenticado → redirect para `/login`. Autenticado mas com o role
  errado para aquele grupo → bounce para a área correta (`/dashboard`
  ↔ `/professor`), em vez de deslogar ou mostrar erro.
- **Nomes de rota escolhidos para não colidir**: como route groups são
  transparentes na URL, `(admin)/dashboard` e `(teacher)/professor` não
  podem ter o mesmo nome de pasta interna (ex: os dois se chamando
  `dashboard`) — o Next.js rejeitaria por rota duplicada. Escolhido
  `/dashboard` para admin e `/professor` para professor como placeholders;
  a Fase 7 pode renomear se fizer sentido, é só um rename de pasta.
- `modules/users/queries.ts` criado agora (não em `lib/permissions`, que é
  a Fase 1.7) só com o necessário para os layouts funcionarem; a Fase 1.7
  generaliza isso num helper de permissões mais completo.
- Testado localmente via Docker com dois usuários reais (admin e
  professor, mesma escola): cada um só acessa a própria área, e tentar a
  área errada faz bounce para a área certa em vez de erro. Acesso não
  autenticado a `/dashboard` e `/professor` confirmado redirecionando
  para `/login`.

## Helper central de permissões (Fase 1.7)

- `lib/permissions/index.ts`: `requireUser()` (exige autenticação),
  `requireRole(role)` (exige autenticação + role específico, com bounce
  para a área correta em caso de role errado) e `requireSameSchool(schoolId)`
  (defesa em profundidade — falha rápido na aplicação antes mesmo de a RLS
  do banco bloquear, para operações sensíveis que recebem um `school_id`
  de fora, ex: formulário).
- Os layouts `app/(admin)/layout.tsx` e `app/(teacher)/layout.tsx` (Fase
  1.6) foram refatorados para usar `requireRole()` em vez da checagem
  ad-hoc que tinham antes — mesmo comportamento, agora centralizado.
- Reconfirmado localmente via Docker que o refactor não mudou o
  comportamento observável (admin/professor, bounce por role, redirect de
  não autenticado).

## Cadastro de professores: login, não ficha completa (Fase 1.8)

- Fase 1.8 cria só o **login** do professor (`auth.users` + `public.users`
  com `role = 'teacher'`), em `app/(admin)/teachers/new/`. A ficha completa
  do professor (tabela `teachers`, foto, telefone) é a Fase 2.5 — ainda não
  existe. `requireRole("admin")` (Fase 1.7) garante que só um admin chega
  na Server Action, e o `school_id` do novo professor vem do próprio
  `adminProfile.schoolId`, nunca de um campo do formulário.
- **`service_role` também precisa de GRANT de tabela**, mesma lição da
  Fase 1.3 com `authenticated`: RLS bypassada ≠ privilégio de tabela.
  Descoberto ao tentar `admin.from("users").insert(...)` diretamente (em
  vez de via função SECURITY DEFINER, como no onboarding da Fase 1.5) e
  levar "permission denied". Corrigido com uma migration que dá `GRANT ALL`
  em `schools`/`units`/`users` para `service_role`, mais um
  `ALTER DEFAULT PRIVILEGES` para que toda tabela nova já nasça com esse
  grant — diferente de `authenticated`, que continua exigindo grant
  explícito tabela a tabela de propósito (força pensar em RLS a cada
  tabela nova).
- Testado localmente via Docker ponta a ponta: admin autenticado cria o
  professor, professor loga e acessa `/professor` (200), é barrado de
  `/dashboard` (bounce), e o `school_id` gravado bate com o do admin que
  criou o login.

## Modalidades e faixas (Fases 2.1 e 2.2)

- Modalidades e faixas são configuráveis por escola (não enum), com seed
  automático via trigger `AFTER INSERT ON schools` — mesmo padrão da
  unidade default (Fase 1.2): toda escola nova já nasce com as 7
  modalidades e as faixas de jiu-jitsu adulto/kids da seção 10 do
  documento mestre.
- **Trigger consolidado em vez de dois triggers dependentes**: o seed de
  faixas depende do id da modalidade `jiu_jitsu` já existir. Como o
  Postgres dispara múltiplos triggers `AFTER INSERT` na mesma tabela em
  ordem alfabética pelo nome (não pela ordem de criação), dois triggers
  separados (`..._create_default_modalities` e `..._create_default_belts`)
  arriscariam disparar na ordem errada dependendo do nome escolhido. A
  migration da Fase 2.2 substitui o trigger da Fase 2.1
  (`drop trigger ... ; create or replace function ...`) por um único
  trigger/função que cria modalidades e depois faixas, na ordem certa,
  na mesma transação. Isso evita editar a migration antiga (imutável,
  já commitada) e ainda resolve a dependência de forma robusta.
- CRUD de modalidades faz "inativar" reaproveitando o próprio formulário
  de edição (campo `status`), em vez de uma ação separada — evita uma
  segunda tela só para isso.
- Testado localmente via Docker ponta a ponta: seed automático confirmado
  (7 modalidades, 2 sistemas de faixa com 7 e 5 faixas) e CRUD completo
  exercitado com sessão real de admin (criar modalidade, editar e
  inativar, criar sistema de faixa, criar faixa) — todas as páginas
  retornando 200 para admin autenticado e redirecionando para `/login`
  quando não autenticado.

## CRUD de alunos (Fase 2.3)

- `students.unit_id` é preenchido automaticamente com a única unidade da
  escola (não há seletor no formulário) — coerente com o MVP 1A não ter
  CRUD de unidades (seção 10.2). Quando existir multiunidade de verdade
  (fora do MVP 1A), o formulário passa a expor a escolha.
- `main_teacher_id` (Fase 2.5, tabela `teachers` ainda não existe) e
  `current_contract_id` (Fase 5, tabela `contracts` ainda não existe)
  ficam sem `FOREIGN KEY` por enquanto — a constraint é adicionada via
  `ALTER TABLE` na migration da fase correspondente, quando a tabela
  referenciada finalmente existir. `current_belt_id` já tem FK, pois
  `belts` foi criada na Fase 2.2.
- Formulário cobre os campos de uso mais comum no dia a dia (nome,
  nascimento, CPF, telefone, e-mail, endereço, contato de emergência,
  status, observações). Os campos de certidão médica, consentimento LGPD,
  foto e faixa/graduação atual existem no schema mas ainda não têm UI —
  entram nas fases que os utilizam de fato (graduação na Fase 6, foto na
  Fase 8.1).
- Busca por nome (`ilike`) e filtro por status implementados via query
  string na própria listagem (`/students?q=...&status=...`), sem
  JavaScript de client extra.
- Testado localmente via Docker: aluno criado com `unit_id` preenchido
  automaticamente, editado (nome e status), encontrado pela busca por
  nome, e rota `/students` bloqueada para não autenticado.

## Responsáveis na ficha do aluno (Fase 2.4)

- `guardians`/`student_guardians` (seções 10.5/10.6) gerenciados direto na
  página de edição do aluno (`app/(admin)/students/[id]/edit`), não numa
  tela própria de "responsáveis" — bate com o que o critério da subtarefa
  pedia ("a partir da ficha do aluno").
- "Responsável principal" único por aluno é garantido na aplicação, não
  por constraint de banco: ao marcar um vínculo como principal, a Server
  Action zera `is_primary` dos outros vínculos do mesmo aluno antes de
  gravar o novo. Não é atômico entre as duas queries (sem transação real),
  aceitável para o volume de uso do MVP 1A; se virar problema, dá para
  mover essa lógica para um trigger no banco depois.

## Tipos gerados do Supabase (Fase 2.4)

- **Bug real encontrado**: sem tipos gerados, o `supabase-js` não sabe a
  cardinalidade de um relacionamento embutido (`select("...", tabela(...))")`)
  e o TypeScript infere `array` por padrão — mas em runtime, uma relação
  many-to-one (FK na própria tabela consultada) volta como **objeto único**,
  não array. Isso já tinha me enganado duas vezes: `belt_systems.modalities`
  (Fase 2.2) e `student_guardians.guardians` (Fase 2.4) — em ambos eu tinha
  "corrigido" o erro de tipo indexando `[0]`, o que satisfazia o
  TypeScript mas silenciosamente quebrava em runtime (o nome da modalidade
  nunca aparecia na tela; os responsáveis apareciam sem nome). Só percebi
  ao inspecionar o JSON real de uma chamada autenticada.
- **Correção definitiva**: `npx supabase gen types typescript --local` para
  gerar `lib/supabase/database.types.ts`, e os três clients
  (`lib/supabase/client.ts`, `server.ts`, `admin.ts`) agora usam
  `createBrowserClient<Database>` / `createServerClient<Database>` /
  `createClient<Database>`. Com o tipo certo, o embed de relação
  many-to-one já é inferido corretamente como objeto único — sem `[0]`.
- Script `npm run db:types` adicionado para regenerar os tipos depois de
  qualquer migration nova (rodar sempre que o schema mudar).
- Efeito colateral: campos com `CHECK` constraint (ex: `status`, `role`,
  `audience`) são tipados como `string` genérico pelos tipos gerados (o
  gerador não lê `CHECK`), então ao passar um valor vindo do banco para um
  campo `zod.enum` de um formulário é necessário um cast explícito
  (`as ModalityInput["status"]`, etc.) — documentado inline em cada lugar
  onde isso acontece.

## Schema de banco (Fase 1+)

- **SQL puro via Supabase CLI** (`supabase/migrations`), sem ORM (Drizzle
  descartado). Motivo: alinhamento mais direto com RLS nativo do Supabase e
  com a estrutura de pastas já sugerida no documento mestre do projeto.

## Paleta visual (Fase 0.7)

- **Opção 1 — Tatame Red**: preto profundo (`#0B0B0F`), grafite
  (`#18181B`), cinza (`#27272A`), branco suave (`#F4F4F5`), vermelho tatame
  (`#C8102E`). Escolhida por ser a estética mais alinhada à identidade de
  "escola de luta" descrita no documento mestre (seção 15).
