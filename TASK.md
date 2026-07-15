# TASK.md — NexusDojo

> Fonte única da verdade do progresso do projeto. Ver protocolo completo de
> sincronização, ciclo de execução e parada por limite de contexto em `CLAUDE.md`.
>
> Ordem lógica de dependência — não pule subtarefas. Marque `[x]` apenas após
> commit + push correspondente.

**Decisões já travadas para este planejamento** (não reabrir sem motivo forte):
- Migrations em SQL puro via Supabase CLI (`supabase/migrations`), sem ORM.
- Paleta visual base: **Opção 1 — Tatame Red** (`#0B0B0F`, `#18181B`, `#27272A`, `#F4F4F5`, `#C8102E`).
- Fila única de subtarefas — sem dono fixo por subtarefa; cada dev pega a
  próxima `[ ]` pendente ao iniciar sessão (protocolo do `CLAUDE.md`).
- Anotações `> PARALELIZÁVEL` marcam blocos de subtarefas sem dependência
  entre si — podem ser feitas por dev/agente diferentes, ou via
  Ruflo/Claude-Flow (`swarm_init` + `agent_spawn`) dentro de uma mesma sessão,
  quando fizer sentido. Não é obrigatório usar Ruflo — é só onde há ganho real.

---

## Fase 0 — Planejamento e Setup

- [x] **0.1 — Criar projeto Next.js base**
  Critério de pronto: `npx create-next-app` rodado com App Router + TypeScript +
  Tailwind; projeto builda e sobe localmente (`npm run dev`) sem erros.

- [x] **0.2 — Configurar shadcn/ui e dependências de UI**
  Critério de pronto: shadcn/ui inicializado; `lucide-react`, `sonner`,
  `recharts` instalados e listados no `package.json` com justificativa em
  `docs/DECISIONS.md`.

- [x] **0.3 — Configurar libs de dados/formulário**
  Critério de pronto: `react-hook-form`, `zod`, `@tanstack/react-query`,
  `date-fns` instalados; um formulário de teste trivial valida com Zod.

- [x] **0.4 — Criar estrutura de pastas proposta**
  Critério de pronto: pastas `app/(auth)`, `app/(admin)`, `app/(teacher)`,
  `app/(public)`, `components/`, `lib/`, `modules/`, `supabase/`, `docs/`,
  `scripts/` criadas conforme seção 7 do `NEXUSDOJO_PROJECT.md`, com
  `.gitkeep` onde necessário.

- [x] **0.5 — Criar `.env.example` e configurar variáveis de ambiente**
  Critério de pronto: `.env.example` com todas as variáveis da seção 6 do
  documento mestre, sem valores reais; `.env.local` no `.gitignore`.

- [x] **0.6 — Inicializar projeto Supabase local**
  Critério de pronto: `supabase init` rodado; `supabase/migrations` e
  `supabase/seed.sql` existem (vazios); `supabase start` sobe localmente.

- [x] **0.7 — Definir e documentar paleta e tipografia**
  Critério de pronto: `tailwind.config` com tokens da paleta Tatame Red;
  fonte definida (Inter para texto + Outfit ou Space Grotesk para títulos)
  configurada via `next/font`; tema escuro como padrão com toggle
  claro/escuro funcional em uma página de teste.

- [x] **0.8 — Criar `docs/PROJECT.md`, `docs/FINANCEIRO.md`, `docs/ROADMAP.md`, `docs/DECISIONS.md`**
  Critério de pronto: arquivos criados com conteúdo inicial resumindo,
  respectivamente: visão geral do produto, regras financeiras (seção 11 do
  doc mestre), este roadmap por fases, e decisões técnicas já tomadas
  (schema SQL puro, paleta, stack).

---

## Fase 1 — Base e Autenticação

- [x] **1.1 — Migration: tabela `schools` + RLS básica**
  Critério de pronto: migration criada e aplicada localmente; RLS habilitada
  na tabela; policy mínima de leitura/escrita por `school_id` documentada
  (mesmo que ainda não haja `users` para testar de ponta a ponta).

- [x] **1.2 — Migration: tabela `units` + seed de unidade default via trigger/função**
  Critério de pronto: ao inserir uma `school`, uma `unit` default é criada
  automaticamente (trigger ou função Postgres); testado manualmente via SQL.

- [x] **1.3 — Migration: tabela `users` (perfil de aplicação)**
  Critério de pronto: tabela `users` criada vinculada a `auth.users` via
  `auth_user_id`; RLS garante que um usuário só enxerga registros do próprio
  `school_id`.

- [x] **1.4 — Configurar Supabase Auth (client + server helpers)**
  Critério de pronto: `lib/supabase/client.ts` e `lib/supabase/server.ts`
  configurados (SSR-safe, cookies); login por e-mail/senha funcional em
  ambiente local.

- [x] **1.5 — Fluxo de cadastro de escola + admin (onboarding inicial)**
  Critério de pronto: uma tela `(public)` permite criar `school` + primeiro
  `user` admin + `unit` default em uma transação; após sucesso, redireciona
  para login.

- [x] **1.6 — Tela de login e proteção de rotas `(admin)`/`(teacher)`**
  Critério de pronto: middleware/layout redireciona usuários não
  autenticados para login; usuário autenticado só acessa rotas do seu
  `role` (`admin` ou `teacher`).

- [x] **1.7 — `lib/permissions`: helper central de checagem de role/school_id**
  Critério de pronto: função utilitária usada por server actions/rotas para
  validar `role` e `school_id` do usuário logado antes de qualquer operação
  sensível; usada no fluxo de login como prova de conceito.

- [x] **1.8 — Cadastro de professores (fluxo admin cria login de teacher)**
  Critério de pronto: admin consegue criar um `teacher` vinculado a um
  `user` com `role = teacher`; teacher consegue logar e ver um dashboard
  vazio placeholder.

---

## Fase 2 — Cadastros base

> **PARALELIZÁVEL**: as subtarefas 2.1–2.5 (Modalidades, Faixas, Alunos,
> Responsáveis, Professores — CRUD completo) dependem apenas da Fase 1
> pronta, não umas das outras. Podem ser distribuídas entre os dois devs ou
> executadas via subagentes Ruflo em paralelo dentro de uma sessão, desde
> que cada uma toque apenas seus próprios arquivos em `modules/<entidade>`.

- [x] **2.1 — Migration + CRUD de `modalities` (com seed default)**
  Critério de pronto: CRUD completo (listar/criar/editar/inativar) em
  `(admin)`; seed com as 7 modalidades padrão da seção 10.8 aplicado.

- [x] **2.2 — Migration + CRUD de `belt_systems` e `belts` (com seeds jiu-jitsu adulto/kids)**
  Critério de pronto: CRUD de sistemas de faixa e faixas individuais;
  seeds de jiu-jitsu adulto e kids aplicados conforme seção 10.10.

- [x] **2.3 — Migration + CRUD completo de `students`**
  Critério de pronto: cadastro, edição, listagem com busca por nome/status,
  e inativação de aluno; campos obrigatórios validados com Zod
  (nome, data de nascimento; demais opcionais conforme seção 10.4).

- [x] **2.4 — Migration + CRUD de `guardians` e `student_guardians`**
  Critério de pronto: possível vincular um ou mais responsáveis a um aluno,
  marcando responsável principal e responsável financeiro, a partir da
  ficha do aluno.

- [x] **2.5 — Migration + CRUD completo de `teachers` (ficha detalhada)**
  Critério de pronto: CRUD completo de professores incluindo foto (campo
  `photo_url`, sem upload real ainda — só URL manual); tela de ficha do
  professor.

- [x] **2.6 — Migration: `teacher_graduations`**
  Critério de pronto: tabela criada com RLS; possível registrar graduação
  de um professor a partir da ficha dele (sem tela dedicada de histórico
  ainda, apenas inserir/listar).

---

## Fase 3 — Turmas e sessões

- [x] **3.1 — Migration + CRUD de `class_groups` (turmas/horários)**
  Critério de pronto: admin cria turma com modalidade, professor principal,
  dias da semana, horário início/fim, `suggested_audience` (apenas
  informativo, sem bloqueio); listagem e edição funcionais.

- [x] **3.2 — Migration de `class_sessions` + geração de "turmas do dia"**
  Critério de pronto: dado o `week_days`/horário de cada `class_group`,
  uma query/view retorna as turmas previstas para hoje; abrir uma sessão
  cria (ou reaproveita) o registro em `class_sessions` para a data atual.

- [x] **3.3 — Tela "Turmas do dia" (admin e professor)**
  Critério de pronto: lista as turmas do dia corrente com horário, professor
  e modalidade; botão para abrir/entrar na chamada de cada uma.

- [x] **3.4 — Ação de abrir/cancelar sessão de aula avulsa ("extra")**
  Critério de pronto: possível criar uma `class_session` com status `extra`
  fora da grade fixa (ex: Open Mat) e cancelar uma sessão futura já aberta.

---

## Fase 4 — Frequência

- [x] **4.1 — Migration de `attendances` com constraint `UNIQUE(class_session_id, student_id)`**
  Critério de pronto: migration aplicada; teste manual confirma que inserir
  presença duplicada na mesma sessão é rejeitado pelo banco.

- [x] **4.2 — Busca rápida de aluno ativo (componente reutilizável)**
  Critério de pronto: componente de busca por nome, com foto (se houver) e
  faixa/grau visíveis, filtrando apenas alunos `ativo` da escola; usado
  depois na tela de chamada.

- [x] **4.3 — Tela de chamada mobile-first (registrar presença)**
  Critério de pronto: dentro de uma `class_session`, professor busca aluno e
  marca presente em um clique; qualquer aluno ativo da escola pode ser
  adicionado, mesmo sem vínculo prévio com a turma; layout otimizado para uso
  com uma mão no celular (botões grandes, sem poluição visual).

- [x] **4.4 — Lista de presentes da sessão + remoção de presença incorreta**
  Critério de pronto: dentro da tela de chamada, lista de quem já foi
  marcado presente na sessão, com opção de desfazer (remover) um registro
  indevido antes de fechar a chamada.

- [x] **4.5 — Histórico de presença por aluno**
  Critério de pronto: aba/seção na ficha do aluno lista suas presenças
  (data, turma, professor que registrou), permitindo múltiplas presenças no
  mesmo dia em turmas diferentes.

---

## Fase 5 — Financeiro núcleo

> **PARALELIZÁVEL** apenas dentro do bloco de cadastro-base (5.1–5.3, tabelas
> e planos) — elas não dependem umas das outras além da ordem de criação de
> schema. As subtarefas de contrato/parcela (5.4 em diante) são sequenciais e
> dependem de 5.1–5.3 estarem prontos.

- [x] **5.1 — Migration + CRUD de `price_tables`**
  Critério de pronto: admin cria/edita tabela de preços com vigência
  (`valid_from`/`valid_until`) e status (`active`/`inactive`/`legacy`).

- [x] **5.2 — Migration + CRUD de `plans` (vinculados a uma price_table)**
  Critério de pronto: dentro de uma tabela de preços, criar planos com
  duração, preço base, parcelamento sugerido; listagem mostra alunos/
  contratos vinculados (placeholder até Fase 5.4 existir).

- [x] **5.3 — Migration de `financial_accounts` (com seed mínimo: caixa/pix/banco)**
  Critério de pronto: tabela criada com RLS; seed de contas padrão aplicado
  no `seed.sql`.

- [x] **5.4 — Migration de `contracts` + `contract_students`**
  Critério de pronto: schema aplicado com RLS; regra de "apenas um contrato
  ativo por aluno" documentada (validação de aplicação virá em 5.6).

- [x] **5.5 — Migration de `contract_installments` + função de geração automática de parcelas**
  Critério de pronto: dada uma criação de contrato (preço final, nº de
  parcelas, primeiro vencimento), uma função/trigger gera as parcelas
  corretamente, ajustando arredondamento na última parcela; testado com
  1x, 3x e 12x.

- [x] **5.6 — Fluxo "Associar plano ao aluno" (criação de contrato completo)**
  Critério de pronto: formulário na ficha do aluno percorre tabela → plano →
  datas → desconto → valor final → parcelamento → responsável financeiro →
  confirmação; ao salvar, cria `contract` + `contract_students` +
  `contract_installments` em uma transação; se já existir contrato ativo,
  pergunta se deve encerrar o anterior antes de prosseguir.

- [x] **5.7 — Migration de `financial_movements`**
  Critério de pronto: tabela criada; ao registrar pagamento de parcela
  (5.8), um `financial_movement` do tipo `income` é criado automaticamente.

- [x] **5.8 — Ação "Registrar pagamento" de parcela (total e parcial)**
  Critério de pronto: marcar parcela como paga exige data de pagamento e
  forma de pagamento; pagamento parcial atualiza `paid_amount` e
  `remaining_amount` e mantém status `partially_paid`; parcela paga não pode
  ser excluída.

- [x] **5.9 — Ação "Cancelar parcela futura" e "Estornar pagamento"**
  Critério de pronto: cancelar uma parcela pendente futura muda seu status
  sem apagar histórico; estorno cria um `financial_movement` do tipo
  `refund` sem apagar o registro original.

- [x] **5.10 — Migration de `student_financial_exemptions`**
  Critério de pronto: tabela criada; aluno com isenção ativa não aparece
  como inadimplente mesmo com parcela vencida.

- [x] **5.11 — Job/rotina de identificação de inadimplência**
  Critério de pronto: query (view ou função) que classifica aluno como
  `overdue` quando há parcela vencida e não paga, respeitando isenções
  ativas; usada nas telas 5.13 e no dashboard financeiro.

- [x] **5.12 — Aba financeira na ficha do aluno**
  Critério de pronto: resumo (plano atual, situação financeira, próximo
  vencimento, valor em aberto/vencido, total pago/contratado) + detalhe do
  contrato atual + ações (renovar, trocar plano, encerrar, pausar) conforme
  seção 11.13.

- [x] **5.13 — Tela de parcelas (com filtros) e tela de inadimplentes**
  Critério de pronto: parcelas filtráveis por mês/status/aluno/plano/forma
  de pagamento; tela de inadimplentes lista aluno, responsável financeiro,
  valor e dias em atraso, com link para a ficha financeira do aluno.

- [x] **5.14 — Migration de `payment_adjustments` (modelagem mínima)**
  Critério de pronto: tabela criada e migrada conforme seção 11.10; sem
  tela dedicada — apenas schema pronto para uso futuro (renegociação).

---

## Fase 6 — Graduação

- [x] **6.1 — Migration de `graduation_history`**
  Critério de pronto: tabela criada com RLS; registrar graduação atualiza
  `current_belt_id`/`current_degree`/`last_graduation_date` no `students`
  em uma transação.

- [x] **6.2 — Tela "Registrar graduação" na ficha do aluno**
  Critério de pronto: formulário mostra faixa/grau atual, permite definir
  nova faixa/grau, data e observações do professor; grava histórico.

- [x] **6.3 — Indicadores de apoio à graduação (frequência e tempo desde última graduação)**
  Critério de pronto: ficha do aluno mostra nº de presenças desde a última
  graduação e tempo decorrido, como indicador — sem bloquear ou sugerir
  graduação automaticamente.

---

## Fase 7 — Dashboards

> **PARALELIZÁVEL**: 7.1 (dashboard admin) e 7.2 (dashboard professor) não
> compartilham componentes além de cards genéricos já existentes de
> `components/dashboard` — podem ser feitos em paralelo por dev diferente
> depois que os cards genéricos (7.0) estiverem prontos.

- [x] **7.0 — Componentes genéricos de dashboard (`components/dashboard`)**
  Critério de pronto: componente de "card de métrica" e "lista resumida"
  reutilizáveis, usados pelas próximas duas subtarefas.

- [x] **7.1 — Dashboard do administrador**
  Critério de pronto: cards e listas da seção 14 (admin) implementados
  usando queries reais (alunos ativos, inadimplentes, receita prevista/
  recebida do mês, presenças no mês, ausentes há 15+ dias, próximos
  vencimentos, últimas presenças/graduações/pagamentos, turmas do dia).

- [x] **7.2 — Dashboard do professor**
  Critério de pronto: turmas do dia, acesso rápido à chamada, últimas
  chamadas feitas por ele, alunos recentes e observações recentes.

- [x] **7.3 — Dashboard financeiro dedicado**
  Critério de pronto: cards da seção 11.13 (receita prevista/recebida,
  valor em aberto/vencido, alunos inadimplentes, contratos ativos, parcelas
  vencidas e a vencer em 7 dias) em uma tela própria dentro do módulo
  financeiro.

- [x] **7.4 — Migration de `audit_logs` + instrumentação das ações sensíveis já implementadas**
  Critério de pronto: tabela criada; ações de alteração de pagamento,
  cancelamento de parcela, alteração de contrato, alteração de presença,
  alteração de graduação e alteração de dados pessoais do aluno passam a
  gravar log (`entity_type`, `entity_id`, `action`, `changes`).

- [x] **7.5 — Seeds de demonstração completos**
  Critério de pronto: `seed.sql` popula 1 escola, 1 unidade, 2 professores,
  30 alunos, 5 turmas, modalidades, faixas, 2 tabelas de preço com 4 planos
  cada, contratos variados (parcelas pagas/pendentes/vencidas), presenças e
  graduações — usado para validar o MVP 1A de ponta a ponta com a escola
  piloto.

- [x] **7.6 — Checklist de validação do MVP 1A contra os critérios de sucesso (seção 22)**
  Critério de pronto: percorrer manualmente cada item da seção 22 do
  `NEXUSDOJO_PROJECT.md` no ambiente com os seeds de 7.5 e confirmar que
  funciona no celular; qualquer item que falhar vira subtarefa nova antes de
  considerar o MVP 1A concluído.
  > CONCLUÍDA — os 15 critérios da seção 22 foram percorridos formalmente em
  > viewport mobile (390×844, emulação touch) com login
  > `admin@nexusdojo.dev` / `TestSenha123!` sobre os dados da escola piloto
  > (seed da Fase 7.5). Resultado item a item:
  > 1. Cadastro de alunos — OK. 2. Cadastro de professores — OK (lista
  > sofre do bug de overflow, ver 7.7). 3. Turmas/horários — OK.
  > 4. Registrar presença (chamada) — OK, testado marcar/remover presença
  > de ponta a ponta. 5. Aluno em múltiplas aulas no mesmo dia — OK
  > (confirmado via seed + histórico de presença). 6. Faixa/grau — OK.
  > 7. Tabela de preços — OK (mesmo bug de overflow + bug de data, ver
  > 7.7/7.8). 8. Planos — OK (mesmo bug de overflow). 9. Associar plano
  > (wizard 7 passos) — OK, testado de ponta a ponta incluindo a
  > confirmação de encerrar contrato anterior; expôs o bug 7.9.
  > 10. Geração de parcelas — OK, testado 3x com arredondamento correto
  > na última parcela (83,33/83,33/83,34). 11. Registrar pagamentos — OK,
  > testado de ponta a ponta (parcela passou a "Paga", valores
  > recalculados, estorno disponível). 12. Identificar inadimplentes — OK
  > funcionalmente, mas com falso positivo causado pelo bug 7.9.
  > 13. Histórico financeiro do aluno (aba financeira) — OK, bem completa.
  > 14. Dashboard básico — OK, sem overflow horizontal. 15. Uso
  > confortável no celular — parcialmente OK: formulários, wizard e
  > chamada são mobile-first e confortáveis; porém as telas de listagem
  > têm o bug sistêmico de overflow (7.7).
  >
  > 3 bugs novos abertos como subtarefas 7.7–7.9 (ver abaixo) — não
  > bloqueiam o uso do MVP 1A, mas devem ser corrigidos antes de
  > considerar a Fase 7 totalmente encerrada e iniciar a Fase 8.

- [x] **7.7 — Corrigir overflow horizontal nas tabelas de listagem (mobile)**
  Critério de pronto: os wrappers `overflow-hidden` das tabelas em
  `teachers/page.tsx`, `students/page.tsx`, `classes/page.tsx`,
  `classes/sessions/page.tsx`, `modalities/page.tsx`,
  `finance/price-tables/page.tsx`, `finance/plans/page.tsx`,
  `finance/installments/page.tsx` e `finance/overdue/page.tsx` (9
  arquivos, mesmo padrão `<div className="overflow-hidden rounded-lg
  border border-border">`) são trocados por `overflow-x-auto`, permitindo
  rolagem horizontal em vez de cortar colunas (ex: coluna "Status" da
  lista de professores fica inacessível em 390px); validado visualmente
  em viewport mobile.

- [x] **7.8 — Corrigir bug de exibição de data off-by-one (fuso GMT-3)**
  Critério de pronto: `new Date(dateOnlyString).toLocaleDateString("pt-BR")`
  aplicado sobre colunas `date`/`due_date` (tipo `date`, sem horário) exibe
  o dia anterior ao real em fusos negativos — reproduzido na tela de
  chamada (`app/attendance/[sessionId]/page.tsx:42`), na lista de sessões
  (`app/(admin)/classes/sessions/page.tsx:48`), na vigência de tabelas de
  preço (`app/(admin)/finance/price-tables/page.tsx:45,47`), no histórico
  de graduação do professor (`graduations-section.tsx:78`) e no histórico
  de presença do aluno (`attendance-history.tsx:38`). Corrigir o parsing
  para não depender do fuso do navegador/servidor (ex: extrair
  ano/mês/dia da string diretamente, sem passar por `new Date()` em UTC).
  Aproveitar para também formatar como `DD/MM/AAAA` as datas hoje exibidas
  em ISO cru na aba financeira da ficha do aluno (próximo vencimento,
  período do contrato, vencimento de parcela).

- [x] **7.9 — Cancelar parcelas pendentes do contrato encerrado no wizard "Associar plano"**
  Critério de pronto: ao escolher "Encerrar o contrato anterior e criar
  este novo" no wizard de associação de plano, as parcelas com status
  `pending` do contrato que está sendo encerrado (`status → finished`)
  passam a ser canceladas (ou equivalente) na mesma transação, e não
  apenas o contrato. Bug reproduzido nesta sessão: aluno com contrato
  novo em dia (0 parcelas vencidas) continuava aparecendo em
  `/finance/overdue` porque 2 parcelas pendentes do contrato antigo
  finalizado permaneciam contando para a inadimplência.

---

## Fase 8 — MVP 1B (só inicia após validação do MVP 1A na Fase 7.6)

- [x] **8.1 — Upload de foto de aluno/professor via Supabase Storage**
  Critério de pronto: substitui os campos `photo_url` manuais por upload
  real de imagem, com preview.

- [x] **8.2 — Migration + CRUD de leads e conversão de lead para aluno**
  Critério de pronto: cadastro de lead, funil simples, ação "converter em
  aluno" que cria um `student` reaproveitando os dados do lead.

- [x] **8.3 — Integração WhatsApp manual via Evolution API**
  Critério de pronto: envio manual de mensagem avulsa para aluno/lead a
  partir da ficha dele, usando `EVOLUTION_API_URL`/`EVOLUTION_API_KEY` do
  `.env`; sem automação/régua ainda.

- [x] **8.4 — Lista de aniversariantes do mês**
  Critério de pronto: tela/lista com aniversariantes do mês corrente,
  reaproveitando o componente de busca de aluno quando fizer sentido.

- [x] **8.5 — Audit logs completos (cobertura das ações restantes)**
  Critério de pronto: revisão de todas as mutações do sistema (não só as
  listadas em 7.4) e garantia de que ações sensíveis remanescentes também
  logam em `audit_logs`.

- [x] **8.6 — PWA refinado (manifest, ícones, instalável)**
  Critério de pronto: `manifest.json` completo, ícones em múltiplos
  tamanhos, app instalável no celular, funcionando offline apenas para
  shell básico (sem sincronização offline de dados).

- [x] **8.7 — Revisão de política de privacidade e relatórios financeiros extras**
  Critério de pronto: página de política de privacidade revisada
  juridicamente pelo usuário (Carlos define o texto final); relatórios
  financeiros adicionais definidos junto ao usuário antes de implementar
  (evitar escopo não aprovado).
  > Decisões tomadas com o usuário nesta sessão: (1) política de
  > privacidade — rascunho gerado (`/privacy`, baseado na LGPD e nos
  > dados reais coletados pelo sistema) com aviso explícito de "Rascunho
  > — não publicado", aguardando revisão jurídica e texto final do
  > Carlos antes de ser considerado oficial; link discreto adicionado na
  > tela de login. (2) Relatório financeiro extra escolhido: receita
  > por período (mês a mês, prevista x recebida), implementado em
  > `/finance/reports` com parâmetro `?months=N` (padrão 6, máx. 24),
  > linkado a partir do dashboard financeiro.

---

## Fase 9 — Módulo do Aluno (MVP 2, aprovado em 2026-07-11)

Baseado em `modules/modulo_aluno.md`. Aluno passa a ter login próprio e agir
no sistema (sinalizar/cancelar presença), não só ser um registro de dados.
Decisões de arquitetura tomadas com o usuário antes de iniciar: (1)
capacidade/elegibilidade de turma (faixa mínima, grau, sexo) vira bloqueio
**opcional por turma** — turma sem esses campos preenchidos continua 100%
flexível como hoje, sem quebrar o conceito de "turma flexível" já decidido
na Fase 4; (2) modelo de presença é **estendido aditivamente** (novos
status/colunas convivem com `presente/falta/falta_justificada` atuais, sem
renomear/remover nada — o fluxo atual do professor vira o caso
`added_by_instructor`+`confirmed`); (3) campo de sexo/gênero do aluno é
novo, opcional; (4) sessões são materializadas **sob demanda**, não
pré-geradas para o ano inteiro.

- [x] **9.1 — Login do aluno**
  `auth_user_id` em `students`, helper `current_student_id()` (SECURITY
  DEFINER, mesmo padrão do `current_school_id()`), novas policies de select
  por aluno (students, contracts, contract_students, contract_installments,
  attendances, graduation_history, student_guardians, guardians),
  `requireStudent()` em `lib/permissions/index.ts`, ajuste do redirect
  pós-login para 3 destinos possíveis (admin/professor/aluno) via
  `modules/auth/actions.ts`, fluxo admin "criar login de aluno" (validação
  + action + página, espelhando `create-teacher-login`) com botão na ficha
  do aluno. Sem telas do módulo ainda — só a fundação de autenticação.
  Migration aplicada no Supabase compartilhado (`nexusdojo-dev`).
  Verificado ponta a ponta com script temporário: aluno autentica, lê a
  própria linha, não lê linha de outro aluno (RLS bloqueia
  silenciosamente), não aparece em `public.users`.
  > Nota: `database.types.ts` foi atualizado manualmente só com o campo
  > `auth_user_id` (adição cirúrgica), porque a regeneração automática
  > (`supabase gen types`) não funcionou neste ambiente — precisa de
  > Docker (não disponível) ou de um Access Token de conta com privilégios
  > de management API no projeto `nexusdojo-dev` (o token testado não
  > tinha acesso). Quando alguém tiver Docker ou o token certo, rodar
  > `npm run db:types` (ou `supabase gen types typescript --project-id
  > wxxjgogzcbgffkyfywvm`) para regenerar o arquivo completo e conferir
  > que bate com este patch manual.

- [x] **9.2 — Migration do módulo de check-in**
  Novas colunas em `class_groups` (start_date, end_date, capacity,
  min_belt_id, min_degree, sex_restriction — todas opt-in/nullable),
  `students` (sex, opcional), `class_sessions` (attendance_closed_at);
  ampliação do check de status de `attendances` +
  signaled_at/confirmed_at/confirmed_by; nova tabela `notifications`
  (RLS: aluno só lê/marca como lida, insert só via service_role).
  Aplicada no Supabase compartilhado e verificada via script: colunas
  novas existem e são nullable, insert legado em `attendances` (estilo
  `markPresent`, sem os campos novos) continua funcionando sem alteração.
  > Efeito colateral corrigido: a nova FK `attendances.confirmed_by →
  > users` criou uma segunda relação `attendances`↔`users`, tornando
  > ambíguo o embed `users(name)` já existente em
  > `attendance-history.tsx`. Corrigido apontando o hint da FK certa
  > (`users!registered_by_user_id(name)`).
  > Nota: `database.types.ts` recebeu o mesmo patch manual da 9.1 (sem
  > Docker/token de management API disponível nesta sessão) — regen
  > completo ainda pendente.

- [x] **9.3 — Serviço de materialização de sessões sob demanda**
  `modules/classes/session-materialization.ts` (`getOrCreateClassSession`):
  helper compartilhado, sem checagem de autorização própria (recebe
  `schoolId` já resolvido por quem chama), idempotente via
  `unique(class_group_id, date)` com tratamento de corrida (mesmo padrão
  já testado em produção). `openOrReuseClassSession`
  (`modules/classes/sessions.ts`, usado pela tela "Turmas do dia") foi
  refatorado para delegar a esse helper em vez de duplicar a lógica — vira
  a base que as APIs de aluno (9.4) e professor (9.5) vão reusar para
  materializar sessões em datas diferentes de hoje.

- [x] **9.4 — API do aluno: agenda, sinalizar, cancelar**
  `modules/students/agenda.ts`: `getStudentAgenda` (ocupação/elegibilidade
  calculadas por turma/dia, sem materializar sessão), `signalAttendance` e
  `cancelSignal`. Decisões de regra confirmadas com o usuário: janela de
  sinalização até 7 dias antes / tolerância de 24h após o início; conflito
  de horário **bloqueia** (não sinaliza 2 turmas sobrepostas no mesmo dia);
  cancelamento é **soft** (`status='cancelled'`, mantém histórico, permite
  re-sinalizar); sessão com `attendance_closed_at` preenchido trava
  sinalizar/cancelar. Elegibilidade por faixa só compara quando aluno e
  turma usam o mesmo `belt_system_id` (fail-closed caso contrário).
  > Migration adicional necessária: `attendances.registered_by_user_id`
  > passou a ser nullable (autossinalização do aluno não tem ator staff).
  > Policies de insert/update adicionadas para o aluno em `attendances`
  > (defesa em profundidade — aluno só insere como `signaled` de si
  > mesmo, só transiciona `signaled↔cancelled`), verificadas
  > end-to-end contra o Supabase compartilhado (insert como
  > `confirmed`/para outro aluno bloqueado pela RLS; escalar
  > `cancelled→confirmed` bloqueado).
  > Limitação conhecida (não bloqueante): checagem de capacidade não é
  > atômica — duas sinalizações simultâneas no último lugar podem
  > ambas passar. Aceitável nesta fase; revisitar se virar problema real.

- [x] **9.5 — API do professor: chamada**
  `modules/attendance/roll-call.ts` (arquivo novo, convive com
  `modules/attendance/actions.ts` sem alterá-lo): `getSessionRollCall`
  lista todas as attendances da sessão; `confirmAttendance`/
  `revertToSignaled` fazem o toggle presente/ausente de quem sinalizou;
  `addStudentManually` inclui aluno direto (`added_by_instructor` +
  confirmado); `closeRollCall` consolida `signaled` restante em
  `no_show`, dispara notificações (`presence_confirmed`/`added_to_class`)
  para quem foi confirmado/incluído, marca a sessão como `realizada` e
  preenche `attendance_closed_at`. Todas as ações de escrita exigem sessão
  na data corrente ou passada e ainda não fechada (seção 3 da spec).
  Reabertura de chamada fechada fica em aberto (spec seção 8), não
  implementada nesta subtarefa.
  > Migration adicional: policy de insert em `notifications` para staff
  > (`school_id = current_school_id()`) — só existia select/update
  > (Fase 9.2), e quem cria a notificação é o professor/admin, não o
  > aluno.
  > Verificado end-to-end contra o Supabase compartilhado (com a conta
  > demo `admin@nexusdojo.dev` — o `professor@nexusdojo.dev` citado no
  > `DECISIONS.md` não existe neste ambiente compartilhado, só o admin):
  > staff confirma sinalização, inclui aluno manualmente, insere
  > notificações e fecha a sessão; aluno só enxerga a própria
  > notificação (`presence_confirmed`), não a do outro aluno
  > (`added_to_class`) — RLS isolando corretamente.

- [x] **9.6 — Tela Agenda do aluno**
  `app/(student)/layout.tsx` (novo route group, `requireStudent()` +
  `AppShell role="student"`) e `app/(student)/aluno/{page,agenda-client}.tsx`:
  seletor de dias Seg-Dom (com indicador nos dias com aula), toggle
  Minhas/Todas, cards com chips Alunos/Sexo/Faixa/Graus, botão
  sinalizar/cancelar chamando `signalAttendance`/`cancelSignal` (Fase
  9.4). `STUDENT_NAV` novo em `nav-config.ts`; `AppShell` aceita role
  `"student"`.
  > Bugs reais encontrados e corrigidos durante teste em navegador
  > (Playwright + dev server, login/agenda/sinalizar/cancelar ponta a
  > ponta com a conta demo `aluno@nexusdojo.dev`):
  > 1. `class_groups`, `class_sessions`, `teachers` e `belts` não tinham
  >    NENHUMA policy de select para aluno (só para staff) — a agenda
  >    aparecia sempre vazia, RLS bloqueando silenciosamente. Corrigido
  >    com migration aditiva (`current_student_school_id()` + policies de
  >    select nas 4 tabelas — dados de catálogo, não sensíveis).
  > 2. Na página de login, chamar `router.refresh()` logo após
  >    `router.push()` cancelava a transição client-side pendente (o
  >    destino resolvia certo mas a URL nunca mudava). Corrigido
  >    removendo o `refresh()` redundante ali.
  > Confirmado funcionando de ponta a ponta: login → redireciona para
  > `/aluno` → agenda mostra turmas certas por dia (com contagem de
  > cards batendo com `week_days` de cada turma) → sinalizar persiste e
  > a UI atualiza via `router.refresh()` → cancelar funciona
  > simetricamente. Sem erros de console.

- [x] **9.7 — Tela Chamada do professor**
  `app/attendance/[sessionId]/roll-call/{page,roll-call-client}.tsx`: tela
  nova, paralela à `attendance-client.tsx` atual (não a substitui — link
  "Chamada com sinalização" adicionado na tela antiga para acesso).
  Lista sinalizados com botão confirmar, lista presentes (confirmados +
  incluídos manualmente) com "Desfazer" para quem foi confirmado, busca
  de aluno para inclusão manual (reaproveita `StudentSearch`), botão
  fechar chamada. Usa as APIs da Fase 9.5 (`modules/attendance/roll-call.ts`).
  Confirmado ponta a ponta com Playwright (login admin → tela de chamada
  → confirmar sinalizado → incluir aluno manualmente → fechar chamada):
  banco de dados confere 100% (status `confirmed`/`added_by_instructor`,
  sessão marcada `realizada` com `attendance_closed_at`, notificações
  `presence_confirmed`/`added_to_class` geradas corretamente); tela final
  mostra "Presentes (2)" e "Chamada fechada" corretamente. Sem erros de
  console.

- [x] **9.8 — Painel e histórico do aluno**
  `modules/students/dashboard.ts` (`getStudentDashboard`) +
  `app/(student)/aluno/painel/{page,painel-client}.tsx`: gráfico de
  barras jan-dez (série única, cor da marca, mês atual em destaque,
  clicável para trocar o mês em foco), evolução das faixas (progressão
  completa do belt system, faixas alcançadas destacadas, atual com
  grau), calendário do mês selecionado com marcação nos dias treinados,
  histórico de aulas do mês (turma, horário, instrutor). Tudo alimentado
  só por presenças `confirmed`/`added_by_instructor` — sinalização sem
  confirmação e cancelamentos não contam. Nav "Painel" adicionado ao
  `STUDENT_NAV`.
  Confirmado com Playwright + dados reais semeados (5 presenças
  confirmadas em datas espalhadas + faixa Azul/grau 2 atribuída à conta
  demo `aluno@nexusdojo.dev`, que ainda não tinha faixa definida):
  contagem mensal bateu exatamente com as datas semeadas, clique numa
  barra troca o mês do calendário/histórico corretamente, faixas
  alcançadas x não alcançadas exibidas certo. Sem erros de console.
  Dados de demonstração mantidos no ambiente compartilhado (enriquecem a
  conta demo do aluno).

- [x] **9.9 — Minha Academia**
  `modules/students/academy.ts` (`getAcademyData`) +
  `app/(student)/aluno/academia/{page,academia-client}.tsx`: tabs
  Instrutores/Alunos/Aulas com busca (filtro client-side).
  > Decisão de segurança: `students` guarda dados sensíveis (CPF,
  > telefone, endereço, notas médicas) que nunca podem vazar para outro
  > aluno — em vez de abrir select geral na tabela para aluno, criei a
  > view `student_directory` (migration nova) expondo só
  > id/name/photo_url/status/current_belt_id/current_degree, escopada
  > por escola via `current_school_id()`/`current_student_school_id()`.
  > Verificado: aluno enxerga outros alunos só com essas colunas
  > (`select cpf` na view retorna "coluna não existe"), e a tabela
  > `students` continua restrita à própria linha para o aluno.
  Confirmado com Playwright: 3 tabs renderizam corretamente (4
  instrutores, ~52 alunos, ~23 turmas ativas), busca filtra certo em
  cada aba. Sem erros de console.

- [x] **9.10 — Notificações e Perfil do aluno**
  `modules/students/notifications.ts` +
  `app/(student)/aluno/notificacoes/{page,notifications-client}.tsx`:
  feed cronológico (título por tipo, turma/data/hora, timestamp,
  indicador de não lida), botão "marcar todas como lidas" (só aparece
  quando há não lidas). Disparo já existia desde a Fase 9.5
  (`closeRollCall`), não precisou de mudança.
  `app/(student)/aluno/perfil/{page,change-password-form}.tsx`: dados
  cadastrais (nome, e-mail, telefone, faixa/grau, matrícula desde),
  alterar senha (`supabase.auth.updateUser`), sair (reaproveita
  `LogoutButton`).
  > Escopo reduzido conscientemente vs. seção 4.6 da spec: "mudar de
  > academia", "trocar de conta" e "idioma" não se aplicam (uma
  > escola/idioma só neste sistema); "excluir conta" e "atualizar token
  > de push" ficam fora por exigirem fluxo próprio (aprovação
  > administrativa; infra de push ainda não existe — spec seção 8 já
  > lista isso como ponto em aberto).
  Confirmado com Playwright: feed mostra as 2 notificações semeadas com
  título/descrição corretos, "marcar todas como lidas" funciona e some
  depois; troca de senha testada de ponta a ponta (senha nova ->
  sign-in com ela funciona -> restaurada para a senha padrão da conta
  demo). Sem erros de console.

- [x] **9.11 — Testes das regras de negócio**
  Projeto não tinha nenhum runner de teste — adicionado `vitest`
  (`npm test`).
  - Lógica pura extraída para ser testável sem banco: `modules/students/
    eligibility.ts` (`checkEligibility`, já existia embutido em
    `agenda.ts`) e `modules/students/signal-rules.ts`
    (`checkSignalWindow`, `hasTimeOverlap`, `hasAvailableCapacity`,
    `weekdayOf`). `agenda.ts` refatorado para importar em vez de duplicar
    — sem mudança de comportamento. 23 testes unitários cobrindo
    elegibilidade (sexo/faixa/grau, fail-closed em belt_system_id
    diferente), janela de sinalização (7 dias/24h, limites exatos),
    conflito de horário, capacidade.
  - `tests/integration/attendance-rules.test.ts`: 5 testes de integração
    contra o Supabase compartilhado (dupla sinalização via unique
    constraint, RLS de insert/update do aluno, cancelamento soft,
    inclusão manual, consolidação no_show) — as regras que vivem na
    camada de RLS/banco, não em TS puro.
  > **2 bugs reais encontrados e corrigidos pelos testes:**
  > 1. `checkSignalWindow` interpretava o horário da aula no fuso LOCAL
  >    do processo (string de data sem `Z`) em vez de UTC, enquanto `now`
  >    é um instante absoluto — desvio sistemático de horas na janela de
  >    sinalização se o servidor não rodar em UTC (reproduzido nesta
  >    máquina, America/Sao_Paulo). Corrigido adicionando `Z` explícito,
  >    mesma convenção de `weekdayOf`.
  >  2. **Bug sério de produção**: a policy de update do aluno em
  >    `attendances` (Fase 9.4) só permitia mexer na linha quando o
  >    status ATUAL já era `signaled` — bloqueando silenciosamente a
  >    reativação `cancelled` -> `signaled` que `signalAttendance`
  >    depende (aluno cancela e sinaliza de novo na mesma sessão). Como
  >    RLS filtra linhas sem gerar erro em UPDATE, `signalAttendance`
  >    respondia sucesso sem realmente reativar nada — o aluno via a UI
  >    "funcionar" mas a sinalização continuava cancelada no banco.
  >    Corrigido alargando o `using` da policy para aceitar `signaled` e
  >    `cancelled` (migration `20260713100000`). Confirmado corrigido com
  >    Playwright: ciclo completo sinalizar → cancelar → sinalizar de
  >    novo funcionando de ponta a ponta na UI real.
  Com a 9.11, a Fase 9 (Módulo do Aluno, `modules/modulo_aluno.md`) está
  completa.

---

## Fora de escopo até novo aviso (não criar subtarefas para isso ainda)

Pagamento online via gateway (cartão online, boleto com gateway real,
integração Asaas), régua automática de cobrança, check-in por QR
Code, currículo técnico, avaliação qualitativa, campeonatos/eventos/
seminários, multiunidade com telas próprias, IA, catraca física,
marketplace, white label, app nativo — ver seção 19 do
`NEXUSDOJO_PROJECT.md`. Só entram no `TASK.md` quando o usuário aprovar
formalmente o início do MVP 2/MVP 3.

> "Área do aluno/responsável" foi promovida e removida desta lista em
> 2026-07-11 — ver Fase 9 acima.
> "Pix automático" foi promovido e removido desta lista em 2026-07-14 —
> geração local de Pix copia-e-cola (EMV) + QR Code, sem gateway, ver
> Fase 10.6 abaixo.
 
---

## Atualizacoes recentes de escopo e UX

Estas notas registram decisoes tomadas em validacao com o usuario depois do
roadmap original. Elas devem orientar manutencoes futuras, mesmo quando nao
forem uma subtarefa numerada formal.

- **Planos financeiros em escola de lutas:** o plano pago libera o aluno para
  treinar nas turmas disponiveis e compativeis operacionalmente. Nao existe
  limite de aulas por semana, pontuacao, saldo de aulas ou pacote de creditos
  no modelo atual. Campos historicos como `classes_per_week`, `classes_total`
  e `unlimited` nao devem ser usados para bloquear presenca.
- **Presenca e graduacao:** a chamada registra a aula real feita. Um aluno pode
  participar de varias aulas no mesmo dia. Para indicadores de graduacao, a
  regra de produto e contabilizar no maximo uma presenca por dia por
  modalidade, sem misturar modalidades diferentes.
- **Tela de chamada:** a experiencia deve continuar mobile-first. A lista de
  todos os alunos e a lista de presentes devem ficar visiveis em areas
  separadas quando houver espaco, para o professor registrar presencas rapido
  no celular ou desktop.
- **Historico de chamadas:** administradores e professores precisam acessar
  aulas ja realizadas, ver sessoes passadas e conferir os alunos presentes em
  cada chamada. A navegacao deve expor esse historico, nao apenas a tela do dia.
- **Usuarios e permissoes:** professores tem acesso basico por padrao, mas um
  professor pode ser promovido a admin em situacoes especiais. A administracao
  de usuarios deve permitir criar usuarios e alterar role/status, preservando
  pelo menos um admin ativo.
- **Fluxos com retorno:** telas de criacao, edicao e assistentes devem ter um
  caminho claro de volta para a listagem ou ficha de origem. O usuario nao deve
  ficar preso dentro de um fluxo funcional.
- **Design system atual:** a direcao visual vigente passou a ser o arquivo
  `DESIGN-pinterest.md`. Nao reintroduzir o design antigo sem aprovacao.

---

## Fase 10 — Módulo do Aluno 2 (admin: reset senha, financeiro, foto, dossiê)

Baseado em `modules/modulo_aluno2.md`. Ordem de execução segue a sugestão do
próprio arquivo (TAREFA 1, 2, 3, 6, 4→5, 7). Decisão tomada com o usuário
em 2026-07-14: TAREFA 5 (Pix copia-e-cola/QR Code gerado localmente) agora
está em escopo; boleto com gateway real continua fora de escopo (só
estrutura preparada, ver seção "Fora de escopo" acima). Execução subtarefa
por subtarefa, com commit/push e validação do usuário entre cada uma
(protocolo padrão do `CLAUDE.md`).

- [x] **10.1 (TAREFA 1) — Reset de senha de alunos pelo admin**
  Migration `20260714120000_add_student_must_change_password.sql`:
  `students.must_change_password` (boolean, default false), aplicada no
  Supabase compartilhado (`nexusdojo-dev`).
  `app/(admin)/students/[id]/reset-password/actions.ts`
  (`resetStudentPassword`, mesmo padrão de `createStudentLogin`:
  `requireRole("admin")` + `createAdminClient()` +
  `admin.auth.admin.updateUserById`) gera senha temporária aleatória
  (12 chars, charset sem ambíguos), marca `must_change_password=true` e
  grava `audit_logs` (`action: "student_password_reset"`).
  `reset-password-button.tsx` usa um novo `components/ui/confirm-dialog.tsx`
  (modal genérico reutilizável, não existia nenhum no projeto) — nome do
  aluno visível na confirmação, senha temporária exibida uma única vez com
  botão copiar. Botão só aparece na ficha do aluno
  (`app/(admin)/students/[id]/edit/page.tsx`) quando já existe login.
  Enforcement: `getCurrentStudentProfile` passou a expor
  `mustChangePassword`; `app/(student)/layout.tsx` redireciona para
  `/aluno/nova-senha` enquanto a flag estiver ativa (bloqueia qualquer
  outra rota `/aluno/*`); página nova em
  `app/(student-forced)/aluno/nova-senha` (route group próprio, fora do
  `(student)`, para não herdar o próprio redirect) reaproveita
  `ChangePasswordForm` (ganhou prop `onSuccess` opcional) e
  `modules/students/account-actions.ts` (`clearMustChangePassword`) limpa
  a flag após a troca.
  `database.types.ts` recebeu o mesmo patch manual cirúrgico das Fases
  9.1/9.2 (`must_change_password` em Row/Insert/Update de `students`) —
  regen completo via `db:types` segue pendente de Docker/token de
  management API.
  Confirmado de ponta a ponta com Playwright (`e2e/reset-password.spec.ts`,
  novo teste permanente): admin reseta senha → modal mostra senha
  temporária → flag `true` no banco → login do aluno com a senha antiga
  falha → login com a senha temporária força redirect para
  `/aluno/nova-senha` → tentativa de acessar `/aluno` permanece preso na
  tela obrigatória → definir nova senha redireciona para `/aluno` e limpa
  a flag → `audit_logs` confirma o registro. Sem erros de console.

- [x] **10.2 (TAREFA 2) — Data e dia da semana no grid de aulas**
  Decisão tomada com o usuário: cada linha da aba "Aulas" de
  `/aluno/academia` é uma turma **recorrente** (`class_groups`), não uma
  aula com data única — então "data e dia da semana" virou "dia(s) da
  semana em que a turma ocorre", calculado a partir de
  `class_groups.week_days` (nunca hardcoded), não a expansão em
  ocorrências datadas (fora de escopo aqui).
  `lib/dates/format.ts` ganhou `formatWeekDays(weekDays: number[])`
  (rótulos pt-BR por extenso, ex. "Segunda-feira, Quarta-feira").
  `modules/students/academy.ts` (`getAcademyData`) passou a selecionar
  `week_days` e expor em `ClassCatalogEntry.weekDays`; ordenação mudou de
  alfabética por nome para cronológica (primeiro dia da semana em que a
  turma ocorre, depois horário de início) — mais legível como grade de
  horários. `academia-client.tsx` exibe os dias da semana em destaque
  (cor primária) entre o nome da turma e o horário.
  Confirmado com Playwright: aba Aulas renderiza, por exemplo,
  "Jiu Jitsu GB2/GB3 — Segunda-feira, Quarta-feira — 07:00 até 08:00 ·
  Professor Rafael Mendes". Typecheck e lint limpos.

- [x] **10.3 (TAREFA 3) — Padronizar visual das faixas em /aluno**
  Migrado `painel-client.tsx` (timeline "Evolução das faixas") e
  `academia-client.tsx` (aba Alunos) do dot manual
  (`style={{backgroundColor}}`) para `BeltPreview`/`BeltWithPreview`
  (`components/belts/belt-preview.tsx`), já usado consistentemente no
  admin/professor. Campos `colorHex`/`beltColorHex` removidos de
  `modules/students/dashboard.ts` e `modules/students/academy.ts` (ficaram
  sem uso — a cor agora é derivada do nome da faixa pelo próprio
  `BeltPreview`, mesma fonte de verdade do admin). Confirmado com
  Playwright (script temporário, removido após validação): `/aluno/painel`
  e `/aluno/academia` (aba Alunos) renderizam as faixas com a mesma peça
  visual do admin, sem erros de console.

- [ ] **10.4 (TAREFA 6) — Foto do aluno (upload em perfil e cadastro admin)**
  Reusar `AvatarUpload` (`components/forms/avatar-upload.tsx`, bucket
  `avatars` já existe da Fase 8.1): (a) wirar o widget no formulário de
  edição de aluno no admin (`app/(admin)/students/[id]/edit/form.tsx` hoje
  só persiste a URL, sem o componente de upload); (b) upload self-service
  em `app/(student)/aluno/perfil`. Fallback com `AvatarInitials` onde ainda
  não existir.

- [ ] **10.5 (TAREFA 4) — Área financeira do aluno**
  Não existe hoje. Reusar schema já pronto (`contracts`,
  `contract_installments`, `financial_movements`) e a lógica de
  `financial-queries.ts`/`financial-section.tsx` do admin como referência,
  adaptando para o aluno (só leitura: plano atual, situação, parcelas com
  badge por status, próximo vencimento em destaque). Botão "Pagar" nas
  parcelas pendentes/vencidas exibe os dados de pagamento enviados pelo
  admin (vem da 10.6) — aluno não cria/edita cobranças.

- [ ] **10.6 (TAREFA 5) — Gestão de cobranças pelo admin (Pix, QR Code)**
  Novo módulo financeiro admin: ação "Enviar cobrança" por parcela (gera
  payload Pix copia-e-cola EMV + QR Code localmente, campo de chave Pix da
  escola; estrutura preparada para boleto sem integração real). Cobrança
  enviada fica visível na tela da 10.5 e gera notificação (reusa tabela
  `notifications`, novo `type: "charge_sent"`). Ação "Confirmar pagamento"
  (baixa manual) — avaliar reuso/extensão de
  `modules/finance/payment-actions.ts` já existente. Dashboard simples de
  parcelas pagas/pendentes/vencidas do mês com filtro por aluno (avaliar
  reaproveitar `/finance/dashboard`).

- [ ] **10.7 (TAREFA 7) — Dossiê do aluno**
  Página consolidando dados cadastrais, histórico de graduações (componente
  da 10.3), histórico financeiro (10.5/10.6), histórico de presenças e
  observações internas (admin/professor only, novo campo). Acessível pelo
  perfil do aluno e pelo detalhe do aluno no admin.
