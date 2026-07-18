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

## Papéis (MVP 1A)

- `admin` — gestão completa da escola.
- `teacher` — chamada, fichas de aluno, dashboard próprio.

Papéis futuros: `student`, `guardian` (área logada, MVP 2).

## Onde encontrar o quê

| Arquivo | Conteúdo |
|---|---|
| `NEXUSDOJO_PROJECT.md` | Escopo completo, modelo de dados, regras de negócio |
| `TASK.md` | Progresso por subtarefa, fonte única da verdade do que já foi feito |
| `docs/FINANCEIRO.md` | Regras e fluxo do módulo financeiro |
| `docs/ROADMAP.md` | Fases do projeto e o que entra em cada uma |
| `docs/DECISIONS.md` | Decisões técnicas já tomadas e o porquê |
| `CLAUDE.md` | Protocolo de trabalho entre os dois devs via Git |

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
