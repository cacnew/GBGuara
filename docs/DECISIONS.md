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

## Ficha de professor separada do login (Fase 2.5)

- O documento mestre (seção 10.7) modela `teachers` sem nenhuma coluna de
  ligação para `users` — são conceitos deliberadamente separados: `users`
  é conta/role de acesso ao sistema, `teachers` é o cadastro/ficha
  profissional (pode existir um instrutor auxiliar na ficha sem nunca
  ganhar login, por exemplo). Por isso a rota de criar **login** de
  professor (Fase 1.8) e a rota de criar a **ficha** do professor (Fase
  2.5) continuam sendo dois fluxos independentes, sem tentar sincronizar
  nome/e-mail entre as duas tabelas.
- Para não colidir nomes de rota, a tela de criação de login (Fase 1.8)
  foi movida de `/teachers/new` para `/teachers/login/new`, liberando
  `/teachers` (lista) e `/teachers/new` (criar) para a ficha completa —
  mais intuitivo dado que `/teachers` agora é o catálogo de professores.
- FK pendente desde a Fase 2.3 (`students.main_teacher_id`) finalmente
  criada aqui (`on delete set null`), agora que `teachers` existe.
- Aplicada via `supabase migration up --local` em vez de `db reset`, para
  não apagar as contas de demonstração (`admin@nexusdojo.dev`,
  `professor@nexusdojo.dev`) criadas para o usuário navegar na aplicação.
- Testado localmente via Docker: criar/editar ficha de professor, e a FK
  de `main_teacher_id` (aluno vinculado a um professor, e
  `on delete set null` disparando corretamente ao excluir o professor).

## Graduação de professores (Fase 2.6)

- `teacher_graduations` sem tela de histórico dedicada — inserir/listar
  direto na ficha do professor (`app/(admin)/teachers/[id]/edit`), mesmo
  padrão de "seção extra" usado para responsáveis do aluno (Fase 2.4).
- Com os clients já tipados (`Database`) desde a Fase 2.4, o embed
  `modalities(name)`/`belts(name)` já veio certo como objeto único de
  primeira — não repetiu o bug de indexação `[0]` das fases anteriores.
- Com isso, a Fase 2 (Cadastros base) está concluída.

## Turmas / class_groups (Fase 3.1)

- `week_days` como `smallint[]` (0=domingo ... 6=sábado), preenchido via
  checkboxes no formulário. Para evitar o mesmo problema de tipagem
  `z.coerce` já visto (Fase 2.2), o schema de validação usa
  `z.array(z.string())` (valores dos checkboxes como string) e a
  conversão para número acontece na Server Action antes do insert/update
  — não no schema Zod usado pelo `useForm`.
- `suggested_audience` é só orientativo (seção 3 do documento mestre): o
  formulário deixa isso explícito com uma nota abaixo do campo. Nada no
  banco ou na aplicação bloqueia matrícula/presença fora do público
  sugerido.
- `unit_id` preenchido automaticamente com a única unidade da escola,
  mesmo padrão já usado em `students` (Fase 2.3).
- Testado localmente via Docker: criar turma com múltiplos dias da semana,
  editar trocando os dias e o horário, e conferir a listagem renderizando
  os dias abreviados (`Ter, Qui`) e o horário corretamente.

## Turmas do dia: view + abrir/reaproveitar sessão (Fase 3.2)

- `todays_class_groups` é uma `VIEW` (não uma função) que filtra
  `class_groups` ativas cujo `week_days` contém o dia da semana de
  `current_date` (`extract(dow from current_date)`, mesma convenção
  0=domingo usada no formulário de turmas). Recalcula sozinha a cada dia,
  sem job nenhum.
- **`security_invoker = true` é obrigatório na view**: por padrão, uma
  view no Postgres roda com o privilégio de quem a criou (`postgres`,
  que bypassa RLS localmente por ser superuser) — sem essa opção, a view
  vazaria turmas de **todas** as escolas para qualquer usuário
  autenticado, silenciosamente. Confirmado o comportamento correto
  testando acesso anônimo à view (bloqueado, igual às tabelas).
- `openOrReuseClassSession()` (`modules/classes/sessions.ts`, usada tanto
  por admin quanto por professor) usa a constraint
  `unique(class_group_id, date)` para nunca duplicar a sessão do dia;
  trata também o caso de corrida (dois cliques quase simultâneos) via o
  código de erro `23505` do Postgres, buscando a sessão que "venceu" a
  corrida em vez de falhar.
- Testado localmente via Docker: turma com o dia de hoje aparece na view;
  abrir sessão duas vezes retorna o mesmo `id`; acesso anônimo à view
  bloqueado.

## Turmas do dia: componente compartilhado (Fase 3.3)

- `(admin)` e `(teacher)` são route groups (invisíveis na URL) — a mesma
  página física não pode existir em ambos com o mesmo nome de rota
  (colidiria), mesmo problema já resolvido na Fase 1.6. Em vez de
  duplicar a lógica de busca das turmas de hoje, extraí um componente
  Server compartilhado (`components/classes/todays-classes.tsx`) usado
  por `app/(admin)/today/page.tsx` (rota nova, `/today`) e por
  `app/(teacher)/professor/page.tsx` (dashboard do professor, que já
  existia como placeholder desde a Fase 1.6 — agora mostra as turmas de
  verdade).
- Tipos gerados marcam **toda coluna de uma VIEW como nullable**
  (mesmo colunas que são `NOT NULL`/PK na tabela de origem, como
  `todays_class_groups.id`, que vem de `class_groups.id`). Corrigido com
  optional chaining nos horários e non-null assertion comentada no `id`
  (a PK nunca é null de fato).
- Botão "Abrir chamada" já aponta para `/attendance/[sessionId]`
  (`components/classes/open-session-button.tsx`), rota que só passa a
  existir na Fase 4.3 — até lá, clicar levaria a um 404 se usado fora
  desta sessão de execução contínua das fases.
- Testado localmente via Docker com as duas contas de demonstração:
  turma de hoje aparece tanto em `/today` (admin) quanto em `/professor`
  (professor).

## Sessão extra e cancelamento (Fase 3.4)

- "Extra" reaproveita uma `class_group` já cadastrada (ex: "Open Mat"),
  só que abre a sessão numa data qualquer, não necessariamente prevista
  em `week_days` — por isso `createExtraClassSession` não usa a view
  `todays_class_groups`, insere direto com `status = 'extra'`.
- Continua respeitando `unique(class_group_id, date)`: não dá pra abrir
  duas sessões da mesma turma no mesmo dia, nem uma normal e uma extra
  juntas. Suficiente para o MVP 1A; o documento mestre não pede o
  contrário.
- Cancelar só afeta sessões `agendada`/`extra` (`.in("status", [...])`)
  — nunca uma sessão já `realizada`, evitando apagar frequência
  registrada por engano.
- UI mínima: `/classes/sessions` (lista de sessões futuras com botão de
  cancelar) e `/classes/sessions/new` (form: turma + data). Sem
  calendário visual — fora de escopo do MVP 1A.
- Testado localmente via Docker: criar sessão extra numa data futura
  (status `extra`), cancelar (status muda para `cancelada`), e
  confirmação visual na listagem.

## Attendances: constraint de duplicidade (Fase 4.1)

- `unique(class_session_id, student_id)` é a garantia real da regra
  rígida do documento mestre (seção 3): "o mesmo aluno não pode ser
  registrado duas vezes na mesma turma, na mesma data". A aplicação
  (Fase 4.3) trata o erro dessa constraint como feedback amigável, mas
  quem impede de fato é o banco.
- Sem policy de `update` em `attendances` — o fluxo previsto (Fase 4.4)
  é *remover* uma presença incorreta (delete), não editar; se precisar
  trocar o status de uma presença, é apagar e registrar de novo.
- `registered_by_user_id` referencia `public.users` (não `auth.users`
  diretamente) — mantém consistência com o resto do schema, que sempre
  referencia o perfil de aplicação.
- Testado diretamente via SQL local: segunda tentativa de inserir a
  mesma presença (mesma sessão + mesmo aluno) rejeitada pela constraint,
  confirmando a regra antes mesmo de construir a tela de chamada.

## Busca rápida de aluno (Fase 4.2)

- `modules/students/search.ts#searchActiveStudents`: só `status = 'ativo'`
  (regra da seção 3 — presença é só para aluno ativo), com faixa/grau via
  embed `belts(name, color_hex)` e limite de 20 resultados (é busca
  incremental para tela de chamada, não listagem paginada).
- `components/students/student-search.tsx`: client component com debounce
  de 200ms via `useEffect` + `useTransition` — sem `react-query` aqui
  (embora já esteja instalado no projeto) porque não há necessidade real
  de cache entre buscas distintas nesta tela.
- Prop `excludeIds` já prevista para a Fase 4.3 esconder da busca quem já
  foi marcado presente na sessão em andamento.
- Testado localmente via Docker (função de busca direta, componente ainda
  não tem consumidor até a Fase 4.3): aluno ativo com faixa aparece
  corretamente, aluno inativo não aparece na busca.

## Tela de chamada (Fase 4.3)

- `app/attendance/[sessionId]` fica **fora** de `(admin)` e `(teacher)`
  (rota real, não route group) porque os dois papéis precisam acessá-la a
  partir do mesmo botão "Abrir chamada" (Fase 3.3). Sem o layout de grupo
  para proteger automaticamente, a página chama `requireUser()`
  diretamente — não `requireRole()`, já que tanto admin quanto professor
  podem fazer chamada.
- `markPresent()` (`modules/attendance/actions.ts`) devolve o
  `attendanceId` criado, usado depois pela Fase 4.4 para remover uma
  presença específica sem precisar de outra consulta.
- Erro de duplicidade (constraint da Fase 4.1, código Postgres `23505`)
  vira mensagem amigável ("Esse aluno já está presente nesta sessão") em
  vez de expor o erro técnico do banco.
- Layout pensado para celular: botões grandes, busca com foco automático,
  lista de presentes compacta — sem menu, sem sidebar, só o essencial da
  seção 16 do documento mestre.
- Testado localmente via Docker: acesso não autenticado bloqueado
  (redirect para `/login`), aluno marcado presente com um clique, e
  segunda tentativa do mesmo aluno na mesma sessão rejeitada com
  mensagem clara — confirmado tanto via chamada direta da action quanto
  na página renderizada ("Presentes (1)").

## Remover presença incorreta (Fase 4.4)

- `removeAttendance()` já existia desde a Fase 4.3 (implementada junto,
  faz sentido dado o acoplamento natural das duas telas); esta subtarefa
  só wireou o botão "Remover" em cada linha da lista de presentes no
  `attendance-client.tsx`.
- Confirmado que remover e marcar de novo funciona sem ficar "preso" pela
  constraint `unique(class_session_id, student_id)` — a remoção é um
  delete de verdade, não um soft-delete, então a constraint libera
  imediatamente.

## Histórico de presença por aluno (Fase 4.5)

- Seção somente leitura na ficha do aluno (`attendance-history.tsx`),
  mesmo padrão de "seção extra" das Fases 2.4/2.6 — sem paginação
  (`limit(50)`), suficiente para o volume do MVP 1A.
- Validação central do produto confirmada de ponta a ponta aqui: o mesmo
  aluno registrado presente em duas turmas diferentes no mesmo dia
  (`Turma Manha Historico` e `Turma Noite Historico`, ambas com data
  `2026-07-04`) — a constraint da Fase 4.1 é por `(class_session_id,
  student_id)`, não por `(student_id, date)`, então isso é permitido
  como esperado pela seção 3 do documento mestre. Confirmado tanto na
  query quanto na renderização da ficha do aluno.
- Com isso, a Fase 4 (Frequência) está concluída.

## Tabelas de preço (Fase 5.1)

- Link "Planos" da listagem (`/finance/plans?priceTableId=...`) e a
  contagem de planos por tabela ficaram para a Fase 5.2, quando a tabela
  `plans` existir — referenciar `plans(id)` no `.select()` antes da
  tabela existir ainda compilava (o gerador de tipos não falha para
  relações desconhecidas do jeito que falha para colunas/tabelas
  inexistentes numa query direta), mas quebraria em runtime
  ("could not find relationship"). Removido por enquanto; a Fase 5.2
  adiciona de volta corretamente.
- CRUD segue exatamente o mesmo padrão das fases anteriores (RLS por
  `school_id`, form compartilhado create/edit, status como campo do
  form em vez de ação separada).
- Testado localmente via Docker: criar tabela, editar (mudar vigência de
  fim e status para `legacy`), listagem retornando 200.

## Planos (Fase 5.2)

- `classes_per_week`/`classes_total` viram `null` no banco quando
  `unlimited = true` (em vez de manter os campos numéricos com 0
  "esquecido") — evita ambiguidade entre "sem limite" e "limite zero".
- Preços em `numeric(10, 2)`, não `integer`/centavos — mantém simetria
  com o `base_price`/`setup_fee` como reais e centavos direto, mais
  simples de exibir sem conversão, aceitável na escala do MVP 1A.
- Link "Planos" da listagem de tabelas de preço (Fase 5.1) e a contagem
  de planos por tabela, adiados naquela fase por dependência circular,
  finalmente ligados aqui.
- Testado localmente via Docker: criar plano vinculado a uma tabela,
  editar preço e status, e a contagem de planos aparecendo corretamente
  na listagem de tabelas de preço.

## Contas financeiras: seed via trigger, não só seed.sql (Fase 5.3)

- O critério da subtarefa pedia "seed de contas padrão aplicado no
  seed.sql", mas `supabase/seed.sql` só roda uma vez, no `db reset`
  local — não afeta escolas reais criadas via onboarding em produção.
  Segui o mesmo padrão das Fases 2.1/2.2 (unidade default, modalidades,
  faixas): o seed de `financial_accounts` (Caixa, Conta Bancária, Pix,
  Cartão) entra no trigger consolidado `create_default_school_setup`,
  garantindo que toda escola nova — local ou em produção — já nasce
  pronta para registrar pagamento, não só a escola de demonstração do
  ambiente local.
- Sem CRUD nesta subtarefa (não pedido pelo critério) — só a migration e
  o seed automático. Uma tela de gestão de contas pode entrar depois se
  necessário.
- Testado localmente via Docker: escola nova recebe as 4 contas padrão
  automaticamente, e o restante do trigger (modalidades, faixas)
  continua funcionando após a alteração.

## Contracts + contract_students: só schema por enquanto (Fase 5.4)

- `financial_responsible_id` é polimórfico (student/guardian/other via
  `financial_responsible_type`) — sem FK, integridade fica por conta da
  aplicação.
- Regra "só um contrato ativo por aluno" fica documentada aqui em
  comentário, mas a validação de verdade entra na Fase 5.6 (quando o
  fluxo de criação de contrato existir e puder perguntar ao admin se
  deve encerrar o contrato anterior).
- FK pendente desde a Fase 2.3 (`students.current_contract_id`) criada
  agora que `contracts` existe — confirmada via `pg_constraint`.

## Schema de banco (Fase 1+)

- **SQL puro via Supabase CLI** (`supabase/migrations`), sem ORM (Drizzle
  descartado). Motivo: alinhamento mais direto com RLS nativo do Supabase e
  com a estrutura de pastas já sugerida no documento mestre do projeto.

## Paleta visual (Fase 0.7)

- **Opção 1 — Tatame Red**: preto profundo (`#0B0B0F`), grafite
  (`#18181B`), cinza (`#27272A`), branco suave (`#F4F4F5`), vermelho tatame
  (`#C8102E`). Escolhida por ser a estética mais alinhada à identidade de
  "escola de luta" descrita no documento mestre (seção 15).
