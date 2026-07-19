# PROJECT.md — NexusDojo

Visão geral do produto. Fonte completa e detalhada: `NEXUSDOJO_PROJECT.md`
(documento mestre, na raiz do repo) — este arquivo é um resumo de
orientação rápida.

## O que é

SaaS de gestão para escolas de luta (jiu-jitsu, no-gi, muay thai, boxe,
wrestling, defesa pessoal, funcional e outras), parte do ecossistema
CAC NEXUS. Multiempresa (`school_id`), começando com escolas-piloto.

## Diferencial

> Flexibilidade operacional real da escola de luta + gestão financeira
> organizada + controle de frequência por aula realizada.

O NexusDojo não trata turma como grupo fechado. Turma = aula/horário/perfil
de treino na grade. O aluno frequenta o que quiser, quantas vezes quiser no
mesmo dia, sem vínculo prévio obrigatório à turma. O sistema só impede
duplicidade de presença na mesma sessão. Frequência é indicador, não
critério automático de graduação — graduação é sempre decisão manual do
professor/admin.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui +
Supabase (Auth, Postgres, RLS) + TanStack Query + React Hook Form + Zod +
date-fns + lucide-react + Recharts + Sonner. Deploy via Vercel. Migrations
em SQL puro via Supabase CLI (sem ORM — ver `docs/DECISIONS.md`).

## Papéis

- `admin` — gestão completa da escola.
- `teacher` — chamada, fichas de aluno, dashboard próprio.
- `student` (desde a Fase 9, MVP 2) — login próprio, agenda com
  sinalização de presença, painel, financeiro (leitura), Minha Academia,
  medalhas/ranking, notificações e perfil.

Papel futuro: `guardian` (área logada, ainda não implementado).

## Onde encontrar o quê

| Arquivo | Conteúdo |
|---|---|
| `NEXUSDOJO_PROJECT.md` | Escopo completo, modelo de dados, regras de negócio |
| `TASK.md` | Progresso por subtarefa, fonte única da verdade do que já foi feito |
| `docs/FINANCEIRO.md` | Regras e fluxo do módulo financeiro |
| `docs/ROADMAP.md` | Fases do projeto e o que entra em cada uma |
| `docs/DECISIONS.md` | Decisões técnicas já tomadas e o porquê |
| `CLAUDE.md` | Protocolo de trabalho entre os dois devs via Git |

## Módulo do aluno (Fases 9 e 10)

O aluno tem login próprio (route group `app/(student)`, prefixo `/aluno`).
Fundação de autenticação e regras de sinalização de presença na Fase 9;
reset de senha, financeiro, cobrança Pix e dossiê na Fase 10.

| Arquivo | Conteudo |
|---|---|
| `lib/permissions/index.ts` | `requireStudent()` |
| `modules/students/agenda.ts` | Agenda, sinalizar/cancelar presença |
| `modules/students/dashboard.ts` | Painel (gráfico mensal, faixas, histórico) |
| `modules/students/academy.ts` | Minha Academia (instrutores/alunos/aulas) |
| `modules/students/finance.ts` | Financeiro do aluno (leitura) |
| `modules/students/notifications.ts` | Feed de notificações |
| `modules/students/account-actions.ts` | Trocar senha/foto do próprio aluno |
| `modules/attendance/roll-call.ts` | Chamada com sinalização (lado professor) |
| `modules/finance/charge-actions.ts` | Envio de cobrança Pix pelo admin |
| `app/(student)/aluno/*` | Telas do aluno (agenda, painel, academia, financeiro, notificações, perfil, dossiê) |
| `app/attendance/[sessionId]/roll-call/*` | Tela de chamada com sinalização (professor/admin) |

## Sistema de medalhas e ranking (Fase 12)

Aluno lança medalhas conquistadas em eventos cadastrados pelo staff;
professor/admin aprova ou rejeita; ranking anual soma pontos por nível.

| Arquivo | Conteudo |
|---|---|
| `modules/medals/points.ts` / `points-rules.ts` | Pontuação default por nível (I/O + lógica pura) |
| `modules/medals/events.ts` | Catálogo de eventos (CRUD + override de pontos) |
| `modules/medals/student-actions.ts` | Aluno lança/edita medalha |
| `modules/medals/approvals.ts` | Fila de aprovação do staff |
| `modules/medals/staff-launch.ts` | Staff lança/edita em nome do aluno |
| `modules/medals/ranking.ts` / `ranking-rules.ts` | Ranking anual (I/O + lógica pura) |
| `modules/medals/history.ts` | Medalhas aprovadas para o dossiê |
| `app/(admin)/medals/*`, `app/(teacher)/professor/medals/*` | Telas de staff (pontuação, eventos, aprovações, ranking) |
| `app/(student)/aluno/medalhas`, `app/(student)/aluno/ranking` | Telas do aluno |
| `scripts/seed-medals.mjs` | Dados de demonstração |

## Landing publica atual

A raiz `/` e uma landing institucional gerenciavel pelo admin. A gestao fica
em `/landing`, dentro do menu `Site publico > Gestao da Landing Page`.

Arquivos principais:

| Arquivo | Conteudo |
|---|---|
| `app/page.tsx` | Landing publica dinamica |
| `app/(admin)/landing/page.tsx` | Entrada admin da gestao da landing |
| `app/(admin)/landing/landing-form.tsx` | Formulario completo de conteudo, imagens, professores e horarios |
| `modules/landing/defaults.ts` | Valores padrao da landing |
| `modules/landing/queries.ts` | Leitura da landing publicada/admin |
| `modules/landing/actions.ts` | Gravacao e upload de imagens |
| `app/landing-schedule.tsx` | Grade semanal publica |
| `supabase/migrations/20260716110000_landing_page_management.sql` | Schema da landing |

O conteudo publicado atual foi carregado no Supabase remoto do `.env.local`.
A escola foi inicialmente preenchida como GB Guara; depois o usuario editou
parte do conteudo no admin para GB Riacho Fundo I. Para dados institucionais,
a fonte da verdade atual e sempre o banco.
