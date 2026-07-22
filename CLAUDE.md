# CLAUDE.md — Projeto Escola de Lutas

## Ambiente Supabase compartilhado de desenvolvimento

- O projeto agora usa um Supabase web compartilhado para desenvolvimento:
  `nexusdojo-dev`.
- As credenciais sensiveis ficam apenas em `.env.local`, que nao deve ser
  commitado:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_DB_PASSWORD`
- Nao colar service role, senha do banco ou JWTs neste arquivo.
- O schema remoto ja recebeu todas as migrations do projeto via
  `npx supabase db push --db-url ...`.
- Setup inicial criado no Supabase web:
  - escola: `Gracie Barra Dev`
  - admin dev: `admin@nexusdojo.dev`
  - senha dev: `TestSenha123!`
- Contas de demonstracao no ambiente compartilhado (todas com a mesma senha
  `TestSenha123!`):
  - Admin: `admin@nexusdojo.dev` (Admin NexusDojo)
  - Aluno: `aluno@nexusdojo.dev` (Aluno — reservada para testes e2e ao vivo,
    nao entra na geracao em massa de dados de demonstracao)
  - Professor: `professor@nexusdojo.dev` (Professor Demo)
  - Professor: `rafael.mendes@demo.nexusdojo.dev` (Professor Rafael Mendes)
  - Professor: `bruno.almeida@demo.nexusdojo.dev` (Professor Bruno Almeida)
  - Professora: `camila.duarte@demo.nexusdojo.dev` (Professora Camila Duarte)
  - Professora: `laura.santos@demo.nexusdojo.dev` (Professora Laura Santos)
- Seeds automaticos por trigger validados no remoto:
  - 1 unidade
  - 7 modalidades
  - 2 sistemas de faixa
  - 21 faixas de Jiu-Jitsu conforme catalogo IBJJF (8 adulto/juvenil e 13 kids)
  - 4 contas financeiras
- O `seed.sql` atual nao deve ser rodado no remoto sem revisao, porque ainda
  contem planos historicos com limite de aulas, enquanto a migration mais
  recente exige planos ilimitados.
- Para rodar o app em Docker usando Supabase web, deixe
  `SUPABASE_INTERNAL_URL` vazio. Use essa variavel apenas quando quiser forcar
  o app em container a acessar um Supabase local.

## Visão Geral do Fluxo

Este projeto é desenvolvido por 2 desenvolvedores usando Claude Code,
consumindo tokens de contas separadas, em momentos diferentes (e
eventualmente, ao mesmo tempo). O `TASK.md` é a ÚNICA fonte da
verdade sobre o progresso do projeto — nunca confie em memória de
conversa anterior, sempre confie no que está commitado no Git.

O planejamento das subtarefas já foi feito a partir do arquivo de
escopo do projeto e está registrado em `TASK.md`, em ordem lógica
de dependência. Não altere essa ordem sem necessidade clara.

Branches de cada desenvolvedor:
- Dev 1: `dev/CARLOS`
- Dev 2: `dev/SERGIO`



---

## Regra de Ouro

NUNCA comece a trabalhar sem antes sincronizar com o repositório
remoto. Se pular esse passo, você pode:
- Refazer uma subtarefa que o outro dev já concluiu
- Trabalhar em cima de código desatualizado
- Gerar conflitos de merge desnecessários

---

## Checklist ao INICIAR uma sessão (sempre, sem exceção)

1. **Sincronize com o remoto primeiro:**
   ```bash
   git pull origin [nome-da-branch]
   ```
   Se houver conflitos, resolva ANTES de continuar (peça ajuda ao
   usuário se não for trivial).

2. **Leia o `TASK.md` por completo** — ele reflete o estado real do
   projeto, feito por qualquer um dos dois desenvolvedores.

3. **Confirme o estado real do código**, não só do TASK.md:
   ```bash
   git log --oneline -15
   git status
   ```
   Se o TASK.md diz que uma subtarefa está `[x]` mas o código não
   reflete isso, avise o usuário — pode ser um commit que não
   chegou até você ainda.

4. **Identifique a próxima subtarefa `[ ]`** em ordem no TASK.md.
   Não pule subtarefas, mesmo que pareçam independentes — a ordem
   foi definida por dependência lógica no planejamento.

5. **Verifique se existe alguma subtarefa marcada como "EM ANDAMENTO"**
   (ver seção de parada por limite de contexto abaixo). Se existir,
   ela tem prioridade sobre iniciar uma subtarefa nova.

6. **Antes de começar a executar, informe o usuário:**
   "Sincronizado com o remoto. Última subtarefa concluída foi [X].
   Vou iniciar [Y]."

---

## Ciclo de Execução (repita a cada subtarefa)

Execute UMA subtarefa por vez, completamente. Antes de CADA
subtarefa (não só no início da sessão), siga este ciclo:

```
1. git fetch origin
2. git log HEAD..origin/[branch] --oneline  → checar se há novidade
3. Se houver novidade:
   - git pull origin [branch]
   - reler TASK.md atualizado
   - avisar o usuário: "O outro desenvolvedor concluiu [X] e [Y]
     enquanto eu estava fora. TASK.md atualizado. Próxima
     subtarefa pendente é [Z]."
   - NUNCA prosseguir com uma subtarefa que já apareça [x]
4. Confirmar a próxima subtarefa [ ] pendente (ou retomar a que
   estiver "EM ANDAMENTO", se houver)
5. Executar a subtarefa completamente
6. Marcar [x] no TASK.md
7. git add -A && git commit -m "feat: [nome da subtarefa]"
8. git push origin [nome-da-branch]
9. Avisar o usuário que a subtarefa foi concluída e aguardar
   confirmação para seguir para a próxima
   (a menos que o usuário peça execução em lote)
```

### Por que o push é imediato e não "no final do dia"
Como o outro dev pode assumir o projeto a qualquer momento — ou até
estar trabalhando em paralelo — o remoto precisa estar sempre
atualizado. Subtarefa concluída e não commitada/pushada é subtarefa
que não existe para o outro desenvolvedor.

---

## Parada por Limite de Contexto/Tokens

Como as sessões têm limite de tokens e a retomada é feita
manualmente pelo usuário, é fundamental parar de forma limpa ANTES
que o contexto se esgote no meio de uma subtarefa.

### Sinais de que o contexto está se esgotando
- Você já leu/processou muitos arquivos grandes nesta sessão
- A conversa já está longa (muitas idas e voltas, muito código
  gerado ou lido)
- Você percebe dificuldade em manter o rastro do que já foi feito
  na sessão atual sem reler arquivos

Ao notar QUALQUER um desses sinais, NÃO espere a subtarefa atual
"quase travar". Finalize o menor passo seguro possível e pare.

### Como parar corretamente

1. Se a subtarefa foi concluída: siga o ciclo normal (marcar [x],
   commit, push).

2. Se a subtarefa está PARCIALMENTE feita: NÃO marque [x]. Em vez
   disso, adicione uma nota logo abaixo dela no TASK.md:
   ```
   - [ ] Subtarefa X
     > EM ANDAMENTO — parou em: [descrever exatamente o que falta,
     > ex: "falta criar a rota POST /matriculas e o teste
     > correspondente"]
   ```
   Commit e push mesmo assim, com essa nota:
   ```bash
   git add -A
   git commit -m "wip: [nome da subtarefa] - contexto próximo do limite"
   git push origin [nome-da-branch]
   ```

3. Informe claramente o usuário:
   "Estou perto do limite de contexto desta sessão. Parei em
   [subtarefa X], no ponto [descrição]. Já commitei o progresso
   parcial com a nota no TASK.md. Pode retomar quando tiver tokens
   disponíveis novamente."

4. NÃO tente "forçar" mais uma subtarefa inteira só porque está
   quase terminando — é preferível parar um passo antes e deixar
   registrado, do que travar no meio sem salvar nada.

### Ao retomar uma subtarefa marcada como "EM ANDAMENTO"
1. Leia a nota de onde parou
2. Confirme no código se o que a nota diz bate com o estado real
3. Continue exatamente do ponto descrito
4. Ao concluir, remova a nota "EM ANDAMENTO" e marque [x] normalmente

---

## Retomada de Sessão (mesmo dev ou o outro dev)

Basta o usuário dizer:
```
Retome o projeto seguindo o protocolo do CLAUDE.md.
```

O Claude Code deve automaticamente:
1. `git pull origin [branch]`
2. Ler o `TASK.md` por completo
3. Verificar se há alguma subtarefa "EM ANDAMENTO"
4. Reportar: última subtarefa concluída + próxima a fazer (ou onde
   retomar, se houver uma "EM ANDAMENTO")
5. Aguardar confirmação do usuário para prosseguir

---

## Trabalho Simultâneo (os dois ao mesmo tempo)

Evitar sempre que possível. Se acontecer:
- Cada um trabalha em sua própria branch (`dev/[nome1]`, `dev/[nome2]`)
- Nunca os dois na mesma subtarefa do TASK.md ao mesmo tempo
- Avisar no chat/grupo qual subtarefa está sendo iniciada, ANTES de
  começar, para evitar sobreposição
- O ciclo de `fetch` a cada subtarefa (ver acima) é a rede de
  segurança caso o aviso manual falhe

---

## Regras Gerais de Execução

- Nunca execute mais de uma subtarefa sem parar para o usuário
  validar, a menos que seja pedido explicitamente "execute em lote"
- Nunca infira ou complete propriedades/estruturas sem confirmação
  quando houver ambiguidade
- Se o `TASK.md` e o estado real do código divergirem, pare e avise
  — não tente adivinhar qual está certo
- Nunca marque uma subtarefa como `[x]` sem ter feito commit e push
  correspondentes
