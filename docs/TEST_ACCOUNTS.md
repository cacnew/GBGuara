# Contas de teste

Atualizado em 2026-07-27.

Estas contas existem no Supabase remoto configurado em `.env.local` e devem
ser usadas para separar testes manuais/e2e por desenvolvedor. Evite usar
`aluno@nexusdojo.dev` em suites paralelas, porque essa conta demo compartilhada
ja causou conflito entre testes de medalhas, presenca e reset de senha.

## Variavel `TEST_STUDENT_EMAIL`

Os arquivos em `tests/integration/*.test.ts` e `e2e/*.spec.ts` que precisam de
uma conta de aluno le em `TEST_STUDENT_EMAIL` (definida em `.env.local`, nao
commitada), com fallback para `aluno@nexusdojo.dev` quando a variavel nao
esta definida (ex: CI sem `.env.local`). Cada dev deve setar essa variavel no
proprio `.env.local` apontando para a sua conta dedicada:

- Carlos/Codex: `TEST_STUDENT_EMAIL=aluno.teste.carlos@nexusdojo.dev`
- Sergio: `TEST_STUDENT_EMAIL=aluno.teste.sergio@nexusdojo.dev`

Isso evita que o codigo compartilhado (que roda para os dois devs) hardcode a
conta de um dos dois. Ao adicionar um novo teste que precisa de uma conta de
aluno, siga o mesmo padrao em vez de hardcodar `aluno@nexusdojo.dev` ou
qualquer conta dedicada diretamente.

## Alunos dedicados

| Dono | Nome no cadastro | E-mail | Senha padrao | Student ID |
|---|---|---|---|---|
| Carlos/Codex | Aluno Teste Carlos | `aluno.teste.carlos@nexusdojo.dev` | `TestSenha123!` | `3ef2fabc-2b8d-4707-9474-2814f8c63f5d` |
| Sergio | Aluno Teste Sergio | `aluno.teste.sergio@nexusdojo.dev` | `TestSenha123!` | `fbefb4df-9d78-4383-a3ae-9f2ec8644fe1` |

## Regras de uso

- Carlos/Codex deve usar `aluno.teste.carlos@nexusdojo.dev` em testes que
  alteram senha, presenca, medalhas, notificacoes ou qualquer estado do aluno.
- Sergio deve usar `aluno.teste.sergio@nexusdojo.dev` para os mesmos tipos de
  teste do lado dele.
- Quando o Sergio pedir para validar algo no Playwright, rode os testes
  autenticados com `aluno.teste.sergio@nexusdojo.dev`, salvo se ele pedir
  explicitamente outra conta.
- Nao rode specs paralelas usando o mesmo aluno se alguma delas altera senha,
  sinalizacao de presenca, medalhas ou dados de perfil.
- Se um teste alterar a senha, restaure para `TestSenha123!` e deixe
  `students.must_change_password = false` ao final.
- Se um teste criar dados residuais, prefira limpar apenas os registros
  criados pelo proprio teste.

## Auth IDs

- Carlos/Codex: `0c87c5dc-01d1-423e-a032-ccae9940e2e7`
- Sergio: `3d95a8dd-61a4-457e-be27-de5e56eac606`
