# DECISIONS.md — NexusDojo

Registro de decisões técnicas tomadas durante o projeto. Cada entrada
explica o "porquê", não o "o quê" (isso já está no código/commits).

---

## Planos financeiros sem limite de aulas

- Planos representam compromisso financeiro de acesso livre durante a
  vigencia contratual. Eles nao representam pacote de aulas, credito,
  limite semanal ou saldo de uso.
- A presenca operacional continua registrando todas as aulas feitas pelo
  aluno. O financeiro nunca consome presenca e nunca bloqueia chamada por
  quantidade de aulas.
- Os campos legados `classes_per_week`, `classes_total` e `unlimited`
  permanecem no schema por compatibilidade, mas uma migration normaliza os
  dados para `unlimited = true` e valores nulos nos limites, alem de criar
  uma constraint impedindo novos limites de aula.
- O indicador de graduacao conta dias unicos de presenca dentro da
  modalidade da faixa atual do aluno. Multiplas aulas da mesma modalidade
  no mesmo dia contam como um unico dia valido para graduacao; modalidades
  diferentes nao se misturam.

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
  > **Revisado em 05/07/2026**: decisão revertida a pedido do usuário — a
  > ausência de `AppShell` deixava o usuário sem saída da tela (sem
  > sidebar, sem botão de concluir) depois de marcar presença. A rota
  > passou a ter `app/attendance/[sessionId]/layout.tsx` próprio, que
  > aplica `AppShell` com o `role` do usuário logado (admin ou
  > professor), e a página ganhou um botão "Concluir chamada" que volta
  > para `/today` ou `/professor` conforme o papel. Ver
  > `app/attendance/[sessionId]/layout.tsx` e `page.tsx`.
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

## Geração automática de parcelas (Fase 5.5)

- Trigger `AFTER INSERT ON contracts` gera as parcelas — nasce junto com
  o contrato, sem passo manual extra na Fase 5.6.
- Arredondamento: `base = round(final_price / n, 2)`, última parcela =
  `final_price - base*(n-1)` — absorve a diferença de arredondamento,
  garantindo que a soma bate exatamente com `final_price` mesmo quando a
  divisão não é exata (confirmado com 3x de R$550 → 183.33+183.33+183.34
  e 12x de R$2000 → 166.67×11+166.63).
- **Achado importante**: o trigger não é `SECURITY DEFINER`, então roda
  com o privilégio de quem inseriu o contrato (`authenticated`) — por
  isso `contract_installments` precisa de `GRANT insert` **e** de uma
  policy de insert (`school_id = current_school_id()`), não só o grant.
  Quase committei só com o grant (mesma classe de erro das Fases 1.3/1.8,
  mas do lado da policy dessa vez em vez do grant) — pego antes de
  aplicar a migration, ao reler o arquivo.
- Testado localmente via Docker com usuário autenticado real (não
  service_role, para validar a RLS do trigger de verdade): 1x, 3x e 12x,
  soma das parcelas conferindo com o valor final em todos os casos.

## Fluxo "Associar plano ao aluno" (Fase 5.6)

- Rota dedicada `students/[id]/contract/new` (em vez de modal/drawer)
  para dar espaço de tela ao wizard de 7 passos, sem competir com o
  resto da ficha do aluno.
- Wizard controlado por `useState` puro no client, sem lib de state
  machine — decisão consciente de YAGNI, o fluxo é linear e não precisa
  de histórico/branching complexo.
- Responsável financeiro tipo `other` (empresa/terceiro sem cadastro):
  como `contracts.financial_responsible_id` não tem FK e não existe
  campo de nome livre no schema, o nome informado é gravado em
  `contracts.notes` (`financial_responsible_id` fica `null`) em vez de
  criar uma migration nova só para isso.
- Responsável tipo `guardian` só lista responsáveis já vinculados ao
  aluno (via `student_guardians`), não busca entre todos os guardians da
  escola — evita vincular financeiramente alguém que a ficha do aluno
  ainda não reconhece como responsável.
- O preço final é **sempre recalculado no servidor** a partir do
  `base_price` do plano + desconto — o valor calculado no client é só
  preview de UX, nunca é confiado pela Server Action.
- Regra "só um contrato ativo por aluno" (pendente desde a Fase 5.4):
  a Server Action rejeita a criação se já existir um contrato `active`
  e o client não tiver confirmado explicitamente encerrar o anterior
  (`endPreviousContractId` precisa bater com o id do contrato ativo
  encontrado no servidor — nunca confia apenas na flag do client).
- **Ordem das escritas importa**: encerrar o contrato anterior é sempre
  o **último** passo, só depois que o novo `contract` +
  `contract_students` + `students.current_contract_id` já foram
  gravados com sucesso (com limpeza manual/delete se algum passo
  intermediário falhar). Sem isso, uma falha parcial no meio da
  sequência (sem transação/RPC — Server Actions deste projeto fazem
  chamadas sequenciais ao Supabase, não RPC) podia deixar o aluno sem
  nenhum contrato ativo, pior do que a regra que a subtarefa deveria
  proteger. Risco aceito e não resolvido nesta fase: dois cliques
  simultâneos ainda podem criar dois contratos ativos (race condition
  de leitura-antes-da-escrita) — precisaria de constraint/índice parcial
  no banco para fechar de verdade; deixado como risco conhecido dado o
  uso real (admin único por escola, não concorrente).
- Testado localmente via Docker/Playwright com usuário autenticado real:
  fluxo completo (aluno sem contrato, 3x com soma batendo em
  183.33+183.33+183.34), desconto percentual + responsável `guardian`,
  troca de contrato ativo com responsável `other` (encerramento do
  anterior + notes gravadas corretamente), e bloqueio do submit sem a
  confirmação da checkbox de encerramento.

## Migration de `financial_movements` (Fase 5.7)

- **`financial_account_id` adicionado apesar de não estar no documento
  mestre** (seção 11.7 lista `financial_movements` sem essa coluna).
  Sem ela, `financial_accounts` (Fase 5.3, criada especificamente para
  saber "onde o dinheiro entrou") nunca seria referenciada por nenhuma
  outra tabela do sistema — ficaria um schema morto. Pergunta feita ao
  usuário sobre isso não teve resposta a tempo; segui a opção
  recomendada (adicionar a coluna). Se Carlos preferir seguir o
  documento à risca, é reverter para nullable ou remover a coluna nesta
  migration antes que outras fases passem a depender dela.
- `financial_account_id` é `not null` (todo movimento de caixa precisa
  saber onde o dinheiro entrou) com `on delete restrict` (não permite
  apagar uma conta financeira que já tem movimentos vinculados).
- `student_id` é `not null` — todo movimento financeiro deste MVP está
  ligado a um aluno (sem despesas/movimentos administrativos genéricos
  por enquanto). `contract_id` e `contract_installment_id` são opcionais
  (`on delete set null`) para permitir movimentos futuros não ligados a
  parcela específica (ex: `adjustment` avulso).
- Só schema nesta fase — a criação automática de um `financial_movement`
  tipo `income` ao registrar pagamento de parcela é implementada na
  Fase 5.8, junto com a ação "Registrar pagamento".
- Testado localmente via Docker: insert válido de `income` com
  `financial_account_id`, rejeição de `type` inválido pela check
  constraint, e rejeição de insert sem `financial_account_id` pela
  constraint `not null`.

## Ação "Registrar pagamento" (Fase 5.8)

- Sem tela nova nesta fase (a aba financeira é a Fase 5.12) — só a
  Server Action `registerInstallmentPayment`
  (`modules/finance/payment-actions.ts`), testada via página temporária
  (removida antes do commit final, mesmo padrão da Fase 5.5).
- **Ordem das escritas**: o `financial_movement` é inserido *antes* de
  atualizar a parcela — se a atualização da parcela falhar depois, o
  movimento recém-criado é desfeito (delete) antes de retornar o erro.
  Prioriza nunca deixar "dinheiro invisível" (parcela marcada paga sem
  rastro de caixa) sobre o inverso (rastro de caixa sem a parcela
  atualizada, que é um estado mais fácil de detectar e corrigir).
- `paid_amount`/`remaining_amount` são cumulativos: cada chamada soma
  `amountPaid` ao que já estava pago; se zerar o `remaining_amount`,
  status vira `paid`, senão `partially_paid`. Pagamento maior que o
  saldo em aberto é rejeitado antes de qualquer escrita.
- Parcelas com status `paid`/`canceled`/`refunded` rejeitam novo
  pagamento (só `pending`/`overdue`/`partially_paid` podem receber).
- "Parcela paga não pode ser excluída" (critério da subtarefa): já
  garantido desde a Fase 5.5 — a tabela `contract_installments` tem RLS
  habilitada e nunca teve uma policy de `delete` criada, então o
  Postgres nega qualquer exclusão por padrão, mesmo com o `grant delete`
  concedido. Confirmado via teste manual (DELETE autenticado não remove
  a linha). Nenhum código novo foi necessário para isso.
- `financial_account_id` obrigatório no pagamento — validado contra
  `school_id` do usuário autenticado antes de usar (mesmo padrão de
  `requireSameSchool`, evitando usar uma conta financeira de outra
  escola mesmo que o RLS já bloqueie no banco).
- Testado localmente via Docker/Playwright com usuário autenticado real:
  pagamento total (parcela vira `paid`), pagamento parcial em duas
  chamadas somando ao valor cheio (`partially_paid` → `paid`), rejeição
  de pagamento em parcela já paga, rejeição de valor maior que o saldo
  em aberto (sem alterar a parcela), e confirmação de que a parcela paga
  não pôde ser excluída via RLS.

## Ações "Cancelar parcela futura" e "Estornar pagamento" (Fase 5.9)

- `cancelInstallment`: só cancela parcela com status `pending` **e**
  `due_date >= hoje` — interpretação literal do critério ("parcela
  pendente futura"). Uma parcela `pending` já vencida (que seria
  classificada `overdue` pelo job da Fase 5.11, ainda não implementado)
  não pode ser cancelada por esta ação; o motivo, se informado, é
  anexado ao `notes` existente (sem sobrescrever histórico anterior).
- `refundInstallmentPayment`: só aceita parcelas `paid` ou
  `partially_paid` (que tenham `paid_amount > 0`); rejeita estorno maior
  que o valor efetivamente pago. Cria um `financial_movement` tipo
  `refund` **sem apagar** o `financial_movement` `income` original —
  o histórico de caixa preserva os dois lançamentos.
- Status `refunded` (já existia no schema desde a Fase 5.5) é usado só
  quando o estorno zera o `paid_amount` da parcela (estorno total).
  Estorno parcial mantém status `partially_paid` com `paid_amount`/
  `remaining_amount` recalculados — não existe um status
  "parcialmente estornada" dedicado, então a parcela volta a aparecer
  como parcialmente paga com o saldo correto.
- Mesma ordem de escrita da Fase 5.8: o `financial_movement` de estorno
  é inserido antes de atualizar a parcela, com rollback (delete do
  movimento) se a atualização falhar — nunca fica um estorno "invisível"
  sem refletir na parcela.
- Sem tela nova (aba financeira é a Fase 5.12); testado via página
  temporária (removida antes do commit), mesmo padrão das Fases 5.5/5.8.
- Testado localmente via Docker/Playwright: cancelar parcela futura
  pendente (status `canceled`, `notes` preenchido), rejeição ao tentar
  cancelar de novo, estorno total (parcela `paid` → `refunded`,
  `paid_amount=0`), estorno parcial (`partially_paid` com saldo
  recalculado), rejeição de estorno acima do valor pago, e confirmação
  de que os dois `financial_movements` (pagamento original + estorno)
  continuam ambos no banco.

## Migration de `student_financial_exemptions` (Fase 5.10)

- `reason` ganhou check constraint (`bolsista`, `isento`, `permuta`,
  `cortesia`, `outro`) — o documento mestre só lista o campo sem
  vocabulário fechado, mas segue o padrão já usado em `category` de
  `financial_movements` (Fase 5.7).
- Sem CRUD/tela nesta subtarefa (não pedido pelo critério) — a
  view/query de inadimplência da Fase 5.11 é quem vai consumir
  `status = 'active'` para excluir alunos isentos da lista de
  inadimplentes.
- Testado localmente via Docker: insert válido, rejeição de `reason`
  fora do vocabulário controlado.

## View de inadimplência `overdue_students` (Fase 5.11)

- Implementada como **view**, não como job/rotina agendada — o critério
  da subtarefa já descreve explicitamente "query (view ou função)".
  Calcular em leitura evita manter um cron só para marcar parcelas como
  vencidas, e sempre reflete a data atual sem depender de quando um job
  rodou pela última vez.
- `security_invoker = true` (mesmo padrão de `todays_class_groups`,
  Fase 3.2) — sem isso a view roda com privilégio de dono e vazaria
  inadimplentes de outras escolas.
- Um aluno só entra na view se tiver parcela `pending`/`partially_paid`
  com `due_date < hoje` **e** não tiver isenção `active` vigente (Fase
  5.10) na data atual.
- Retorna agregado por aluno (`overdue_installments_count`,
  `overdue_amount`, `oldest_overdue_due_date`) — suficiente para a tela
  de inadimplentes (Fase 5.13) e os cards do dashboard financeiro
  (Fase 7.1/7.3), sem precisar expor as parcelas individuais aqui.
- Testado localmente via Docker: aluno com parcela vencida e sem
  isenção aparece na view; aluno com parcela igualmente vencida mas com
  isenção `active` fica corretamente de fora.

## Aba financeira na ficha do aluno (Fase 5.12)

- **"Renovar plano" e "Trocar plano" reaproveitam a mesma rota**
  (`/students/[id]/contract/new`, Fase 5.6) em vez de dois fluxos
  separados — o wizard já pergunta se deve encerrar o contrato ativo
  antes de criar o novo, cobrindo os dois casos (renovação natural e
  troca de plano) com uma única implementação.
- **"Situação financeira" é sempre calculada em tempo real** a partir da
  view `overdue_students` (Fase 5.11) + `student_financial_exemptions`
  (Fase 5.10) + `contracts.status` — não usa a coluna
  `students.financial_status` (existente desde a Fase 2.3), porque nada
  no sistema mantém essa coluna sincronizada ainda. Prioridade de
  cálculo: isento > inadimplente > pausado > encerrado > regular.
- Resumo (valor em aberto/vencido, total pago/contratado, próximo
  vencimento, contadores de parcela) é calculado só a partir do
  **contrato atual** do aluno (`students.current_contract_id`), não
  agregado histórico entre todos os contratos já tidos — consistente
  com a regra de "só um contrato ativo por vez" já estabelecida.
- "Pausar contrato" ganhou o par simétrico **"Retomar contrato"**
  (não pedido explicitamente no critério, mas óbvio o suficiente para
  não deixar o admin preso num contrato pausado sem saída).
- "Encerrar contrato" não bloqueia ações nas parcelas restantes
  (registrar pagamento, cancelar, editar vencimento continuam
  disponíveis) — decisão deliberada: um contrato encerrado pode ainda
  ter parcelas em aberto a cobrar/reconciliar.
- Reaproveita `registerInstallmentPayment`/`cancelInstallment`/
  `refundInstallmentPayment` (Fases 5.8/5.9) sem alteração — a aba é
  só a primeira UI que os expõe.
- Testado localmente via Docker/Playwright, fluxo completo em sequência
  no mesmo contrato: registrar pagamento total (resumo atualiza),
  editar vencimento de parcela pendente (próximo vencimento reflete a
  mudança), cancelar parcela futura, estornar o pagamento já registrado
  (parcela volta a `refunded`, total pago volta a zero, valor em aberto
  não conta a parcela estornada como aberta), pausar contrato
  (situação/ações mudam), retomar, e encerrar (situação vira
  "Encerrado", ações de pausar/encerrar somem, só resta trocar/renovar).

## Telas de parcelas e de inadimplentes (Fase 5.13)

- Filtro por aluno usa uma **resolução em duas etapas** (busca
  `students` por nome → `contract_students` pelos ids encontrados →
  filtra `contract_installments` por `contract_id in (...)`) em vez de
  um filtro aninhado de 3 níveis via embed do PostgREST
  (`contracts.contract_students.students.name`), que não é
  confiável/suportado de forma direta pelo supabase-js. Mesma lógica
  para o filtro de plano, com interseção em JS quando os dois filtros
  (aluno + plano) estão ativos ao mesmo tempo.
- Filtros via `searchParams` (GET form), mesmo padrão já usado em
  `/finance/plans` (Fase 5.2) — sem estado client-side, só recarrega a
  página com a URL atualizada.
- Tela de inadimplentes consome a view `overdue_students` (Fase 5.11) e
  resolve "responsável financeiro" por aluno lendo
  `students.current_contract_id` → `contracts.financial_responsible_*`
  (mesma lógica de resolução já usada na Fase 5.6/5.12: `student` mostra
  o próprio nome, `guardian` busca o nome em `guardians`, `other` usa o
  texto salvo em `contracts.notes`).
- "Dias em atraso" calculado em JS a partir de
  `oldest_overdue_due_date` da view — sem coluna nova no banco.
- Links adicionados ao dashboard placeholder (Fase 1.6) só como
  navegação temporária; a Fase 7 substitui esse dashboard por um de
  verdade.
- Testado localmente via Docker/Playwright: filtro por nome de aluno
  (com e sem resultado), aluno com parcela vencida aparecendo
  corretamente na tela de inadimplentes com dias em atraso calculados
  certos (55 dias entre 10/mai e 04/jul) e responsável financeiro
  resolvido corretamente para o tipo `student`.

## Migration de `payment_adjustments` (Fase 5.14)

- Modelagem mínima, sem tela — exatamente como o documento mestre
  autoriza para o MVP 1A ("pode deixar apenas modelado").
- Sem `updated_at`/policy de update: o schema do documento mestre não
  tem coluna `updated_at`, e por natureza é um log de ajustes (append
  only) — só `grant select, insert`, sem update/delete.
- `created_by_user_id` referencia `users` com `on delete set null`
  (preserva o registro do ajuste mesmo se o usuário que o criou for
  removido depois).
- Testado localmente via Docker: insert válido, rejeição de
  `adjustment_type` fora do vocabulário controlado.

## Migration de `graduation_history` (Fase 6.1)

- Trigger `AFTER INSERT` (não Server Action sequencial) — o critério da
  subtarefa exige explicitamente "em uma transação"; um trigger no
  mesmo INSERT garante atomicidade de verdade, ao contrário do padrão
  de chamadas sequenciais usado no módulo financeiro (Fases 5.6/5.8/5.9),
  que não tinha essa exigência. Mesmo padrão da geração automática de
  parcelas (Fase 5.5).
- Trigger não é `SECURITY DEFINER` — roda com o privilégio de quem
  inseriu o registro, então o UPDATE em `students` precisa satisfazer a
  RLS normalmente (já coberto pela policy de update existente desde a
  Fase 1.3).
- Sem grant/policy de `update`/`delete` em `graduation_history` — é um
  histórico, só `select`/`insert`.
- Testado localmente via Docker com usuário autenticado real (não
  service_role): insert de graduação atualizou `current_belt_id`,
  `current_degree` e `last_graduation_date` do aluno corretamente na
  mesma operação.

## Tela "Registrar graduação" e indicadores (Fases 6.2/6.3)

- Formulário organizado por **sistema de faixas** (`belt_systems`, já
  nomeado por modalidade+público como "Jiu-Jitsu Adulto"/"Jiu-Jitsu
  Kids") em vez de um cascata modalidade → público → sistema — evita um
  terceiro nível de seleção quando o nome do sistema já identifica os
  dois primeiros.
- `modality_id` do registro em `graduation_history` é resolvido no
  servidor a partir da faixa escolhida (`belts.belt_system_id →
  belt_systems.modality_id`), não pedido no formulário — o admin só
  escolhe faixa, não precisa escolher modalidade duas vezes.
- "Professor responsável" é opcional e é uma lista de todos os
  professores da escola (não restrito ao professor logado), já que essa
  tela vive em `(admin)` — quem registra é o admin em nome de qualquer
  professor.
- Indicadores (6.3) usam como referência `last_graduation_date` quando
  existe, senão `enrollment_date` (aluno nunca graduado) — nunca ficam
  sem uma data de referência.
- "Presenças desde a última graduação" conta só `status = 'presente'`
  em `attendances` com `class_sessions.date >=` a data de referência —
  são indicadores de apoio, não bloqueiam nem sugerem graduação
  automaticamente (conforme o critério exige).
- Testado localmente via Docker/Playwright: formulário mostra faixa/grau
  atual corretamente, filtra faixas pelo sistema selecionado, grava
  `graduation_history` e atualiza a faixa/grau exibidos via o trigger da
  Fase 6.1; indicadores mostraram corretamente 2 presenças e "2 meses"
  para um aluno matriculado há 64 dias sem graduação prévia.

## Componentes genéricos de dashboard (Fase 7.0)

- `MetricCard`: label + valor, `href` opcional (vira link clicável),
  `variant="destructive"` para métricas de alerta (ex: inadimplentes).
- `SummaryList`: título + lista de itens (`primary`/`secondary`/
  `trailing`), `href` opcional por item, `viewAllHref` opcional no
  cabeçalho, estado vazio com mensagem customizável.
- Ambos client-agnostic (sem "use client") — funcionam tanto em Server
  Components quanto Client Components, já que só usam `next/link` e
  `cn()`, sem estado.
- Testado visualmente via página temporária (removida antes do commit):
  cards com/sem link, variante destructive, lista com itens e lista
  vazia — todos renderizando conforme a paleta Tatame Red.

## Dashboard do administrador (Fase 7.1)

- "Ausentes há 15+ dias" calculado em JS (sem view nova): busca todos os
  alunos ativos + todas as presenças `presente`, reduz para o último
  `class_sessions.date` por aluno, e compara com `enrollment_date` para
  quem nunca compareceu — evita GROUP BY complexo via supabase-js.
- Cards e listas usam contagens separadas: a lista de inadimplentes
  mostra só os 5 primeiros, mas o card usa uma contagem `head: true`
  independente para não subestimar o total.
- Embed ambíguo em `graduation_history` (duas FKs para `belts`) resolvido
  com hint `belts!new_belt_id(name)`.
- Mantidos os links de navegação rápida já existentes abaixo dos cards
  novos (não removidos) — ainda úteis até a Fase 8.
- Testado localmente via Docker/Playwright com cenário cobrindo todos os
  10 cards e as 6 listas simultaneamente (aluno com presença hoje +
  pagamento do mês + graduação recente + turma do dia; aluno com parcela
  vencida há 55 dias): todos os valores calculados bateram com o
  esperado manualmente.

## Dashboard do professor (Fase 7.2)

- "Acesso rápido à chamada" já estava coberto desde a Fase 3.3
  (`OpenSessionButton` dentro de `TodaysClasses`) — não duplicado aqui.
- **`teachers` e `users` não têm FK entre si** (decisão da Fase 2.5:
  ficha de professor separada do login) — o professor logado é
  resolvido por `teachers.email = profile.email`. Se não houver ficha
  de professor com esse e-mail, "últimas chamadas" e "observações
  recentes" ficam vazias (sem quebrar a página).
- "Alunos recentes" é escopo da escola inteira (não só alunos do
  professor) — não há relação direta aluno↔professor além de
  `main_teacher_id`, e o critério não especifica o filtro.
- "Observações recentes" usa `attendances.student_notes` filtrado pelas
  sessões cujo `actual_teacher_id` é o professor logado.
- Testado localmente via Docker/Playwright logado como professor: as
  três listas novas renderizam corretamente em estado vazio, sem erros.

## Dashboard financeiro dedicado (Fase 7.3)

- Tela própria `/finance/dashboard` (não reaproveita o dashboard admin)
  — critério pede "tela própria dentro do módulo financeiro".
- "Valor em aberto" é `sum(remaining_amount)` de todas as parcelas
  pendentes/parciais (não escopado ao mês, diferente de "receita
  prevista/recebida" que são mensais) — reflete o saldo total em aberto
  no momento.
- "Parcelas vencidas" conta parcelas individuais (não alunos únicos,
  diferente do card "Alunos inadimplentes").

## Schema de banco (Fase 1+)

- **SQL puro via Supabase CLI** (`supabase/migrations`), sem ORM (Drizzle
  descartado). Motivo: alinhamento mais direto com RLS nativo do Supabase e
  com a estrutura de pastas já sugerida no documento mestre do projeto.

## Paleta visual (Fase 0.7)

- **Opção 1 — Tatame Red**: preto profundo (`#0B0B0F`), grafite
  (`#18181B`), cinza (`#27272A`), branco suave (`#F4F4F5`), vermelho tatame
  (`#C8102E`). Escolhida por ser a estética mais alinhada à identidade de
  "escola de luta" descrita no documento mestre (seção 15).

## Instrumentação de audit_logs completa (Fase 7.4)

- Presença: `markPresent`/`removeAttendance` (`modules/attendance/actions.ts`)
  instrumentados, completando a cobertura das 6 categorias exigidas.
- Testado localmente: insert autenticado em `audit_logs` respeitando RLS.

## Seeds de demonstração completos (Fase 7.5)

- `supabase/seed.sql` reescrito com um bloco PL/pgSQL (`do $$ ... $$`)
  em vez de INSERTs individuais — muito mais compacto para gerar 30
  alunos/contratos/parcelas com variação de status via loop.
- Escola piloto criada via insert simples em `schools` — unidade,
  modalidades, faixas e contas financeiras vêm de graça pelo trigger
  `create_default_school_setup` (Fases 1.2/2.1/2.2/5.3).
- **Limitação conhecida**: `attendances.registered_by_user_id` é
  `not null` com FK para `users`, mas nenhum usuário existe ainda num
  `db reset` do zero (login é criado depois, via onboarding/criação de
  professor). O seed detecta isso (`if v_admin_user_id is not null`) e
  pula presenças nesse caso, sem quebrar o resto do seed. Para ter
  presenças de demonstração, criar o login admin primeiro e então
  inserir presenças manualmente (ou re-rodar só esse trecho) — não é
  possível fazer isso em uma única passada de `db reset` sem também
  criar `auth.users` via SQL puro, fora de escopo desta subtarefa.
- Testado localmente via `supabase db reset` (aplica todas as
  migrations + seed do zero): 30 alunos, 24 contratos, 72 parcelas
  (3 por contrato, com 1/3 vencida, 1/3 parcial, 1/3 paga), 5 turmas,
  8 planos, 15 graduações — todos os contadores bateram com o
  esperado. Logins de demonstração (`admin@nexusdojo.dev`,
  `professor@nexusdojo.dev`, senha `TestSenha123!`) recriados
  manualmente após o reset, e 30 presenças inseridas manualmente para
  completar o cenário de demonstração.

## Ficha do aluno em abas (pós-MVP 1B)

- `/students/[id]/edit` tinha 5 seções empilhadas em coluna única
  (dados pessoais, responsáveis, financeiro, graduação, frequência),
  exigindo scroll longo para chegar às últimas. Reorganizado em abas
  via novo primitivo `components/ui/tabs.tsx` (`@base-ui/react/tabs`)
  + `student-edit-tabs.tsx`, seguindo o mesmo padrão de wrapper fino
  já usado em `button.tsx`. Nenhuma query mudou — é reorganização
  visual pura; cada aba mantém seu próprio fluxo de salvar.
- Painéis usam `keepMounted` (todas as abas ficam no DOM, só
  escondidas via CSS) para não perder edição em andamento se o
  usuário trocar de aba sem salvar.
- **Bug de plataforma encontrado**: `TabsTab` do base-ui não expõe
  `data-selected` (só `data-active`, que é sobre interação/pressed,
  não seleção). O destaque visual da aba corrente usa `aria-selected`
  (padrão ARIA, sempre presente) em vez de um data-attribute
  específico do base-ui.
- Cabeçalho da página ("Editar aluno" + botão "Associar plano")
  continua fixo, fora das abas.
- Testado no navegador: troca de aba preserva conteúdo (`keepMounted`
  confirmado editando um campo, trocando de aba e voltando), destaque
  visual correto, e lista de abas rola horizontalmente em mobile
  (390×844) sem quebrar o layout.

## Scroll independente entre sidebar e conteúdo (pós-MVP 1B)

- O `AppShell` usava `min-h-screen` no container raiz, deixando a
  altura crescer junto com o conteúdo — o documento inteiro rolava
  (sidebar e conteúdo principal juntos), e o fim de listas longas
  (ex: `/students` com 30+ registros) ficava inacessível, com o
  rodapé da sidebar ("Sair") empurrado para muito abaixo da viewport.
- Corrigido com `h-dvh` + `overflow-hidden` no container raiz, e
  `aside`/`main` cada um com seu próprio `overflow-y-auto`.
  **Armadilha de CSS encontrada**: o `flex-1` que existia no mesmo
  elemento tem `flex-basis: 0%`, que anula a altura fixa de `h-dvh`
  dentro de um container flex-column (o `body`) — teve que ser
  removido. Também foi necessário `min-h-0` em `aside`/`main`, porque
  flex items têm `min-height: auto` por padrão, o que impede o
  encolhimento necessário para o scroll interno funcionar.
- Vale para todo o sistema autenticado (admin, professor, tela de
  chamada), já que todos compartilham o mesmo `AppShell`.
- **Cuidado ao verificar**: uma aba do navegador aberta antes dessa
  mudança pode continuar mostrando o comportamento antigo mesmo após
  o deploy, porque o Next.js App Router cacheia a navegação
  client-side (Router Cache) por aba — é necessário hard refresh
  (`Ctrl+Shift+R`) ou reabrir a aba para ver a correção.

## Paginação em todos os grids de listagem (pós-MVP 1B)

- Nenhuma tela de listagem tinha limite de registros — grids maiores
  (30+ alunos, 70+ parcelas) só podiam ser vistos rolando
  indefinidamente. Adicionado `lib/pagination.ts` (`PAGE_SIZE = 20`,
  `parsePage`, `getRange`) e `components/ui/pagination.tsx` — um
  componente **server-rendered** (só links com querystring `?page=N`,
  sem JS de cliente, já que a única interação é navegar).
- Aplicado via `.select(..., { count: "exact" })` + `.range()` em:
  `students`, `teachers`, `leads`, `modalities`, `classes`,
  `classes/sessions`, `finance/plans`, `finance/price-tables`,
  `finance/installments`, `finance/overdue`, `students/birthdays`.
- Cada página preserva os filtros já existentes na querystring (busca,
  status, mês, plano, forma de pagamento) — testado em
  `finance/installments` com filtro `status=pending` mantendo o
  filtro ao trocar de página.
- **Deixado de fora, deliberadamente**: `app/(admin)/belts` —
  sistemas de faixa e faixas por sistema são um catálogo pequeno e
  estável (não cresce como alunos/parcelas); paginar ali seria
  complexidade sem necessidade real.
- `finance/overdue` e `finance/installments` são os casos mais
  delicados: a view `overdue_students` e a query de
  `contract_installments` recebem o `.range()` diretamente, e os
  lookups dependentes (students/contracts/guardians em `overdue`,
  resolução de `contractIdsFilter` em `installments`) continuam
  operando sobre o conjunto completo antes do corte de página, sem
  afetar a paginação em si.
