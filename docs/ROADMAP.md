# ROADMAP.md — NexusDojo

Visão de alto nível das fases do projeto. O detalhamento subtarefa a
subtarefa, com checkboxes e status real, vive em `TASK.md` — esse é o
arquivo que deve ser consultado para saber "o que já foi feito". Este
`ROADMAP.md` é só um mapa de navegação entre fases.

| Fase | Nome | Escopo |
|---|---|---|
| 0 | Planejamento e Setup | Projeto Next.js, UI, libs, estrutura de pastas, Supabase local, paleta/tipografia, docs |
| 1 | Base e Autenticação | Supabase Auth, `schools`, `units`, `users`, RLS, onboarding |
| 2 | Cadastros base | `students`, `guardians`, `teachers`, `modalities`, `belts` |
| 3 | Turmas e sessões | `class_groups`, `class_sessions`, turmas do dia |
| 4 | Frequência | `attendances`, tela de chamada mobile-first, constraint de duplicidade |
| 5 | Financeiro núcleo | `price_tables` → `plans` → `contracts` → `contract_installments` → pagamento/inadimplência (ver `docs/FINANCEIRO.md`) |
| 6 | Graduação | `graduation_history`, indicadores de apoio |
| 7 | Dashboards | Admin, professor, financeiro, `audit_logs`, seeds de demo, validação do MVP 1A |
| 8 | MVP 1B | WhatsApp manual, leads, upload de foto, PWA refinado, audit logs completos |
| 9 | Módulo do Aluno (MVP 2) | Login próprio do aluno, agenda/sinalização de presença, chamada com sinalização para o professor, painel, Minha Academia, notificações, perfil |
| 10 | Módulo do Aluno 2 | Reset de senha pelo admin, financeiro do aluno (leitura), cobrança Pix/QR Code pelo admin, dossiê do aluno |
| 11 | Landing page institucional | Landing pública (`/`) gerenciável pelo admin (`/landing`), conteúdo/imagens/professores/horários vindos do Supabase |
| 12 | Sistema de Medalhas e Ranking | Catálogo de eventos, lançamento de medalha pelo aluno com aprovação do staff, ranking anual com histórico por ano |

## MVP 1A vs MVP 1B

- **MVP 1A** = Fases 0 a 7. Critério de sucesso: seção 22 do
  `NEXUSDOJO_PROJECT.md`, verificado na subtarefa 7.6 do `TASK.md`.
- **MVP 1B** = Fase 8, só inicia após validação formal do MVP 1A.

## MVP 2 e além

- **MVP 2** = Fases 9 e 10 (Módulo do Aluno completo: login próprio,
  agenda, financeiro, dossiê). Aprovado pelo usuário em 2026-07-11
  (`modules/modulo_aluno.md`/`modulo_aluno2.md`).
- Fase 11 (landing institucional) e Fase 12 (medalhas e ranking) foram
  aprovadas depois, fora da sequência numerada original do MVP 2, mas
  seguem a mesma fonte de verdade (`TASK.md`) e o mesmo protocolo de
  execução do `CLAUDE.md`.
- **MVP 3** (pagamento online, currículo técnico, IA, etc.) está fora de
  escopo até novo aviso — ver seção 19 do documento mestre e o rodapé do
  `TASK.md`.

## Polimento pós-MVP 1B

Ajustes de UX/UI feitos após a Fase 8 (fora da numeração de fases do
`TASK.md`, não fazem parte do escopo formal do MVP): sidebar colapsável,
sidebar sempre visível + saída na tela de chamada, scroll independente
entre sidebar e conteúdo, ficha do aluno reorganizada em abas, e
paginação (20 registros/página) em todos os grids de listagem. Decisões
técnicas de cada um em `docs/DECISIONS.md`.

## Como uma fase avança

Cada fase é uma sequência de subtarefas em `TASK.md`, executadas uma de
cada vez seguindo o ciclo de sincronização Git descrito em `CLAUDE.md`
(fetch → pull se houver novidade → confirmar próxima `[ ]` → executar →
marcar `[x]` → commit → push). Blocos marcados como `> PARALELIZÁVEL` no
`TASK.md` podem ser divididos entre os dois devs ou via subagentes.

## Extra: landing institucional

Entregue fora da sequencia formal do MVP: landing publica na raiz `/`,
gerenciada em `/landing`, com conteudo vindo do Supabase e imagens por upload
no bucket `avatars`. O detalhamento operacional esta em `TASK.md` na secao
`Landing page institucional gerenciavel (2026-07-17)`.

## Extra: sistema de medalhas e ranking (Fase 12)

Aluno lança medalhas conquistadas em competições, escolhendo um evento de
um catálogo cadastrado por professor/admin; staff aprova ou rejeita (com
motivo obrigatório); professor/admin também pode lançar em nome de um
aluno, já aprovado direto. Ranking anual soma pontos por nível (ouro/
prata/bronze/participação, configurável por escola ou por evento) de
todos os alunos, com histórico por ano e filtro por evento. Detalhamento
completo em `TASK.md`, seção `Fase 12 — Sistema de Medalhas e Ranking`.
