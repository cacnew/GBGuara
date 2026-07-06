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
```

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth/Postgres/RLS
- React Hook Form
- Zod
- shadcn/ui
