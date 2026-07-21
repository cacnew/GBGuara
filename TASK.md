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

- [x] **10.4 (TAREFA 6) — Foto do aluno (upload em perfil e cadastro admin)**
  (a) já estava feito desde a Fase 8.1 — `app/(admin)/students/[id]/edit/form.tsx`
  já usa `AvatarUpload`; a nota original do TASK.md estava desatualizada.
  (b) upload self-service em `app/(student)/aluno/perfil`: novo
  `profile-photo.tsx` (client) envolve `AvatarUpload` e chama a nova
  server action `updateStudentPhoto` (`modules/students/account-actions.ts`,
  mesmo padrão `requireStudent()` + `createAdminClient()` de
  `clearMustChangePassword`, porque aluno não tem policy de update em
  `students`). Migration nova
  (`20260715090000_students_self_upload_avatar.sql`, aplicada no Supabase
  compartilhado): o bucket `avatars` (Fase 8.1) só liberava insert/update
  via `current_school_id()` (resolve por `users`, nulo numa sessão de
  aluno) — adicionadas policies equivalentes usando
  `current_student_school_id()`/`current_student_id()`, restritas ao
  próprio arquivo do aluno (`storage.filename(name) like
  student_id || '-%'`).
  `academia-client.tsx` também passou a usar `AvatarInitials`
  (`components/ui/avatar-initials.tsx`) em vez de um componente `Avatar`
  local duplicado (mesmo fallback de iniciais, sem duplicação de código).
  Confirmado com Playwright (script temporário, removido após validação):
  login do aluno → `/aluno/perfil` → upload de imagem → toast "Foto
  atualizada." → URL do Storage aparece no `<img>` → após reload da
  página a foto persiste (confirma gravação no banco, não só estado
  local). Sem erros de console. Foto de teste permanece na conta demo do
  ambiente compartilhado (mesmo padrão de dados de demonstração já usado
  em fases anteriores).

- [x] **10.5 (TAREFA 4) — Área financeira do aluno**
  `modules/students/finance.ts` (`getStudentFinance`): mesma lógica de
  `financial-queries.ts` do admin (situação financeira, valor em
  aberto/vencido, total pago, próximo vencimento), mas escopada pela
  própria sessão do aluno via `createClient()` (RLS), não admin client —
  aluno só lê. Migration nova
  (`20260715100000_student_finance_read_access.sql`, aplicada no Supabase
  compartilhado): `contracts`/`contract_installments` já tinham select
  para o aluno (Fase 9.1), mas faltava `plans`/`price_tables` (nome do
  plano/tabela embutido no contrato — RLS de PostgREST também filtra a
  tabela do embed) e `student_financial_exemptions` (própria isenção, para
  não marcar aluno isento como inadimplente); todas as 3 novas policies
  restritas à própria escola/registro do aluno.
  `app/(student)/aluno/financeiro/{page,finance-client}.tsx`: cards de
  situação (badge reaproveitando `StatusBadge`)/próximo vencimento/valor em
  aberto/valor vencido, card do contrato atual, lista de parcelas com badge
  por status. Botão "Pagar" nas parcelas pendentes/vencidas: como a 10.6
  (gestão de cobranças) ainda não existe, mostra por enquanto "Aguardando
  o envio da cobrança pelo financeiro" — será conectado ao Pix real na
  10.6. Nav "Financeiro" adicionado ao `STUDENT_NAV`.
  Confirmado com Playwright: (1) conta demo sem contrato mostra o estado
  vazio corretamente; (2) contrato de teste semeado temporariamente (1
  parcela paga, 1 vencida, 1 pendente futura) confirmou situação
  "Inadimplente", valores em aberto/vencido corretos, nome do
  plano/tabela de preço via embed (prova que as novas policies de RLS
  funcionam), badges Paga/Vencida/Pendente corretos e botão "Pagar"
  funcional — dados de teste removidos do ambiente compartilhado depois
  da validação (diferente da foto de perfil da 10.4, dado financeiro
  fabricado não é demo útil para manter). Sem erros de console.

- [x] **10.6 (TAREFA 5) — Gestão de cobranças pelo admin (Pix, QR Code)**
  Novo módulo `/finance/charges` (nav "Cobranças" em Financeiro): caixa de
  configuração da chave Pix da escola (`schools.pix_key`, coluna nova),
  cards simples de parcelas pagas/pendentes/vencidas do mês (com filtro de
  mês/aluno, mesmo padrão de query de `finance/installments/page.tsx`) e
  lista de parcelas do mês com ação "Enviar cobrança".
  `lib/pix/emv.ts` (`buildPixPayload`): Pix copia-e-cola (BR Code/EMV)
  montado localmente em TS puro (TLV + CRC16-CCITT), sem gateway.
  `lib/pix/qr.ts`: QR Code gerado localmente a partir do payload via
  `qrcode` (novo pacote, só encoding local, sem chamada externa) — usei
  `QRCode.toString(..., { type: "svg" })` porque não depende de canvas,
  funciona igual no server e no client.
  `modules/finance/charge-actions.ts` (`sendPixCharge`, requireRole admin):
  grava `installment_charges` (tabela nova, migration
  `20260715120000_finance_charges.sql`) com o payload já montado, dispara
  notificação `type: "charge_sent"` (reusa `notifications`, sem migration
  de schema — `type` já era texto livre) e loga em `audit_logs`. Ação
  "Confirmar pagamento" reaproveita `registerInstallmentPayment`
  (`modules/finance/payment-actions.ts`) sem nenhuma alteração nele.
  Fecha o loop com a 10.5: `modules/students/finance.ts` passou a buscar a
  cobrança mais recente de cada parcela e gerar o mesmo QR Code a partir
  do payload salvo; `finance-client.tsx` do aluno agora mostra o Pix real
  no botão "Pagar" quando existe cobrança enviada (antes só mostrava
  "aguardando"). `notifications-client.tsx` do aluno ganhou o título/
  descrição do tipo `charge_sent` (parcela, valor, vencimento).
  Confirmado com Playwright (scripts temporários com contrato de teste
  semeado e removido depois da validação, mesmo padrão da 10.5): admin
  configura a chave Pix → envia cobrança de uma parcela vencida → QR Code
  e copia-e-cola aparecem na tela → aluno vê o mesmo QR/payload em
  `/aluno/financeiro` ao clicar "Pagar" → notificação "Nova cobrança
  disponível" aparece no feed do aluno → "Confirmar pagamento" na tela de
  cobranças marca a parcela como paga (conferido direto no banco: status
  `paid`, `payment_method: "pix"`, data correta). Sem erros de console.

- [x] **10.7 (TAREFA 7) — Dossiê do aluno**
  `app/(admin)/students/[id]/dossie/page.tsx` (novo, link "Ver dossiê" na
  ficha do aluno): consolida dados cadastrais, responsáveis, histórico de
  graduações (`BeltWithPreview`, padrão da 10.3), resumo financeiro
  (reaproveita `getStudentFinancialSummary` do módulo financeiro existente,
  sem duplicar a query) e histórico de presença (reaproveita o componente
  `AttendanceHistory` já existente).
  `app/(student)/aluno/dossie/page.tsx` (novo, link "Ver meu dossiê" em
  `/aluno/perfil`): mesma ideia, só leitura, para o próprio aluno —
  reaproveita `getStudentDashboard` (faixas + presenças, Fase 9.8) e
  `getStudentFinance` (Fase 10.5) sem nenhuma query nova.
  Observações internas (admin/professor only, peça nova de fato): tabela
  `student_internal_notes` (migration `20260715130000...`) sem NENHUMA
  policy de select para aluno — mesmo padrão defensivo de
  `student_financial_exemptions` — para garantir que o dado nunca vaza
  independente de mudanças futuras nas telas. `modules/students/
  internal-notes.ts` (`getInternalNotes`/`addInternalNote`, usando
  `requireUser()` para aceitar admin OU professor, conforme pedido) +
  `components/students/internal-notes-section.tsx` (componente
  compartilhado), usado tanto no dossiê do admin quanto na página já
  existente do aluno para o professor (`app/(teacher)/professor/students/
  [id]/page.tsx`) — professor também pode ler/adicionar observações,
  mesmo sem uma rota de "dossiê" própria dele (já tinha uma ficha
  equivalente).
  Verificação: confirmado com Playwright que o dossiê do admin renderiza
  corretamente com dados reais (cadastro, responsáveis, financeiro,
  histórico de presença) e que adicionar uma observação persiste
  corretamente (conferido direto no banco: autor/escola/aluno/texto
  corretos). RLS testada diretamente com um client autenticado como o
  aluno (`aluno@nexusdojo.dev`): `select * from student_internal_notes`
  retorna 0 linhas — a observação de teste nunca fica visível para o
  aluno. A rota `/aluno/dossie` foi confirmada compilando e respondendo
  (redirect correto para usuário não autenticado); a verificação visual
  completa do lado do aluno logado ficou limitada por instabilidade do
  ambiente de desenvolvimento nesta sessão (filesystem/rede
  intermitentemente muito lentos, com timeouts mesmo após reiniciar o
  dev server) — o conteúdo dessa página reaproveita funções
  (`getStudentDashboard`, `getStudentFinance`) já validadas
  end-to-end nas Fases 9.8/10.5, então o risco residual é baixo, mas fica
  registrado que essa página específica não teve confirmação visual
  completa nesta sessão. Dados de teste (contrato fictício e observação)
  removidos do ambiente compartilhado depois da validação.
  Com a 10.7, a Fase 10 (Módulo do Aluno 2, `modules/modulo_aluno2.md`)
  está completa.

---

## Dados de demonstração financeira (gerado em 2026-07-15)

Fora do roadmap numerado — geração de dados sob pedido do usuário para
popular o ambiente compartilhado (`nexusdojo-dev`) com um cenário
financeiro realista para demonstração/teste visual, não como subtarefa de
produto. Diferente dos dados de teste das Fases 10.5/10.6/10.7 (criados e
removidos na mesma sessão), estes dados **permanecem** no ambiente
compartilhado, no mesmo espírito dos seeds de demonstração da 7.5.

Dois scripts novos em `scripts/` (Node, usam `SUPABASE_SERVICE_ROLE_KEY` de
`.env.local`, reimplementam a escrita direta no banco em vez de chamar as
server actions, já que estas exigem sessão admin autenticada):

- `seed-student-finance.mjs`: cria/recria um contrato de teste para a conta
  demo `aluno@nexusdojo.dev` (1 parcela paga, 1 vencida, 1 pendente futura).
- `seed-full-finance.mjs`: cria 12 planos em "Tabela Padrão 2026"
  (3 níveis de acesso — 2x/semana R$ 220, 3x/semana R$ 260, Acesso Full
  R$ 299,90 — x 4 durações — Mensal/Trimestral/Semestral/Anual, com
  desconto crescente por duração: 0%/5%/10%/15%) e gera um contrato ativo
  para **todos os 51 alunos** da escola, com distribuição ponderada de
  plano/duração e histórico de parcelas variado (pagas, parcialmente
  pagas, vencidas sem pagamento, pendentes futuras) para alimentar
  `/finance/installments`, `/finance/overdue` e `/finance/dashboard` com
  números realistas. O plano placeholder antigo ("Plano Mensal Ilimitado",
  criado por engano num seed anterior nesta mesma sessão) foi marcado
  `legacy` em vez de apagado (FK `contracts.plan_id` é `on delete
  restrict`).
  > Bug corrigido durante a geração: a primeira tentativa usava
  > `installments_count` fixo (6) para todas as durações, o que diluía o
  > preço mensal (ex: plano de R$ 220/mês virava 6x de R$ 36,67). Corrigido
  > para `installments_count` = nº de meses da duração do plano (Mensal=1x,
  > Trimestral=3x, Semestral=6x, Anual=12x) — mesmo modelo usado pela
  > própria action `createContract` (Fase 5.6), que trata `plans.base_price`
  > como preço total do período, não preço mensal a ser multiplicado.
  Resultado final validado com Playwright (login admin e login aluno,
  sem erros de console): 51 contratos ativos, 19 alunos inadimplentes,
  receita prevista de julho/2026 R$ 7.084,44, recebida R$ 2.561,51.
  Commit `95a9558`.

---

## Correção de coerência do módulo de presença (2026-07-16)

Fora do roadmap numerado — a pedido do usuário, auditoria completa dos 3
fluxos de origem de presença (aluno sinaliza, professor marca direto na
tela antiga, professor/admin inclui manualmente na chamada nova) contra
todas as telas de visualização, em todos os perfis (aluno/professor/admin).

**Causa raiz:** o modelo de status foi estendido aditivamente na Fase 9
(`signaled/confirmed/added_by_instructor/no_show/cancelled` convivendo com
o `presente` da Fase 4), mas várias queries de leitura continuaram
filtrando só um dos dois conjuntos de status, então presença registrada por
um fluxo ficava invisível em telas que só reconheciam o outro.

Nova constante única `lib/attendance/constants.ts` (`PRESENT_STATUSES`,
`ATTENDANCE_STATUS_LABELS`) para evitar essa divergência se repetir.
**11 pontos corrigidos** para usar `PRESENT_STATUSES` (ou incluir
`'presente'`/ser reconhecidos pelo outro fluxo):
- `app/(admin)/dashboard/queries.ts` (attendancesMonth, absentStudents,
  recentAttendances) e `app/(teacher)/professor/queries.ts`
  (attentionStudents/lastAttendanceByStudent) só contavam `'presente'`.
- `app/(admin)/classes/sessions/page.tsx` e
  `app/(teacher)/professor/sessions/page.tsx` (histórico de chamadas,
  coluna "Presentes") — idem.
- `app/(admin)/classes/page.tsx` (ocupação de turma) e
  `app/(teacher)/professor/students/[id]/page.tsx` (última presença +
  indicador de presenças desde a graduação, Fase 6.3) — idem.
- `modules/students/dashboard.ts` (`COUNTED_STATUSES`, painel do aluno) e
  `modules/students/signal-rules.ts` (`OCCUPYING_STATUSES`, agenda/
  ocupação/conflito de horário) faziam o inverso: não contavam
  `'presente'`.
- `app/attendance/[sessionId]/page.tsx` (tela de chamada antiga) não
  filtrava status — mostrava sinalização não confirmada como "presente".
  `modules/attendance/actions.ts` (`markPresent`) quebrava com erro
  confuso ("já está presente") se o aluno já tinha se sinalizado —
  agora reaproveita a linha existente; `markPresent`/`removeAttendance`
  passaram a respeitar `attendance_closed_at` (só a chamada nova
  respeitava antes).
  `app/attendance/[sessionId]/roll-call/roll-call-client.tsx` (chamada
  nova) não reconhecia `'presente'` na coluna "Presentes";
  `modules/attendance/roll-call.ts` (`addStudentManually`) idem no check
  de "já está presente".
- `app/(admin)/students/[id]/edit/attendance-history.tsx` (histórico de
  presença na ficha/dossiê do aluno) mostrava os status novos em inglês
  cru — usa `ATTENDANCE_STATUS_LABELS` agora.

**Bug adicional achado testando os fluxos ao vivo:** "Última presença" (e
as listas "Últimas presenças"/"Últimas presenças recentes") em
`app/(teacher)/professor/students/[id]/page.tsx`,
`app/(admin)/students/[id]/edit/attendance-history.tsx` e
`app/(admin)/dashboard/queries.ts` ordenavam por `created_at` (quando a
linha foi inserida no banco) em vez da data real da aula
(`class_sessions.date`) — com dados históricos inseridos em lote (seed),
isso mostrava datas erradas/fora de ordem mesmo com presença do dia atual
na lista. `.order(foreignTable)` do PostgREST se mostrou não confiável
combinado com `.limit()`/filtro na tabela embutida (confirmado testando a
query isolada) — corrigido ordenando no cliente (JS) em vez de depender do
banco, nos 3 pontos acima e em `modules/students/dashboard.ts` (histórico
do painel do aluno, por consistência, embora sem `.limit()` o impacto ali
fosse só cosmético).

Novo script `scripts/seed-attendance.mjs`: gera sessões e presenças
cobrindo os 3 fluxos de origem nas últimas 8 semanas (734 presenças, 405
sessões — 307 fechadas/realizada, 98 abertas), com personas de frequência
por aluno (alta/média/baixa, esta última garantindo alunos "ausentes há
15+ dias") para popular dashboards, histórico de chamadas, painel e ficha
do aluno sem telas vazias. A conta demo (`aluno@nexusdojo.dev`) foi
deixada de fora da geração em massa de propósito, reservada para teste ao
vivo dos fluxos reais via Playwright.

Validação end-to-end com Playwright, os 3 perfis (login
`admin@nexusdojo.dev`, `rafael.mendes@demo.nexusdojo.dev` — confirmado que
os logins de professor já existentes usam a mesma senha padrão
`TestSenha123!` — e `aluno@nexusdojo.dev`): aluno sinalizou uma turma real
de hoje → confirmado via chamada nova → chamada fechada → notificação
"Instrutor confirmou sua presença" gerada corretamente → painel do aluno
(gráfico mensal + calendário) e histórico atualizados → dashboard e ficha
do aluno no admin refletindo a mudança. Sinalizações concorrentes não
confirmadas viraram `no_show` corretamente ao fechar a chamada. Sem erros
de console em nenhuma tela testada.

`tsc --noEmit`, `npm run lint` e `npm test` (28 testes unitários) limpos.
Nota: um import via alias `@/` introduzido em `signal-rules.ts` quebrou os
testes (vitest não resolve esse alias, módulo é mantido livre de
dependências de build de propósito para ser testável sem framework) —
corrigido para import relativo.

> **Atualização (mesmo dia):** o achado acima ("Pagamentos recentes"
> mostrando o mesmo aluno várias vezes) foi corrigido a pedido do usuário.
> Diferente dos casos de presença, `movement_date` é coluna da própria
> tabela `financial_movements` (não embutida via join), então bastou trocar
> `.order("created_at", ...)` por `.order("movement_date", { ascending:
> false })` diretamente na query — sem precisar de ordenação no cliente.
> Verificado direto no banco e via Playwright (dashboard admin): 5 alunos
> diferentes, em ordem cronológica correta, sem erros de console.
>
> **Segunda atualização (mesmo dia):** a pedido do usuário, auditoria de
> **todos** os `.order("created_at", ...)` do projeto (grep completo) para
> achar outras telas com o mesmo padrão de bug. Da lista completa, a
> maioria estava correta (notificações, observações internas, sugestões de
> graduação, leads, audit log, lista de usuários — nesses casos
> `created_at` É a data de negócio relevante). Dois pontos reais
> encontrados e corrigidos:
> - `app/(admin)/dashboard/queries.ts` ("Últimas graduações",
>   `recentGraduationRows`): ordenava `graduation_history` por
>   `created_at` em vez de `graduation_date` (coluna própria da tabela,
>   sem o problema de `foreignTable`). Confirmado com dado real: uma
>   graduação registrada às pressas durante os testes desta sessão tinha
>   `graduation_date` de 2027, inserida com `created_at` de agora — subia
>   pro topo da lista por engano. Corrigido para `.order("graduation_date",
>   { ascending: false })`.
> - `app/(teacher)/professor/queries.ts` ("Observações recentes",
>   `recentNotes`): ordenava por `created_at` da linha de `attendances`
>   (quando a presença foi originalmente registrada), não por quando a
>   observação foi de fato escrita (`saveAttendanceNote` faz um `UPDATE`,
>   que bate a coluna `updated_at` via trigger já existente
>   `attendances_set_updated_at`). Corrigido para `.order("updated_at",
>   { ascending: false })` e a data exibida no card passou a usar
>   `updated_at`. Sem observações cadastradas no ambiente no momento do
>   teste para validar visualmente com dado real; validado via `tsc
>   --noEmit`/lint/ausência de erros de console.
> Verificado que não sobrou nenhum outro uso de ordenação por
> `foreignTable`/dot-notation em tabela embutida no projeto (mesma causa
> raiz dos bugs de presença) além dos já corrigidos.

---

## Fase 11 — Landing page institucional gerenciável (2026-07-16/17)

> **Nota de processo:** feature entregue pelo Carlos (commits `8138179` e
> `df595ab`) sem ter passado pelo planejamento formal em subtarefas `[ ]`
> neste arquivo antes da implementação — diferente do padrão seguido nas
> Fases 0–10. Registrada aqui retroativamente (a pedido do usuário, sessão
> de 2026-07-17) para o `TASK.md` voltar a refletir o estado real do
> código, conforme a Regra de Ouro do `CLAUDE.md`. Especificação de
> referência visual usada pelo Carlos: `lading page requisito.txt` (raiz do
> repo, cita `https://www.gbmangueiral.com.br` como referência obrigatória
> de layout/estrutura).

- [x] **11.1 — Schema + gestão da landing page pelo admin**
  Migration `20260716110000_landing_page_management.sql`: tabela
  `landing_pages` (1 por escola, `unique(school_id)`) com conteúdo em
  colunas `jsonb` (`identity`, `navigation`, `hero`, `metrics`, `about`,
  `campaign`, `contact`, `footer`, `seo`) e `status`
  (`draft`/`published`/`unpublished`); RLS permite leitura pública
  (`anon`) só de páginas `published`, leitura/escrita irrestrita da própria
  escola para usuários autenticados. Tabelas relacionadas
  `landing_teacher_profiles` (perfil de professor específico da landing,
  com FK opcional para `teachers`) e presumivelmente uma tabela/estrutura
  para as turmas exibidas na grade de horários pública.
  `modules/landing/{queries,actions,defaults}.ts`: `defaults.ts` define o
  conteúdo padrão/schema de merge (`LandingContent`, `mergeContent`);
  `queries.ts` monta `LandingPageData` juntando a linha de
  `landing_pages` com professores/turmas; `actions.ts`
  (`saveLandingPage`, `requireRole("admin")`) grava o formulário completo
  (identidade visual, navegação, hero, métricas, seção institucional,
  campanha, contato, rodapé, SEO) via `logAuditEvent`.
  `app/(admin)/landing/{page,landing-form}.tsx`: tela de edição no admin
  (nav nova, ver `components/layout/nav-config.ts`).
  `app/page.tsx` + `app/landing-schedule.tsx` + `app/globals.css`: página
  pública (`/`) renderizando o conteúdo publicado, incluindo grade de
  horários (`landing-schedule.tsx`) e estilos dedicados novos em
  `globals.css` (726 linhas).
  Mudanças colaterais em `app/(auth)/login/{page,login-form}.tsx`
  (refatoração do login, novo `login-form.tsx` como client component
  separado), `avatar-upload.tsx`, e pequenos ajustes em
  `students/new`/`teachers/new`/`teachers/actions.ts`.
  `database.types.ts` regenerado (+186 linhas) — inclui os tipos novos de
  `landing_pages`/`landing_teacher_profiles`.
  Sem registro de verificação end-to-end (Playwright ou manual) nesta
  entrada — não documentado pelo Carlos nos commits originais.

- [x] **11.2 — Fix: link e preview do mapa na landing**
  Commit `df595ab`: ajustes em `app/page.tsx` (34 linhas) e
  `app/globals.css` (15 linhas) — corrige o link e a exibição do preview
  do mapa (provavelmente embed do Google Maps na seção de contato/
  localização) introduzidos na 11.1.

> **Pendência aberta:** esta fase não tem os registros de verificação
> (Playwright/manual, RLS, screenshots) que as Fases 9/10 passaram a ter
> como padrão. Recomenda-se validar manualmente a página pública `/` e o
> formulário `/landing` (incluindo a policy de leitura pública `anon` só
> para `status = 'published'`) antes de considerar a Fase 11 encerrada com
> a mesma confiança das fases anteriores.

### Validação da Fase 11 (2026-07-17)

Feita a pedido do usuário para fechar a pendência acima. Dev server local
contra o Supabase compartilhado (`nexusdojo-dev`), Playwright dirigindo
Chromium headless, desktop (1400×900) e mobile (390×844).

**Confirmado funcionando:**
- Página pública `/` renderiza todas as 7 seções (`#top`, `#indicadores`,
  `#professores`, `#horarios`, `#sobre`, `#campanha`, `#contato`) com o
  estilo editorial-esportivo pretendido (tipografia grande, hero com
  imagem de fundo e overlay, chips de modalidade, painel lateral) — sem
  erros de console/página. Nenhuma `<img>` quebrada.
- Grade de horários (`landing-schedule.tsx`): troca de dia (Seg–Sáb) filtra
  corretamente as turmas exibidas (testado as 6 abas, contagens batendo
  com os dados reais de `class_groups`).
- Mapa de contato: iframe do Google Maps embed carrega meses (usa
  `identity.address/city/state`) e o botão "Ver localização" usa a URL
  completa configurada manualmente (`identity.mapUrl`) — os dois
  independentes, ambos funcionais; fix do commit `df595ab` confirmado.
- RLS de `landing_pages`: testado invertendo o `status` da linha real para
  `draft` via service role — `anon` deixou de enxergar a linha
  (`select` retornou `[]`) — e restaurado para `published` em seguida;
  confirma que a policy "public can select published landing pages" no
  banco funciona (mesmo a página pública em si não depender dela, já que
  `getPublishedLandingPage` usa `createAdminClient()` no server — a RLS
  importa para quem acessa a API REST do Supabase diretamente).
- Formulário admin (`/landing`): edição de campo + "Salvar rascunho"
  persiste corretamente (confirmado com reload da página), mensagem de
  sucesso inline aparece. Botão "Publicar" funciona (testado restaurando o
  status real para `published` depois do teste).

**2 problemas reais encontrados (nenhum bloqueante, mas precisam de
follow-up):**
1. **Fotos dos professores na landing pública ficam com texto ilegível/
   sobreposto** (`#professores`, cards "Conheça o professor"). Causa raiz:
   não é bug de CSS — as 3 fotos usadas (`teachers.photo_url`, mesmo campo
   usado na ficha interna do professor desde a Fase 2.5/8.1) são artes
   promocionais completas (estilo post de Instagram, já com "CONHEÇA O
   PROFESSOR / NOME / BLACK BELT" desenhado na própria imagem), não fotos
   simples de rosto. O card da landing sobrepõe SEU PRÓPRIO nome/cargo por
   cima da imagem (`.landing-teacher-info`), então o texto embutido na
   arte + o texto do card colidem visualmente, e o `object-fit: cover`
   (imagem quadrada num card mais alto que largo) corta a arte de um jeito
   que "vaza" para a lateral. `landing_teacher_profiles.photo_url` (coluna
   dedicada para uma foto só da landing, que resolveria isso) existe no
   schema (migration 11.1) mas **não tem campo de upload no formulário
   admin** (`landing-form.tsx` só deixa escolher quais professores
   aparecem, via `teacherIds`) — e mesmo que tivesse, a query
   (`teacher.teachers?.photo_url ?? teacher.photo_url`) prioriza a foto
   interna sobre a da landing, então a foto dedicada nunca venceria.
   Precisa de: (a) upload de foto dedicada por professor na landing (UI
   nova), e (b) inverter a prioridade da query para `landing photo ??
   internal photo`. Ou, mais simples a curto prazo: trocar as 3 fotos
   internas desses professores por fotos de rosto simples.
2. **Aviso de console (não visual) no formulário admin**: "Base UI: A
   component is changing the default value state of an uncontrolled
   FieldControl after being initialized." — componente de formulário
   (provavelmente um dos campos de cor/upload) inicializa sem valor
   controlado e recebe o valor default depois via effect. Não impediu
   salvar/carregar dados nesta sessão, mas é o tipo de aviso que pode virar
   bug real de sincronização de estado; vale investigar qual campo
   específico dispara (não identificado nesta sessão).

**Observação arquitetural (não é bug, é para confirmar intenção):**
`getPublishedLandingPage()` busca a landing `published` mais recente
**sem filtrar por domínio/host** — se este deployment algum dia servir
mais de uma escola (`school_id`) no mesmo domínio Next.js, a rota `/`
pública mostraria só a landing da escola que publicou por último, para
todo mundo. Hoje não é um problema porque o ambiente compartilhado só tem
1 escola ativa (`Gracie Barra Riacho Fundo I`), mas vale confirmar com o
Carlos se o modelo de deploy pretendido é 1 deployment por escola (aí é
inofensivo) ou multi-tenant num domínio só (aí precisa de resolução por
subdomínio/host antes de ir para produção com mais de uma escola).

Nenhum dado real foi alterado permanentemente — o toggle de RLS e a edição
de teste no formulário (`slogan`) foram revertidos ao estado original
(`status: published`, slogan "Jiu-jitsu e defesa pessoal para todos") ao
final da validação. Scripts temporários de teste removidos.

### Correção do bug de fotos de professores (2026-07-17)

A pedido do usuário, corrigido o problema 1 encontrado na validação acima.

**Causa raiz completa** (mais profunda do que a nota original identificou):
`syncTeachers` (`modules/landing/actions.ts`, chamada a cada save do
formulário `/landing`) sempre sobrescrevia `landing_teacher_profiles.photo_url`
com `teachers.photo_url` (a foto interna do cadastro do professor),
incondicionalmente, a cada save — então mesmo que existisse uma foto
dedicada da landing, ela seria apagada no próximo save. Combinado com a
query (`teacher.teachers?.photo_url ?? teacher.photo_url`, prioridade
invertida) e a ausência total de campo de upload para
`landing_teacher_profiles.photo_url` no formulário, não havia nenhum
caminho possível para o admin usar uma foto diferente da interna na
landing.

**Correção (3 arquivos):**
- `modules/landing/queries.ts` (`getAdminLandingTeachers`,
  `getPublicLandingTeachers`): precedência invertida para
  `teacher.photo_url || teacher.teachers?.photo_url || ""` — a foto
  dedicada da landing agora vence quando existir.
- `app/(admin)/landing/landing-form.tsx`: cada professor selecionado em
  "Professores publicados" ganhou um campo
  `LandingImageUpload` próprio (`teacherPhoto_<teacherId>`, mesmo
  componente/padrão já usado para logo/hero/about/campanha/contato),
  com aviso explícito no hint para não usar arte promocional com texto
  embutido. Campo aparece só para professores já marcados (calculado a
  partir de `landing.teachers`, que só reflete o que já foi salvo —
  marcar o checkbox e salvar uma vez é necessário antes do campo de foto
  aparecer para um professor novo; limitação aceita, consistente com o
  resto do formulário que já é assim).
- `modules/landing/actions.ts` (`saveLandingPage`/`syncTeachers`): novo
  parâmetro `photoOverrides` (map teacherId → URL, lido de
  `teacherPhoto_<id>` no formData) — `photo_url` do upsert passa a ser
  `photoOverrides[teacher.id] || teacher.photo_url`, preservando a
  escolha do admin em vez de sempre sobrescrever com a foto interna.

**Dados reais corrigidos:** as 3 fotos com arte promocional (Lucas
Gomides, Yuri Resfa, Daniel Gomide — a 4a professora featured, Camila
Duarte, já usava uma foto normal e não precisou de ajuste) foram
recortadas (`sharp`, script local descartado depois) para isolar só a
porção de foto limpa de cada arte, e reenviadas através do novo campo do
formulário (upload real via Playwright dirigindo a UI, não escrita direta
no banco) — validando o código novo de ponta a ponta ao mesmo tempo que
corrigia o dado. Confirmado visualmente que os 4 cards da seção
"Professores e instrutores" renderizam sem sobreposição de texto.
`tsc --noEmit` e `eslint` limpos. Status da landing page permanece
`published` (restaurado via clique real no botão "Publicar" durante o
teste, não escrita direta).

**Não corrigido nesta sessão (fora do escopo do bug reportado):**
`role_title`, `specialties` e `quote` de `landing_teacher_profiles`
continuam hardcoded/sobrescritos a cada save (sempre "Professor" e o
mesmo texto genérico) — nunca tiveram UI própria, não é regressão desta
mudança. O botão "Salvar rascunho" também continua sem forma de salvar
conteúdo sem trocar o status para `draft` (mesmo comportamento de antes,
não é o bug reportado).

### Correção do aviso de console do FieldControl (2026-07-17)

A pedido do usuário, investigado e corrigido o problema 2 da validação.

**Causa raiz:** `Field` (`app/(admin)/landing/landing-form.tsx`) repassava
`defaultValue={defaultValue}` direto do prop `landing.*` para o `Input`
(`components/ui/input.tsx`, que envolve `@base-ui/react/input`). Depois de
qualquer save (`Salvar rascunho`/`Despublicar`/`Publicar`), o
`revalidatePath("/landing")` dentro da server action faz o Server
Component (`app/(admin)/landing/page.tsx`) reexecutar `getAdminLandingPage()`
e reenviar `landing` atualizado para o `LandingForm`, que **continua
montado** (não desmonta entre saves) — então o mesmo `Input` recebe um
`defaultValue` novo depois de já inicializado, e o Base UI acusa isso
("changing the default value state of an uncontrolled FieldControl after
being initialized").

**Investigação teve uma pegadinha:** a primeira tentativa (travar o
`defaultValue` no primeiro render via `useState`) fez o aviso sumir, mas
introduziu uma regressão real — descoberta testando o valor do campo
*imediatamente* após salvar, sem reload de página (teste que não tinha
sido feito na validação original, só "salva → reload → confere"). React
19 reseta campos não controlados para o respectivo `defaultValue` ao fim
de uma form action; travando o `defaultValue` num valor fixo, esse reset
passou a devolver sempre o valor de quando a página carregou, escondendo
visualmente o que acabou de ser salvo (mesmo com o banco correto) — o
tipo de bug que faria um admin achar que o save falhou e tentar salvar de
novo. Reproduzido e depois descartado antes de virar commit.

**Correção final:** `key={defaultValue}` no `Input` dentro de `Field`. Como
o valor só muda de fato depois de um save bem-sucedido (nunca durante a
digitação, já que o campo não é controlado), a key só muda nesse momento —
React desmonta e remonta uma instância nova do `Input` com o valor recém-
salvo como `defaultValue` "de fábrica", em vez de mutar uma instância já
inicializada. Resultado: sem aviso do Base UI e o campo mostra o valor
correto (recém-salvo) imediatamente, sem precisar de reload — confirmado
com Playwright preenchendo o slogan, publicando, e lendo o valor do campo
no mesmo carregamento de página (sem reload), sem erros de console.
`tsc --noEmit` e `eslint` limpos.

### Revalidação completa pós-correções (2026-07-17)

A pedido do usuário, repetida a bateria de testes da validação original da
Fase 11 depois das duas correções acima (fotos dos professores +
FieldControl), para confirmar que nada regrediu.

**Ambiente muito lento nesta rodada** (mesmo padrão de instabilidade já
registrado na Fase 10.7): o dev server chegou a levar 64s só para
compilar a primeira request e 19–101s por escrita de cache do Turbopack;
scripts com timeout de 30–60s falharam por timeout puro do ambiente antes
mesmo de qualquer asserção rodar. Timeouts elevados para 120–180s
resolveram.

**Resultado (tudo OK após ajustar os timeouts):**
- As 7 seções da página pública, os 4 cards de professores (sem
  sobreposição de texto — fotos da correção anterior confirmadas), 0
  `<img>` quebrada, as 6 abas de dia da grade de horários, mapa e links de
  contato — todos OK, sem erros de console, desktop e mobile.
- RLS: `anon` não enxerga a linha com `status=draft`, volta a enxergar
  após restaurar `published` — confirmado de novo.
- Formulário admin: os 4 campos de foto dedicada por professor (da
  correção desta sessão) presentes; salvar com `Publicar` mostra o valor
  recém-salvo no campo imediatamente, sem reload e sem warning de
  console — confirma as duas correções juntas, sem regressão.

**Incidente durante o teste (causado pelo teste, não pelo produto):** o
passo final do script de revalidação restaurava o slogan de teste para o
valor original, mas por causa da lentidão do ambiente (fetch da resposta
do save ainda em voo quando o script leu o campo após um timeout fixo de
3s) o slogan ficou temporariamente salvo como o marcador de teste
(`revalidacao-<timestamp>`) na landing pública real. Detectado
imediatamente ao conferir o banco depois do resultado do script (hábito
de nunca confiar cegamente em teste automatizado sob ambiente instável),
corrigido na hora com um script à parte que faz *polling* direto no banco
em vez de esperar um tempo fixo, confirmando o valor restaurado
(`Jiu-jitsu e defesa pessoal para todos`) antes de encerrar. Sem impacto
duradouro — a landing ficou com o slogan errado por alguns minutos durante
o teste, nunca em produção fora de uma janela de teste ativo.

Scripts temporários removidos, dev server parado.

---

## Fase 12 — Sistema de Medalhas e Ranking (aprovado em 2026-07-19)

Professor ou admin cadastra os eventos (competições/campeonatos); o aluno
escolhe um evento existente do catálogo e registra seu próprio desempenho
nele (medalha ou participação sem pódio); professor ou admin analisa
(aprova/rejeita) cada lançamento, ficando registrado quem lançou e quem
analisou. Ranking anual (por ano civil) soma pontos das medalhas aprovadas
de **todos os alunos** da escola, visível para qualquer perfil
(aluno/professor/admin), com seletor de anos anteriores para manter
histórico ao longo do tempo. Decisões de arquitetura confirmadas com o
usuário antes de iniciar:

1. **Catálogo de eventos administrado pelo staff**: o evento precisa
   existir antes de qualquer lançamento — professor ou admin cadastra o
   evento (nome, organização/federação opcional, data, modalidade
   sugerida opcional, FK `modalities`) num catálogo da escola. O aluno
   sempre escolhe um evento já existente da lista ao lançar seu
   desempenho — nunca digita nome/data/organização livremente.
2. **Campos do lançamento do aluno** (a partir do evento escolhido):
   modalidade real da participação (opcional, pode diferir da sugestão do
   evento), categoria/peso (texto livre, opcional), nível de resultado
   (decisão 3), comprovante/foto (opcional, reaproveitando o padrão de
   upload do Supabase Storage já usado em fotos de aluno/professor).
3. **Níveis de resultado — são 4, não devem ser confundidos com os status
   de aprovação (que são 3, ver decisão 6)**: `ouro`/`prata`/`bronze`/
   `participacao`. `participacao` é o resultado de quem disputou o evento
   mas não subiu ao pódio (não ganhou nenhuma medalha) — continua
   contando pontos normalmente conforme a pontuação configurada (decisões
   4/5), não é um nível "vazio".
4. **Pontuação default por nível, configurável pelo admin**: tabela
   `medal_point_rules` (1 linha por nível por escola), com seed default
   (ouro=3, prata=2, bronze=1, participação=0) aplicado automaticamente ao
   criar a escola (mesmo padrão de seed via trigger já usado em
   modalidades/faixas/contas financeiras na Fase 1/2/5); tela simples de
   edição para o admin ajustar os valores da própria escola. O nível
   `participacao` pode receber um valor de pontos maior que zero (não é
   estruturalmente diferente de ouro/prata/bronze), para escolas que
   queiram premiar a participação em si, não só o pódio.
5. **Pontuação por evento (override opcional)**: ao criar ou editar um
   evento (decisão 1), professor ou admin pode opcionalmente definir
   pontos específicos por nível só para aquele evento
   (`medal_event_point_rules`) — ex: um campeonato maior pode valer mais
   pontos que o default da escola. Nível sem override cadastrado naquele
   evento usa o valor default da escola (decisão 4). Cálculo de pontos de
   uma medalha aprovada: usa o override do evento para aquele nível se
   existir; senão, usa o default da escola.
6. **Rejeição**: motivo obrigatório (campo texto); o aluno vê o motivo e
   pode editar os dados do lançamento rejeitado (inclusive trocar o
   evento escolhido) e reenviar — o mesmo registro volta para `pending`
   (sem duplicar linha; os 3 status de workflow continuam sendo
   `pending`/`approved`/`rejected`), preservando o motivo da última
   rejeição até a próxima decisão.
7. **Ranking por ano civil**: calculado a partir do ano de `event_date`
   (agora uma coluna do evento, não do lançamento) das medalhas
   `approved`, com seletor de ano (corrente por padrão, anos anteriores
   disponíveis) — calculado sob demanda (sem tabela de snapshot), mesmo
   padrão de relatórios já existentes no projeto (ex: receita por período
   da Fase 8.7).
8. **Quem pode lançar/analisar/cadastrar evento**: só professor ou admin
   cadastra evento no catálogo (decisão 1); aluno lança/edita só os
   próprios registros, sempre como `pending` (precisa de aprovação);
   professor ou admin lança em nome de qualquer aluno da escola e analisa
   (aprova/rejeita) qualquer lançamento pendente — mesmo padrão de
   `requireUser()` aceitando admin OU professor já usado nas observações
   internas (Fase 10.7). Só professor/admin pode aprovar; aluno nunca
   aprova o próprio lançamento. Lançamento feito por staff em nome de um
   aluno nasce direto como `approved` (`reviewed_by_user_id`/
   `reviewed_at` já preenchidos com o próprio autor) — não passa pela
   fila de aprovação, já que quem lançou é a mesma autoridade que
   aprovaria.
9. **Visibilidade do ranking**: todos os alunos da escola aparecem no
   ranking de todos os perfis (não só os próprios dados do aluno logado),
   para estimular competitividade — reaproveita o padrão de leitura
   ampla-porém-escopada-por-escola já usado em `student_directory`
   (Fase 9.9), expondo só nome/foto/faixa + pontuação, nunca dados
   sensíveis do cadastro.
10. **Visão do próprio aluno**: além da tabela geral do ranking (decisão
    9), o aluno vê um resumo pessoal com pontos do ano selecionado, pontos
    totais (soma de todas as medalhas aprovadas em todos os anos, sem
    recorte por ano) e sua colocação atual no ranking da escola.
11. **Dossiê do aluno**: uma medalha só passa a constar no dossiê (ficha
    consolidada do aluno, tanto na visão do admin/professor quanto na
    visão do próprio aluno em `/aluno/dossie`) depois que o staff aprova —
    é o registro oficial de conquistas, não a fila de lançamentos
    pendentes/rejeitados (essa fica só na tela de gestão das Fases
    12.4/12.5).
12. **Filtro por evento no ranking**: como o evento agora vem de um
    catálogo (decisão 1), staff e aluno filtram o ranking escolhendo/
    buscando um evento existente (autocomplete pelo nome, não texto
    livre). Ao filtrar por um evento, a tela mostra **todos os
    participantes** daquele evento com lançamento aprovado — inclusive
    quem só participou (nível `participacao`), não só quem subiu ao
    pódio — ordenados pelos pontos calculados para aquele evento
    (considerando o override da decisão 5, se houver); o filtro por
    evento independe do ano selecionado (um evento tem data fixa).

- [x] **12.1 — Migration: `medals` + `medal_point_rules` + `medal_events` + `medal_event_point_rules`**
  Critério de pronto: 4 tabelas com RLS. `medal_events` (school_id, name,
  organization nullable, event_date, modality_id nullable FK `modalities`
  — sugestão, created_by_user_id, created_at/updated_at).
  `medal_event_point_rules` (event_id FK `medal_events`, level enum
  ouro/prata/bronze/participacao, points, unique(event_id, level)) —
  override por evento da decisão 5. `medal_point_rules` (school_id, level
  enum, points, unique(school_id, level)) — default da escola, com seed
  automático dos 4 níveis ao criar uma escola (trigger, mesmo padrão da
  Fase 1.2/2.1). `medals` (school_id, student_id, event_id FK
  `medal_events` not null, modality_id nullable FK `modalities` —
  modalidade real da participação do aluno, category nullable, level enum
  ouro/prata/bronze/participacao, proof_url nullable, status enum
  pending/approved/rejected, submitted_by_student_id nullable,
  submitted_by_user_id nullable — exatamente um dos dois preenchido via
  CHECK, reviewed_by_user_id nullable, reviewed_at nullable,
  rejection_reason nullable). Policies: leitura de `medal_events`/
  `medal_event_point_rules`/`medal_point_rules` liberada para todo
  autenticado da escola (aluno precisa ver o catálogo e a pontuação para
  escolher ao lançar); escrita de evento/override/default só staff
  (admin cria/edita `medal_point_rules`; admin ou professor cria/edita
  `medal_events`/`medal_event_point_rules`). `medals`: aluno lê próprias
  medalhas (qualquer status) + medalhas `approved` de qualquer aluno da
  escola (para o ranking), só insere/edita as próprias e nunca define
  `status=approved`; staff lê/insere/edita todas as medalhas da escola e é
  o único que pode aprovar/rejeitar.
  Migration `20260719120000_medals_system.sql` aplicada no Supabase
  compartilhado (`nexusdojo-dev`) via `supabase db push --db-url`; inclui
  backfill de `medal_point_rules` para a escola já existente no ambiente
  (`create_default_medal_point_rules` só dispara em escolas novas). RLS de
  aluno modelada com `using`/`with check` assimétricos (edição de
  pendente/rejeitado sempre volta a `pending`, nunca preenche campos de
  revisão — aluno nunca se autoaprova). Verificado direto no banco após o
  push: as 4 linhas de `medal_point_rules` (ouro=3/prata=2/bronze=1/
  participação=0) existem para a escola `Gracie Barra Guará`.
  `lib/supabase/database.types.ts` recebeu patch manual com os `Row`/
  `Insert`/`Update`/`Relationships` das 4 tabelas novas (mesmo padrão
  cirúrgico das Fases 9.1/9.2/10.1 — regen completo via `db:types` continua
  pendente de Docker/token de management API). `tsc --noEmit` limpo.

- [x] **12.2 — Tela admin: configurar pontuação default por nível**
  Critério de pronto: tela simples em `(admin)` lista os 4 níveis com o
  campo de pontos editável (`medal_point_rules`), salva via server action
  `requireRole("admin")` com `audit_logs`.
  `modules/medals/points.ts` (`getMedalPointRules`, `resolveMedalPoints` —
  esta última pura, sem I/O, reaproveitada depois no ranking e nos testes
  da 12.9) + `app/(admin)/medals/points/{page,points-form,actions}.tsx`
  (mesmo padrão de `modalities/actions.ts`). Nav: novo grupo "Medalhas" em
  `ADMIN_NAV`/`TEACHER_NAV` e itens em `STUDENT_NAV` (ícone `Award`),
  cobrindo também os hrefs das próximas subtarefas (12.3/12.5/12.7) desde
  já. `tsc --noEmit` limpo.

- [x] **12.3 — Tela staff: cadastro de eventos (com pontuação por evento)**
  Critério de pronto: tela em área staff (admin/professor,
  `requireUser()` aceitando os dois) para criar/editar/listar eventos do
  catálogo (`medal_events`): nome, organização, data, modalidade sugerida
  (opcional); dentro da mesma tela, staff pode opcionalmente definir
  pontos por nível específicos daquele evento
  (`medal_event_point_rules`) — campo vazio mantém o default da escola
  (tela 12.2), sem exigir preenchimento. Evento sem nenhum lançamento
  vinculado pode ser editado/removido livremente; evento com medalhas
  vinculadas só pode ser editado (nunca removido, para não perder
  histórico).
  `modules/medals/events.ts` (`"use server"` no topo do módulo, mesmo
  padrão de `internal-notes.ts`: ações exportadas direto, sem
  `actions.ts` por rota) + `components/medals/{event-form,event-list}.tsx`
  (compartilhados) + páginas espelhadas em `(admin)/medals/events` e
  `(teacher)/professor/medals/events` (list/new/[id]/edit). Remoção
  bloqueada tanto na aplicação (checagem antes) quanto no banco (FK
  `medals.event_id on delete restrict`, defesa em profundidade).
  `tsc --noEmit` limpo.

- [x] **12.4 — Fluxo do aluno: lançar desempenho e gerenciar minhas medalhas**
  Critério de pronto: formulário em `(student)` primeiro exige escolher
  um evento existente do catálogo (12.3) — sem opção de criar evento novo
  pelo aluno — depois preenche os campos da decisão 2 (modalidade,
  categoria/peso, nível, comprovante); cria registro `pending` vinculado
  ao próprio aluno. Listagem "Minhas medalhas" mostra status (pendente/
  aprovada/rejeitada) e, quando rejeitada, o motivo; lançamento rejeitado
  pode ser editado (inclusive trocar o evento escolhido) e reenviado
  (volta a `pending`); lançamento `pending`/`approved` não pode ser
  apagado (só editado enquanto pendente ou rejeitado).
  Migration adicional (`20260719121000_medals_student_modalities_access.sql`):
  `modalities` só tinha policy de select para staff (Fase 2.1) — aluno
  precisa da lista para o campo de modalidade do formulário; mesmo padrão
  de correção já aplicado a class_groups/class_sessions/teachers/belts na
  Fase 9.6. `modules/medals/student-actions.ts` (`"use server"`) +
  `components/medals/medal-launch-form.tsx` (compartilhado entre novo/
  editar) + `app/(student)/aluno/medalhas/{page,new/page,[id]/edit/page}.tsx`.
  Edição sempre limpa `reviewed_by_user_id`/`reviewed_at`/
  `rejection_reason` no mesmo update que volta o status a `pending` — a
  policy de RLS de update do aluno exige os dois primeiros nulos no estado
  pós-update, e um lançamento rejeitado chega com ambos preenchidos pela
  análise anterior. `StatusBadge` ganhou as chaves `approved`/`rejected`.
  `tsc --noEmit` e `eslint` limpos.

- [x] **12.5 — Fluxo do professor/admin: fila de aprovação**
  Critério de pronto: tela lista lançamentos pendentes da escola (com
  filtro por aluno), ação aprovar (grava `reviewed_by_user_id`/
  `reviewed_at`) e ação rejeitar (exige motivo, mesmos campos); ao
  decidir, dispara notificação ao aluno (`notifications`, novos tipos
  `medal_approved`/`medal_rejected`) e loga em `audit_logs`.
  `modules/medals/approvals.ts` (`getPendingMedals`, `approveMedal`,
  `rejectMedal`) + `components/medals/approval-queue.tsx` (busca por aluno
  client-side, mesmo padrão da Fase 9.9; rejeição usa `ConfirmDialog` com
  textarea do motivo) + páginas espelhadas em `(admin)/medals/approvals` e
  `(teacher)/professor/medals/approvals`. `notifications-client.tsx` e
  `NotificationPayload` ganharam os campos/labels de `medal_approved`/
  `medal_rejected`. Bug de embed evitado: `medals` tem 2 FKs para
  `students` (`student_id` e `submitted_by_student_id`) — select precisou
  do hint explícito `students!medals_student_id_fkey(...)` (PostgREST
  rejeita embed ambíguo sem isso). `tsc --noEmit` e `eslint` limpos.

- [x] **12.6 — Fluxo do professor/admin: lançar medalha em nome de um aluno**
  Critério de pronto: a partir da ficha do aluno (ou da tela de
  medalhas), admin/professor lança uma medalha para qualquer aluno da
  escola escolhendo um evento existente do catálogo (12.3) — mesmo
  seletor de evento usado pelo aluno, sem digitar dados do evento à mão —
  gravando `submitted_by_user_id` (não `submitted_by_student_id`); nasce
  direto como `approved` (decisão 8 do preâmbulo), com
  `reviewed_by_user_id`/`reviewed_at` preenchidos com o próprio autor do
  lançamento — não entra na fila de aprovação da 12.5 e já aparece
  imediatamente no ranking (12.7) e no dossiê (12.8).
  `modules/medals/staff-launch.ts` (`getStaffMedalLaunchFormData`,
  `launchMedalForStudent`) + `components/medals/launch-for-student-button.tsx`
  (modal próprio em vez de `ConfirmDialog` — precisa de campos de
  formulário, não só confirmação); botão adicionado na ficha do aluno no
  admin (`students/[id]/edit/page.tsx`, mesma linha do "Criar login"/
  "Resetar senha") e na página do aluno no professor
  (`professor/students/[id]/page.tsx`, ao lado do `BackLink`) — mesmo
  padrão de reaproveitar formulário/eventos do catálogo sem duplicar
  lógica de validação. `tsc --noEmit` e `eslint` limpos.

- [x] **12.7 — Ranking anual (todos os alunos, com histórico por ano)**
  Critério de pronto: tela de ranking acessível para aluno/professor/admin
  lista todos os alunos da escola ordenados por soma de pontos das
  medalhas `approved` do ano selecionado (seletor de ano, corrente por
  padrão), com nome/foto/faixa (reaproveitando `student_directory` da
  Fase 9.9) e posição; pontos de cada medalha calculados com override do
  evento quando existir, senão default da escola (decisão 5); empate
  resolvido por critério simples e documentado (ex: nome alfabético);
  aluno sem medalha no ano aparece com 0 pontos, não fica de fora da
  lista. Na visão do aluno (decisão 10), a tela também mostra um resumo
  pessoal: pontos do ano selecionado, pontos totais (todas as medalhas
  aprovadas, todos os anos somados) e a colocação atual do aluno dentro
  do ranking da escola. Filtro por evento (decisão 12) via
  autocomplete/busca no catálogo, disponível para aluno e staff: ao
  selecionar um evento, a lista passa a mostrar todos os participantes
  daquele evento (medalhistas e quem só participou), ordenados pelos
  pontos daquele evento, ignorando o seletor de ano enquanto o filtro
  estiver ativo.
  `modules/medals/ranking.ts` (`aggregateMedalPoints` pura — sem I/O,
  reaproveitada pelos testes da 12.9 — + `getMedalRanking`, que junta
  `student_directory`/`belts` da Fase 9.9 com os overrides por evento e o
  default da escola via `resolveMedalPoints`). Empate: pontos desc, depois
  nome alfabético. Filtro por evento exclui quem não participou (em vez
  de preencher com zero, diferente do filtro por ano). `components/medals/
  {ranking-filters,ranking-table,my-ranking-summary}.tsx` (filtros
  navegam via `router.push(?year=/?event=)`, mesmo padrão de filtro-via-URL
  já usado no projeto) + páginas espelhadas em `(admin)/medals/ranking`,
  `(teacher)/professor/medals/ranking` e `(student)/aluno/ranking` (só
  esta última com o resumo pessoal). `tsc --noEmit` e `eslint` limpos.

- [x] **12.8 — Seção de medalhas aprovadas na ficha/dossiê do aluno**
  Critério de pronto: ficha do aluno no admin/professor e dossiê do
  próprio aluno (`/aluno/dossie`, Fase 10.7) ganham seção com as medalhas
  **aprovadas** (decisão 11 do preâmbulo — registro oficial de
  conquistas, não a fila de pendentes/rejeitados das Fases 12.4/12.5),
  mostrando o evento, quem lançou e quem analisou cada uma; componente
  reaproveitado entre as duas telas em vez de duplicado.
  `modules/medals/history.ts` (`getApprovedMedalsForStudent`) +
  `components/students/medals-section.tsx` (mesmo padrão de
  `InternalNotesSection`, mas só leitura) usado nas 3 telas: dossiê do
  admin, ficha do professor e dossiê do aluno. Embed de `users` também
  precisou de hint explícito (`medals` tem 2 FKs para `users`:
  `submitted_by_user_id`/`reviewed_by_user_id`), mesma causa raiz do bug
  de `students` já resolvido na 12.5. `tsc --noEmit` e `eslint` limpos.

- [x] **12.9 — Testes das regras de negócio**
  Critério de pronto: testes unitários do cálculo de pontuação/ranking
  (empate, ano sem medalhas, override por evento vs. default da escola,
  nível `participacao` contando pontos quando configurado) e testes de
  integração contra o Supabase compartilhado cobrindo RLS (aluno não
  aprova a própria medalha, aluno não cria/edita evento do catálogo,
  aluno não vê lançamento pendente/rejeitado de outro aluno, staff
  aprova/rejeita corretamente, edição só permitida em pending/rejected),
  mesmo padrão de `tests/` já estabelecido na Fase 9.11.
  **2 bugs de infraestrutura de teste encontrados e corrigidos nesta
  subtarefa** (nenhum dos dois é específico da Fase 12, mas bloqueavam a
  verificação limpa exigida pelo critério de pronto):
  1. `npm test` (`vitest run`) não tinha `vitest.config.ts` — o include
     default do vitest também varria `e2e/**` (specs do Playwright) e
     falhava, porque `test()` do Playwright não pode ser chamado fora do
     runner dele. Corrigido com `vitest.config.ts` novo excluindo `e2e/**`
     (o `test:e2e` já existente continua sendo o único jeito de rodar
     esses arquivos).
  2. Mesmo bug já documentado na Fase 9.11 (import `@/` quebra teste
     unitário porque o vitest não resolve esse alias) se repetiu em
     `points.ts`/`ranking.ts`, que misturavam função pura com uma função
     de I/O (`import { createClient } from "@/lib/supabase/server"`) no
     mesmo arquivo. Extraído `resolveMedalPoints`/`MEDAL_LEVELS`/etc. para
     `points-rules.ts` e `aggregateMedalPoints`/`ApprovedMedalRecord` para
     `ranking-rules.ts` (sem nenhum import `@/`); `points.ts`/`ranking.ts`
     passaram a só ter a parte de I/O e reexportar a parte pura
     (`export * from "./points-rules"`), sem alterar nenhum import externo
     existente (`@/modules/medals/points`/`.../ranking` continuam
     funcionando igual para o resto do código).
  47 testes passando (`npx vitest run`), `tsc --noEmit` e `eslint` limpos.

- [x] **12.10 — Dados de demonstração de medalhas e eventos**
  Critério de pronto: script novo em `scripts/` (mesmo padrão de
  `seed-attendance.mjs`/`seed-full-finance.mjs`) popula o ambiente
  compartilhado (`nexusdojo-dev`) com um catálogo de eventos distribuído
  em vários anos (incluindo o ano corrente e ao menos 2 anos anteriores,
  para o seletor de histórico da 12.7 ter o que mostrar), incluindo pelo
  menos 1 evento com override de pontuação (decisão 5) para validar esse
  cálculo; lançamentos de medalha vinculados a esses eventos cobrindo os
  **3 status de workflow** (pending/approved/rejected, incluindo pelo
  menos um caso de rejeitado com motivo e reenviado) e os **4 níveis de
  resultado** (ouro/prata/bronze/participação — este último representando
  quem disputou o evento mas não ganhou medalha, decisão 3); distribuição
  plausível entre os alunos existentes (nem todos com medalha, alguns com
  várias, níveis variados) para o ranking, a fila de aprovação, o
  catálogo de eventos e o dossiê fazerem sentido tanto do lado do staff
  quanto da conta demo do aluno (`aluno@nexusdojo.dev`), que deve ficar
  com histórico próprio (aprovadas de anos diferentes + ao menos um
  pendente) para validar a visão pessoal (pontos anuais/totais/colocação)
  descrita na decisão 10.
  `scripts/seed-medals.mjs`: 6 eventos (2 por ano em 2024/2025/2026),
  override de pontuação aplicado no "Campeonato Brasileiro de Jiu-Jitsu
  2025" (ouro=10/prata=6/bronze=3/participação=1); 25 dos 50 alunos
  (fora a conta demo) receberam de 1 a 3 medalhas cada. Resultado real no
  ambiente compartilhado: 58 medalhas (approved: 46, pending: 8,
  rejected: 4), níveis ouro=14/prata=13/bronze=18/participação=13 (dados
  não determinísticos — sorteio aleatório a cada execução, contagens
  exatas variam). Ciclo completo de rejeitado-e-reenviado simulado
  literalmente (insere `rejected` com motivo, depois faz o mesmo update
  que `updateMyMedal` faria — volta a `pending`, limpa
  `rejection_reason`/`reviewed_by_user_id`/`reviewed_at`), não só um
  `pending` comum. Conta demo (`aluno@nexusdojo.dev`) confirmada com 2
  aprovadas (2026 e 2025, níveis diferentes) + 1 pendente. Verificado
  direto no banco após a execução (contagens de status, override
  presente, histórico da conta demo). `eslint` limpo no script novo.

### Refinamentos pós-implementação (2026-07-19)

Perguntas de refinamento feitas ao usuário depois de completar as 10
subtarefas originais (12.1–12.10). Decisões: comprovante continua como URL
manual (sem upload real por agora) e os dados de demonstração da 12.10
ficam permanentemente no ambiente compartilhado — nenhuma subtarefa nova
para essas duas. As outras duas geraram subtarefas novas:

- [x] **12.11 — Editar medalha aprovada pelo staff**
  Critério de pronto: seção de medalhas do dossiê (admin/professor, nunca
  no dossiê do próprio aluno) ganha botão "Editar" por medalha aprovada,
  abrindo o mesmo tipo de formulário do lançamento em nome do aluno
  (12.6) pré-preenchido, permitindo corrigir evento/modalidade/categoria/
  nível/comprovante sem precisar rejeitar e relançar; não altera
  `status`/`reviewed_by_user_id`/`reviewed_at`, só os dados descritivos;
  loga em `audit_logs`.
  `modules/medals/history.ts` (`ApprovedMedalDisplay`) passou a expor
  `eventId`/`modalityId` crus (não só os nomes), necessários para
  pré-preencher o formulário de edição.
  `updateApprovedMedal` em `modules/medals/staff-launch.ts` (só aceita
  editar quando `status = 'approved'`, devolve erro claro se não) +
  `components/medals/edit-approved-medal-button.tsx` (mesmo padrão visual
  de `LaunchMedalForStudentButton`) + `MedalsSection` ganhou prop opcional
  `canEdit`/`events`/`modalities` (default `false`/`[]`/`[]`, então o
  dossiê do aluno continua sem o botão sem precisar de nenhuma mudança
  ali). Defesa contra evento inativo (12.12): o botão de editar garante
  que o evento atual da medalha apareça no `<select>` mesmo se não
  estiver mais na lista de eventos ativos, para não trocar o evento por
  engano ao salvar. Wired no dossiê do admin (que passou a buscar
  `getStaffMedalLaunchFormData()`, antes só usado na ficha do professor) e
  na ficha do professor (reaproveitando o fetch que já existia para o
  botão de lançar). `tsc --noEmit` e `eslint` limpos.

- [x] **12.12 — Status ativo/inativo em eventos de medalha**
  Critério de pronto: `medal_events` ganha coluna `status`
  (`active`/`inactive`, default `active`, mesmo padrão de `modalities`);
  tela de cadastro de evento (12.3) ganha o campo; evento `inactive` sai
  das listas de escolha nos formulários de lançamento (aluno na 12.4,
  staff na 12.6/12.11) mas continua aparecendo no filtro de evento do
  ranking (12.7) e no histórico do dossiê (12.8) — nenhum dado histórico
  se perde ao inativar um evento.
  Migration `20260719130000_medal_events_status.sql` aplicada no Supabase
  compartilhado. `listMedalEventOptions(schoolId, { activeOnly })` ganhou
  o parâmetro (default `true`) — chamadas de lançamento (student-actions,
  staff-launch) continuam com o default; `getMedalRanking` passou a
  chamar com `{ activeOnly: false }` explicitamente, único ponto que
  precisa ver eventos inativos. `database.types.ts` recebeu o patch
  manual da coluna nova. `tsc --noEmit`, `eslint` e os 47 testes
  (`npx vitest run`) limpos.
  Com a 12.11/12.12, os refinamentos pós-implementação pedidos pelo
  usuário estão concluídos.

### Teste e2e do fluxo de medalhas + correção de bug de bundling client (2026-07-19)

A pedido do usuário, criado `e2e/medals.spec.ts` (mesmo padrão de
`attendance-signal.spec.ts`/`reset-password.spec.ts`): aluno loga, lança
medalha para um evento existente do catálogo (fica `pending`), admin loga,
aprova na fila de aprovação (12.5), aluno loga de novo e confirma que a
medalha aprovada passa a constar no dossiê (`/aluno/dossie`, 12.8). Limpa o
registro criado ao final (`admin.from("medals").delete()`) para não deixar
dado residual no ambiente compartilhado a cada execução.

**Bug real encontrado ao rodar o teste pela primeira vez** (não é
específico do teste — já quebrava a tela para qualquer usuário real):
`/aluno/medalhas/new` (e outras 5 telas do módulo) travava com Build Error
do Next.js ("You're importing a module that depends on next/headers").
Causa: 6 componentes `"use client"` importavam `MEDAL_LEVEL_LABELS` de
`modules/medals/points.ts`, que também expõe `getMedalPointRules` (função
de I/O que importa `@/lib/supabase/server` → `next/headers`) — o bundler
puxa o módulo inteiro pro bundle do cliente mesmo só usando a constante
pura. A separação pura/I/O já existia desde a 12.9
(`modules/medals/points-rules.ts`, sem nenhum import `@/`), só não estava
sendo usada pelos componentes client. Corrigido trocando o import para
`points-rules` em `medal-launch-form.tsx`, `event-form.tsx`,
`edit-approved-medal-button.tsx`, `launch-for-student-button.tsx`,
`approval-queue.tsx` e `points-form.tsx` (`app/(admin)/medals/points/`) —
zero mudança de comportamento, só a origem do import.

**2 bugs de seletor no teste, encontrados e corrigidos durante a
validação** (nenhum é bug de produto): a conta demo do aluno se chama
literalmente "Aluno" e o ambiente tem dezenas de alunos de seed nomeados
"Aluno Dev NN - Fulano" — filtrar a fila de aprovação só por
nome-substring + nome do evento aprovou o lançamento errado (de outro
aluno) na primeira tentativa; corrigido ancorando pelo nome exato do aluno
via regex `^nome$`. Depois, o card de medalha no dossiê usava
`div.rounded-lg` como seletor, que também casa com o `<div>` do wrapper
inteiro da seção `MedalsSection` (mesma classe usada no wrapper e em cada
card) — corrigido restringindo a `div.rounded-lg.bg-background`, classe só
dos cards individuais.

`tsc --noEmit`, `eslint` e os 47 testes (`npx vitest run`) limpos. Suíte
e2e completa rodada em chromium: `medals.spec.ts` passou 2x seguidas
(confirma que a limpeza não deixa resíduo); `attendance-signal.spec.ts`
falhou nessa rodada por motivo não relacionado (não há arquivo de
presença tocado nesta sessão — provável dependência de horário/janela de
sinalização de aula no momento do teste, não investigado aqui).

### Investigação e correção do bug de RLS em class_sessions (2026-07-19)

A pedido do usuário, investigada a falha do `attendance-signal.spec.ts`
apontada acima. Causa não era de horário: o teste sempre rodava contra a
data de **hoje** e, no dia em que essa investigação aconteceu (2026-07-19,
domingo), nenhuma turma do catálogo roda aos domingos (`class_groups.
week_days` só usa `1`–`6`, nunca `0`) — a Agenda ficava sem nenhum botão
"Sinalizar presença" na tela. Corrigido `e2e/attendance-signal.spec.ts`
para navegar para `/aluno?date=` da segunda-feira mais próxima (hoje
mesmo, se já for segunda; senão a próxima) em vez de depender da data
corrente — sempre dentro da janela de 7 dias de antecedência de
`checkSignalWindow` (`modules/students/signal-rules.ts`).

**Bug real de produto encontrado ao validar esse ajuste** (não é
específico do teste): sinalizar presença numa turma cuja `class_sessions`
daquele dia ainda não existe (nenhum staff mexeu nela ainda) falhava com
`"new row violates row-level security policy for table class_sessions"` —
confirmado inspecionando a resposta real da server action no trace do
Playwright (o toast de erro aparecia e sumia rápido, por isso parecia que
"nada acontecia" num primeiro olhar). Causa raiz: a policy de insert em
`class_sessions` (`20260704004656_create_class_sessions.sql`) só libera
para staff via `current_school_id()` (resolve a partir de `public.users`);
a migration da Fase 9.6 (`20260712100000_student_agenda_read_access.sql`)
deu ao aluno só **leitura** em `class_sessions`, nunca **insert** — ao
contrário de `attendances`, que já tinha a policy de insert do aluno desde
a Fase 9.4 (`20260711150000`). Isso contradizia o próprio comentário de
`modules/classes/session-materialization.ts` ("quem chama já deve ter
resolvido schoolId a partir de um perfil autenticado (staff **ou
aluno**)"): a materialização de sessão pelo aluno nunca funcionou de
verdade. Ficava mascarado no dia a dia porque normalmente algum staff já
tinha aberto a tela de chamada do dia antes do aluno sinalizar,
materializando a sessão primeiro — só apareceu ao testar contra uma data
futura que ninguém, nem staff, tinha tocado ainda (o cenário que a Fase
9.3 deveria suportar: aluno sinalizando de véspera).

Migration `20260719140000_class_sessions_student_insert.sql` (nova
policy `"students can insert own school class_sessions"`, mesmo padrão de
`attendances`/`current_student_school_id()`) aplicada no Supabase
compartilhado (`nexusdojo-dev`) via `supabase db push --db-url`; não
precisou de patch em `database.types.ts` (só policy nova, sem mudança de
schema). Suíte e2e completa (5 testes, chromium) passando, incluindo
`attendance-signal.spec.ts` 2x seguidas. `tsc --noEmit`, `eslint` e os 47
testes (`npx vitest run`) limpos.

### Suíte e2e em Firefox e Webkit (2026-07-19)

A pedido do usuário, rodada a suíte completa também em firefox e webkit
(antes só validada em chromium). Achado real: navegar de volta para uma
rota do app (`page.goto`) enquanto já existe sessão ativa **nunca dispara
o evento `load` no Firefox** contra o servidor dev do Next.js — o `goto`
travava até estourar o `navigationTimeout` (60s), derrubando
`attendance-signal.spec.ts`, `medals.spec.ts` e `reset-password.spec.ts`
inteiros nesse navegador. Corrigido trocando todo `page.goto(...)` para
`{ waitUntil: "domcontentloaded" }` seguido de
`page.waitForLoadState("networkidle")` explícito antes de qualquer
interação (padrão aplicado nos 3 specs) — elimina o travamento de vez.

**Webkit**: corrigido um bug real do teste (não do produto) em
`medals.spec.ts` — depois de aprovar a medalha, o `router.refresh()` do
client dispara uma navegação que ainda estava em andamento quando o teste
já chamava `page.goto("/login")` pra trocar de usuário; Webkit trata isso
como erro de navegação interrompida (Chromium tolera silenciosamente).
Corrigido com `waitForLoadState("networkidle")` antes de trocar de
usuário. Com as duas correções, Webkit passa os 5 testes de forma
consistente.

**Firefox continua instável mesmo após a correção do travamento** — não é
mais timeout puro, mas falhas variáveis (toast que não aparece, elemento
"detached from the DOM" no meio de um clique, modal que não abre).
Investigando o trace de rede de uma falha em `medals.spec.ts`, a página
`/aluno/medalhas/new` foi recarregada sozinha **8 vezes** (GET repetido
pra mesma URL, sem nenhuma ação do teste) antes do clique em "Lançar
medalha" — indício de que o servidor dev do Next.js (Turbopack/Fast
Refresh) está disparando reloads automáticos da página especificamente no
Firefox nesse ambiente (projeto rodando em disco de rede), cada um
resetando a hidratação; se o clique do teste cai no meio de um desses
reloads, vira submit nativo (GET, aparece na URL como querystring) em vez
de disparar a server action. Esse comportamento só existe em `next dev`
(HMR não existe em build de produção) — não é um bug de produto, e não é
algo resolvível ajustando waits/timeouts do teste. **Não investigado até o
fim**: confirmar contra `next build && next start` (sem Turbopack dev)
ficou de fora do escopo desta sessão a pedido do usuário. Se algum dia for
necessário Firefox no CI, começar por aí.

Confirmado que o Chromium continua 100% estável (5/5, reforçando fluxo
normal ~1min) quando rodado isolado — um flake pontual visto numa rodada
anterior foi sobrecarga do processo do servidor dev (mesmo processo
`next dev`, reaproveitado via `reuseExistingServer`, atendendo várias
rodadas completas de 15 testes em 3 navegadores em sequência sem reiniciar
nada), não regressão de código.

`tsc --noEmit`, `eslint` e os 47 testes (`npx vitest run`) limpos.

---

## Fase 13 — Configurações Gerais da Academia (2026-07-21)

Baseado em `melhorias/Especificacoes_GB_Bandeirante.txt`. Objetivo: módulo
exclusivo do administrador com configurações globais do sistema,
expansível para novas configurações no futuro (primeiro grupo de nav
"Configurações" do projeto — hoje não existe nenhum). Incremento sobre o
que já existe, não recriação: a Fase 6.3 já mostra "nº de presenças desde a
última graduação e tempo decorrido" como indicador solto, sem meta; esta
fase adiciona a meta configurável por transição de faixa (que não existia)
e a comparação contra essa meta. Toda exibição de faixa reaproveita
`BeltPreview`/`BeltWithPreview` (`components/belts/belt-preview.tsx`), sem
criar nenhum componente novo. O sistema nunca gradua automaticamente — só
sinaliza aptidão; a decisão continua sendo exclusiva do professor.

- [ ] **13.1 — Migration + tela "Configurações → Graduação" (meta de aulas por transição de faixa)**
  Critério de pronto: nova tabela (ex: `belt_graduation_requirements`:
  school_id, belt_system_id, from_belt_id nullable para a primeira faixa,
  to_belt_id, required_classes, created_at/updated_at) com RLS (leitura
  staff + aluno, escrita só admin); tela nova em `(admin)` lista apenas as
  transições de faixa realmente cadastradas no(s) `belt_system(s)` da
  escola (não as 21 combinações teóricas do catálogo IBJJF inteiro), com
  campo editável de "nº de aulas" salvando imediatamente por transição
  alterada; validação: inteiro >= 0, sem negativos. Mesmo padrão de tela
  "configurar valores default de uma tabela" já usado em
  `app/(admin)/medals/points` (Fase 12.2).

- [ ] **13.2 — Cálculo de aptidão e indicador para professor/admin**
  Critério de pronto: função pura nova (sem import `@/`, mesma convenção
  já documentada nas Fases 9.11/12.9 para não quebrar o vitest — ex:
  `modules/graduation/eligibility-rules.ts`) que compara as presenças
  desde a última graduação (já calculadas na Fase 6.3) contra a meta
  configurada (13.1) para a transição de faixa atual do aluno, retornando
  apto/não apto e quantas faltam. Usada (a) na tela de chamada existente,
  mostrando ao lado do nome do aluno algo como "78 aulas · faltam 22 para
  apto" ou "Apto para graduação" em destaque verde quando atingido — nunca
  altera a faixa automaticamente; (b) novo indicador no dashboard do
  professor (Fase 7.2): "Alunos aptos para graduação" (quantidade + lista
  com nome, data da última graduação, total de aulas).

- [ ] **13.3 — Card "Sua evolução" no painel do aluno**
  Critério de pronto: no painel do aluno (`/aluno/painel`, Fase 9.8), novo
  card com faixa atual, aulas realizadas, meta da transição atual, quantas
  faltam, e mensagem de conquista ("Você atingiu a quantidade mínima de
  aulas para estar apto à graduação") quando atingida — nunca com data
  prevista nem promessa de graduação. Aluno sem meta configurada para a
  própria transição (13.1 vazio) não mostra o card, em vez de quebrar ou
  mostrar meta zero.

- [ ] **13.4 — Testes das regras de negócio**
  Critério de pronto: testes unitários da função de elegibilidade (13.2)
  cobrindo aluno sem meta configurada, aluno exatamente na meta, aluno
  acima da meta, múltiplas transições; teste de integração confirmando que
  só admin edita `belt_graduation_requirements` (RLS) e que professor/aluno
  só leem.

---

## Fase 14 — Posição da Semana (2026-07-21)

Baseado em `melhorias/Especificacoes_GB_Bandeirante.txt`. Funcionalidade
100% nova — não existe hoje nenhum conteúdo editorial/técnica publicada no
sistema. Upload de imagem reaproveita o Supabase Storage já configurado na
Fase 8.1 (fotos de aluno/professor).

- [ ] **14.1 — Migration: `weekly_positions` (técnica da semana)**
  Critério de pronto: tabela `weekly_positions` (school_id, title,
  description, image_url, youtube_url nullable, start_date, end_date
  nullable, published boolean, created_by_user_id, created_at/updated_at)
  com RLS (staff insere/edita; aluno só lê publicadas); regra "só uma ativa
  por vez" garantida na aplicação — ao publicar uma nova posição ativa, a
  anterior da mesma escola é desativada na mesma transação.

- [ ] **14.2 — Tela staff de cadastro ("Conteúdo → Posição da Semana")**
  Critério de pronto: nova área staff (admin e professor, mesmo padrão de
  acesso `requireUser()` aceitando os dois papéis já usado nas Fases
  10.7/12.3) para criar/editar/listar posições, com upload de imagem
  (Storage), campo de vídeo do YouTube opcional, datas de início/fim,
  toggle "publicado".

- [ ] **14.3 — Exibição na área do aluno**
  Critério de pronto: card "🥋 Posição da Semana" na tela inicial do aluno
  (agenda, Fase 9.6) com imagem, título, descrição resumida e botão "Saiba
  mais"; se houver vídeo do YouTube, abre modal com o player embutido;
  imagem responsiva em qualquer viewport.

- [ ] **14.4 — Testes**
  Critério de pronto: teste de integração confirmando que, ao publicar uma
  nova posição ativa, a anterior é desativada automaticamente, e que o
  aluno só enxerga a posição publicada dentro da vigência.

---

## Fase 15 — Mensagens Automáticas de Aniversário (2026-07-21)

Baseado em `melhorias/Especificacoes_GB_Bandeirante.txt`. Decisões
confirmadas com o usuário em 2026-07-21: (1) **apenas canal WhatsApp**
nesta fase — reaproveita `sendWhatsAppMessage` (`lib/evolution/client.ts`,
Fase 8.3) já existente; push e e-mail ficam fora de escopo (sem
infraestrutura própria no projeto — não existe web-push/VAPID nem
provedor de e-mail), os toggles correspondentes do documento original de
especificação não entram nesta fase; (2) agendamento diário via **Vercel
Cron** (rota de API protegida + `vercel.json`), primeiro uso de cron no
projeto — assume que o deploy de produção roda na Vercel; se isso não for
verdade, o mecanismo de disparo precisa ser revisto antes de iniciar 15.3.
A lista de aniversariantes do mês (Fase 8.4) já existe e é reaproveitada
como fonte de dados.

- [ ] **15.1 — Migration: configuração e log de mensagens automáticas**
  Critério de pronto: tabela `birthday_message_settings` (school_id,
  notify_students boolean default true, notify_teachers boolean default
  true, enabled boolean default false — desligado até o admin configurar,
  message_template text com default igual ao exemplo da especificação) +
  tabela `sent_birthday_messages` (school_id, recipient_type enum
  aluno/professor, student_id nullable, teacher_id nullable, date, channel
  default 'whatsapp', status, error_message nullable) com RLS (leitura/
  escrita só admin nas settings; log só leitura staff). Unique constraint
  em `(recipient_type, student_id/teacher_id, date)` para impedir
  duplicidade de envio no mesmo dia.

- [ ] **15.2 — Tela "Configurações → Mensagens Automáticas"**
  Critério de pronto: tela admin com toggles (enviar para alunos / enviar
  para professores, habilitar/desabilitar), editor do template de mensagem
  com as variáveis `{Nome}`/`{Faixa}`/`{Academia}`/`{Professor}`
  (substituição de texto simples, função pura nova sem I/O), preview do
  resultado antes de salvar; mesmo padrão de tela de configuração simples
  das Fases 12.2/13.1.

- [ ] **15.3 — Job diário de disparo (Vercel Cron)**
  Critério de pronto: rota de API protegida por segredo/`Authorization`
  header, agendada via `vercel.json` (`crons`) para rodar 1x ao dia; busca
  aniversariantes do dia (reaproveitando a mesma query da Fase 8.4), monta
  a mensagem a partir do template (15.2) e envia via `sendWhatsAppMessage`
  (Fase 8.3) para quem tiver telefone cadastrado e configuração habilitada;
  grava em `sent_birthday_messages` (sucesso ou erro) e nunca reenvia
  duplicado no mesmo dia (constraint da 15.1); desligar a configuração
  (15.2) impede qualquer envio.

- [ ] **15.4 — Testes**
  Critério de pronto: testes unitários da substituição de variáveis no
  template e da lógica de "quem deve receber hoje" (pura, sem I/O); teste
  de integração confirmando que rodar o job duas vezes no mesmo dia não
  duplica envio (constraint) e que desligar a configuração impede envio.

---

## Fase 16 — Administração de Feriados e Recessos (2026-07-21)

Baseado em `melhorias/Especificacoes_GB_Bandeirante.txt`. Funcionalidade
100% nova. Decisão confirmada com o usuário em 2026-07-21: datas móveis
(Carnaval, Sexta-feira Santa, Corpus Christi) são **calculadas
automaticamente** (algoritmo de cálculo da Páscoa), não cadastradas
manualmente ano a ano. Reaproveita o mesmo mecanismo de disparo diário da
Fase 15.3 (Vercel Cron) para os avisos antecipados — mesma dependência de a
produção rodar na Vercel, e mesma limitação de canal (só WhatsApp).

- [ ] **16.1 — Migration + seed de feriados nacionais**
  Critério de pronto: tabela `holidays` (school_id, name, date, recurring
  boolean, has_class boolean default false, custom_message nullable,
  created_at/updated_at) com RLS (staff lê/escreve, aluno só lê);
  script/seed que popula automaticamente os feriados nacionais fixos e
  móveis (calculados) do ano corrente e do próximo para escolas já
  existentes, e via trigger/função para escolas novas (mesmo padrão de
  seed automático das Fases 1/2/5/12.1).

- [ ] **16.2 — Tela "Calendário → Feriados"**
  Critério de pronto: CRUD staff (admin) dos feriados/recessos da escola —
  nome, data, recorrente, haverá aula (sim/não), mensagem personalizada
  opcional; feriados calculados automaticamente (16.1) aparecem
  pré-cadastrados e podem ser editados (ex: marcar "haverá aula" numa data
  que normalmente não teria).

- [ ] **16.3 — Bloqueio de presença/check-in em dia sem aula**
  Critério de pronto: quando `has_class = false` para a data, a
  sinalização de presença do aluno (`modules/students/signal-rules.ts`,
  Fase 9.4) e a abertura de chamada do professor ficam bloqueadas para
  aquela data, com aviso visível na agenda do aluno (Fase 9.6) e na tela
  "Turmas do dia" (Fase 3.3).

- [ ] **16.4 — Notificações de aviso (2 dias antes, 1 dia antes, no dia)**
  Critério de pronto: reaproveita o job diário da Fase 15.3 (mesma rota de
  cron, nova responsabilidade) para verificar feriados nos próximos 2
  dias/1 dia/hoje e enviar aviso via WhatsApp (mesma limitação de canal da
  Fase 15) para alunos e professores ativos, usando template com variáveis
  `{Nome}`/`{Data}`/`{NomeFeriado}`/`{Academia}`, editável pelo admin
  (16.2); não enviar duplicado (mesmo padrão de log/constraint da 15.1).

- [ ] **16.5 — Testes**
  Critério de pronto: teste unitário do cálculo de datas móveis
  (Páscoa/Carnaval/Sexta Santa/Corpus Christi) para múltiplos anos; teste
  de integração confirmando bloqueio de sinalização/chamada em dia sem
  aula e liberação normal quando `has_class = true`.

---

## Fase 17 — Sugestões, Reclamações e Feedback dos Alunos (2026-07-21)

Baseado em `melhorias/Especificacoes_GB_Bandeirante.txt`. Funcionalidade
100% nova — arquiteturalmente mais próxima do `InternalNotesSection`/
`modules/students/internal-notes.ts` (Fase 10.7, thread de comentários
anexada a um registro), reaproveitado como referência de convenção, não de
código (é uma entidade nova, não uma nota interna). Mesma limitação de
canal de notificação da Fase 15 (só WhatsApp + in-app, sem push/e-mail).

- [ ] **17.1 — Migration: `feedback` + `feedback_messages`**
  Critério de pronto: tabela `feedback` (school_id, student_id, type enum
  sugestão/elogio/reclamação/dúvida, title, target enum
  professor/administrador/ambos, teacher_id nullable quando target inclui
  professor, status enum recebida/em_analise/respondida/encerrada,
  created_at) + `feedback_messages` (feedback_id, author_user_id nullable,
  author_student_id nullable, body, attachment_url nullable, created_at) —
  thread de mensagens por feedback. RLS: aluno lê/cria só os próprios;
  admin lê/responde tudo; professor lê/responde só quando é o destinatário
  (`target` inclui professor E `teacher_id` bate, ou `target = ambos`).

- [ ] **17.2 — Tela do aluno "Fale Conosco"**
  Critério de pronto: novo item em `STUDENT_NAV`; formulário de criação
  (tipo, título, mensagem, destinatário, anexo opcional reaproveitando
  Storage da Fase 8.1); listagem com histórico e status (recebida/em
  análise/respondida/encerrada); abrir um item mostra a conversa em
  formato de chat e permite responder.

- [ ] **17.3 — Painel staff de gestão**
  Critério de pronto: tela staff (admin sempre vê tudo; professor só os
  direcionados a ele) com filtros por status/professor/aluno/tipo;
  responder abre a mesma thread em formato de chat; ao decidir/responder,
  muda o status.

- [ ] **17.4 — Notificações de resposta**
  Critério de pronto: ao staff responder, aluno recebe notificação in-app
  (reaproveitando `notifications`, mesmo padrão das Fases 9.5/12.5) e
  WhatsApp (mesma limitação de canal da Fase 15 — sem push/e-mail nesta
  fase).

- [ ] **17.5 — Auditoria**
  Critério de pronto: toda criação/resposta grava em `audit_logs` via
  `logAuditEvent` (quem criou, quem respondeu, data). Captura de IP fica
  fora de escopo nesta subtarefa — o sistema não tem hoje nenhuma captura
  de IP em nenhum outro fluxo; registrar essa limitação em vez de inventar
  uma captação nova sem necessidade comprovada.

- [ ] **17.6 — Exportação PDF/Excel**
  Critério de pronto: no painel staff (17.3), exportar o histórico
  filtrado da tela atual em PDF e em Excel/CSV.

- [ ] **17.7 — Testes**
  Critério de pronto: teste de integração confirmando RLS (aluno não vê
  feedback de outro aluno; professor não vê feedback não direcionado a
  ele; admin vê tudo).
