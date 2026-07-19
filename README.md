# NexusDojo

Sistema SaaS para gestao de escolas de lutas, iniciado com foco em jiu-jitsu
mas planejado para outras modalidades como no-gi, muay thai, boxe, wrestling,
defesa pessoal e funcional.

O produto parte de algumas regras centrais:

- Turmas sao horarios/aulas disponiveis, nao grupos fechados de alunos.
- Aluno com plano ativo pode treinar nas turmas disponiveis sem limite semanal
  de aulas controlado pelo sistema.
- Presenca registra a aula real feita; para graduacao, indicadores devem contar
  no maximo uma presenca por dia por modalidade.
- Financeiro separa tabela de preco, plano, contrato e parcelas.
- Professores tem acesso pratico a chamada e historico; administradores gerem
  usuarios, financeiro, cadastros e relatorios.

## Documentacao principal

- `NEXUSDOJO_PROJECT.md`: documento mestre de produto e escopo.
- `TASK.md`: progresso e decisoes operacionais do projeto.
- `CLAUDE.md`: protocolo de trabalho colaborativo.
- `DESIGN-pinterest.md`: design system vigente.
- `docs/TEST_ACCOUNTS.md`: contas dedicadas para testes por desenvolvedor.

## Desenvolvimento

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

Validacao local:

```bash
npm run lint
npm run build
npm test
```

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth/Postgres/RLS
- React Hook Form
- Zod
- shadcn/ui

## Modulo do aluno

- Aluno tem login proprio (`/aluno`), separado de admin/professor.
- Agenda com sinalizacao de presenca, painel, financeiro (leitura),
  medalhas/ranking, notificacoes e perfil.
- Professor confirma/inclui presenca sinalizada em `/attendance/[id]/roll-call`.

## Sistema de medalhas e ranking

- Staff (admin/professor) cadastra o catalogo de eventos; aluno lanca seu
  desempenho escolhendo um evento existente; staff aprova ou rejeita.
- Ranking anual soma pontos por nivel (ouro/prata/bronze/participacao),
  configuravel por escola ou por evento, visivel para todos os perfis.

## Landing page publica

- `/` exibe a landing institucional publicada da escola.
- `/landing` e a tela admin de gestao da landing page.
- Conteudo, imagens, professores publicados e horarios publicados ficam no
  Supabase nas tabelas `landing_pages`, `landing_teacher_profiles` e
  `landing_class_groups`.
- Imagens da landing e avatares usam upload para o bucket `avatars`; a tela
  nao deve voltar a aceitar URL manual em campos de imagem.
- Professores publicados na landing usam a imagem de avatar salva em
  `teachers.photo_url`. A orientacao de enquadramento para professores e
  imagens verticais e `1200 x 1600 px` (3:4).

## Deploy na Vercel

Variaveis de ambiente necessarias em runtime:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_DB_PASSWORD` nao e usada em runtime pela aplicacao; ela so e
necessaria para CLI/scripts/migrations. A migration da landing ja foi aplicada
no Supabase remoto usado pelo ambiente local.
