# Nexus Dojo — Arquivo de Tarefas para Claude Code

> **Como usar:** coloque este arquivo na raiz do projeto e peça ao Claude Code para executar as tarefas em ordem (ex.: `Leia TAREFAS-NEXUS-DOJO.md e execute a TAREFA 1`). Cada tarefa é independente, mas a ordem sugerida respeita dependências (a TAREFA 5 depende da 4, e a 7 depende da 4 e da 6).

## Instruções gerais (valem para todas as tarefas)

1. **Antes de codificar**, explore a estrutura atual do projeto (rotas, componentes, modelos de dados, estilo visual) e reutilize os padrões já existentes. Não introduza novas bibliotecas de UI sem necessidade.
2. Mantenha a identidade visual já estabelecida na área **admin** como referência de padrão.
3. Toda alteração de banco de dados deve vir com **migration** correspondente.
4. Ao final de cada tarefa: rodar a aplicação, verificar que nada quebrou nas telas afetadas e listar os arquivos alterados/criados.
5. Textos de interface em **português do Brasil**.
6. Não iniciar a tarefa seguinte sem concluir e validar a atual.

---

## TAREFA 1 — Reset de senha de alunos pelo admin

**Objetivo:** o usuário admin deve conseguir resetar a senha de qualquer aluno.

**Requisitos:**
- Na listagem/detalhe de alunos da área admin, adicionar ação **"Resetar senha"**.
- Ao acionar, exibir modal de confirmação (nome do aluno visível) para evitar reset acidental.
- Comportamento do reset (escolher conforme a arquitetura atual de autenticação; preferência na ordem):
  1. Gerar **senha temporária** aleatória, exibida uma única vez ao admin, com flag `must_change_password` que força o aluno a trocar a senha no próximo login; **ou**
  2. Gerar link de redefinição com token de expiração, exibido ao admin para envio manual ao aluno.
- Registrar a ação em log/auditoria (quem resetou, qual aluno, quando).
- Endpoint protegido: somente perfil admin pode executar.

**Critérios de aceite:**
- [ ] Admin reseta a senha e o aluno consegue entrar com a senha temporária (ou link).
- [ ] Aluno é obrigado a definir nova senha no primeiro acesso após o reset.
- [ ] Usuário não-admin não consegue chamar o endpoint (retorna 403).

---

## TAREFA 2 — Data e dia da semana no grid de aulas (/aluno/academia)

**Objetivo:** no grid de aulas em `http://localhost:3000/aluno/academia`, hoje não é possível saber a qual data cada registro pertence.

**Requisitos:**
- Em cada registro do grid, exibir a **data da aula** no formato: `dd/MM/yyyy` acompanhada do **nome do dia da semana** por extenso (ex.: **`14/07/2026 — Segunda-feira`**).
- O dia da semana deve ser calculado a partir da data da aula (locale `pt-BR`), nunca fixo.
- Posicionar a data com destaque visual (primeira coluna do grid ou cabeçalho de agrupamento por dia — seguir o que ficar mais legível com o layout atual; se o grid for longo, preferir **agrupamento por data** com cabeçalho de seção).
- Manter ordenação cronológica dos registros.

**Critérios de aceite:**
- [ ] Cada aula do grid mostra data numérica + dia da semana correto em pt-BR.
- [ ] Layout permanece consistente em desktop e mobile.

---

## TAREFA 3 — Padronizar o visual das faixas em /aluno

**Objetivo:** na aba `http://localhost:3000/aluno`, organizar o visual das **faixas (graduações)** seguindo o padrão visual já estabelecido na área **admin** (`http://localhost:3000/admin`).

**Requisitos:**
- Localizar como as faixas são renderizadas na área admin (cores, formato do componente de faixa/graus, tipografia, espaçamento).
- Extrair esse componente/estilo para um **componente compartilhado** (ex.: `BeltBadge` / `BeltTimeline`) reutilizável nas duas áreas.
- Aplicar o componente na área do aluno (evolução de faixas, faixa atual no perfil e onde mais aparecer).
- Cores das faixas fiéis ao BJJ: branca, cinza, amarela, laranja, verde (infantis, se existirem), azul, roxa, marrom, preta — com representação dos **graus** (ponteiras).

**Critérios de aceite:**
- [ ] Faixas na área do aluno visualmente idênticas às da área admin.
- [ ] Componente único compartilhado (sem duplicação de código de faixa).

---

## TAREFA 4 — Área financeira do aluno (/aluno/academia)

**Objetivo:** incluir a parte **financeira** na área do aluno para acompanhamento de mensalidades e pagamento.

**Requisitos:**
- Criar seção/aba **"Financeiro"** dentro da área do aluno.
- Modelo de dados (criar se não existir):
  - `Plan` (plano): nome, valor, periodicidade (mensal/trimestral/etc.), quantidade de créditos/aulas se aplicável, status.
  - `Subscription` (assinatura do aluno): aluno, plano, data de início, status, dia de vencimento.
  - `Invoice`/`Installment` (parcela/mensalidade): assinatura, competência (mês/ano), valor, vencimento, status (`pendente`, `paga`, `vencida`, `cancelada`), data de pagamento, meio de pagamento.
- Tela do aluno deve exibir:
  - Plano atual e situação (em dia / em atraso).
  - Lista de mensalidades com competência, valor, vencimento e status (badge colorido: verde=paga, amarelo=pendente, vermelho=vencida).
  - **Próximo vencimento** em destaque.
  - Botão **"Pagar"** nas parcelas pendentes/vencidas, que exibe os dados de pagamento enviados pelo admin (QR Code Pix, código copia-e-cola, boleto — ver TAREFA 5).
- O aluno **não** cria nem edita cobranças; apenas visualiza e paga.

**Critérios de aceite:**
- [ ] Aluno visualiza plano, parcelas, status e próximo vencimento.
- [ ] Parcela pendente exibe ação de pagamento com os dados disponibilizados pelo admin.

---

## TAREFA 5 — Gestão de cobranças pelo admin (Pix, QR Code, boleto)

**Objetivo:** o admin gerencia as cobranças e **envia a forma de pagamento** para o aluno (QR Code, boleto ou Pix). O pagamento gera créditos conforme o plano e o sistema informa parcelas pagas e o próximo vencimento.

**Requisitos:**
- Na área admin, criar módulo **"Financeiro"** com:
  - CRUD de **planos** (nome, valor, periodicidade, créditos concedidos).
  - Vincular aluno a um plano (criar assinatura) com geração automática das parcelas do ciclo.
  - Em cada parcela, ação **"Enviar cobrança"** com escolha do meio:
    - **Pix**: campo para chave Pix da academia + geração do payload **Pix copia-e-cola (EMV)** e **QR Code** correspondente (gerar localmente com biblioteca de QR Code; não depender de gateway nesta fase).
    - **Boleto**: campo para anexar/informar linha digitável ou link do boleto (integração com gateway fica para fase futura — deixar a estrutura preparada).
  - A cobrança enviada fica visível para o aluno na tela da TAREFA 4 (e gera **notificação** ao aluno, reutilizando o sistema de notificações existente).
  - Ação **"Confirmar pagamento"** (baixa manual pelo admin nesta fase): marca a parcela como paga, registra data e meio de pagamento.
- Ao confirmar pagamento:
  - **Gerar os créditos** do aluno conforme o plano (se o plano for por créditos/aulas).
  - Atualizar automaticamente o **próximo vencimento** exibido para admin e aluno.
- Dashboard simples no admin: parcelas pagas, pendentes e vencidas do mês, com filtro por aluno.

**Critérios de aceite:**
- [ ] Admin cria plano, vincula aluno e as parcelas são geradas.
- [ ] Admin envia cobrança Pix com QR Code válido (copia-e-cola funcional) e o aluno a visualiza.
- [ ] Baixa de pagamento gera créditos e recalcula o próximo vencimento.
- [ ] Admin e aluno veem quais parcelas estão pagas e o próximo vencimento.

---

## TAREFA 6 — Foto do aluno (upload no perfil e no cadastro admin)

**Objetivo:** permitir foto de perfil do aluno.

**Requisitos:**
- **Perfil do aluno**: campo de upload de foto (com preview, recorte quadrado/circular se simples de implementar, e opção de remover/substituir).
- **Cadastro de aluno no admin**: campo de foto **opcional** (não obrigatório) no formulário de criação e edição.
- Validações: formatos `jpg/jpeg/png/webp`, tamanho máximo 5 MB; redimensionar/comprimir no servidor para um tamanho padrão (ex.: 512×512).
- Armazenamento seguindo o padrão do projeto (filesystem local ou storage já configurado); salvar apenas o caminho/URL no banco.
- Exibir a foto (com fallback de avatar com iniciais) em todos os lugares onde o aluno aparece: listagens do admin, "Minha Academia", perfil, presença etc.

**Critérios de aceite:**
- [ ] Aluno envia/troca/remove a própria foto pelo perfil.
- [ ] Admin pode (opcionalmente) anexar foto ao cadastrar ou editar um aluno.
- [ ] Fallback de avatar funciona para alunos sem foto.

---

## TAREFA 7 — Dossiê do aluno

**Objetivo:** criar no perfil do aluno uma área **"Dossiê do Aluno"** consolidando todo o histórico, separado por seções.

**Requisitos:**
- Página acessível a partir do perfil do aluno (e também pelo admin, no detalhe do aluno).
- Seções (usar navegação por âncoras, abas ou acordeão — seguir o padrão visual do projeto):
  1. **Dados cadastrais** — nome, foto, contato, data de nascimento, data de matrícula, academia, status.
  2. **Histórico de graduações** — linha do tempo das faixas e graus recebidos, com data de cada promoção e quem promoveu (usar o componente de faixas da TAREFA 3).
  3. **Histórico financeiro** — todas as parcelas (pagas, pendentes, vencidas), plano atual e anteriores, total pago no ano (usar os dados das TAREFAS 4/5).
  4. **Histórico de presenças/treinos** — total de aulas, frequência por mês, últimas presenças confirmadas.
  5. **Observações** *(admin)* — campo de anotações internas visível apenas para admin/professor (ex.: lesões, restrições), com registro de autor e data.
- Visão do **aluno**: vê tudo, exceto a seção de observações internas.
- Visão do **admin**: vê todas as seções e pode editar as observações.

**Critérios de aceite:**
- [ ] Dossiê exibe as seções com dados reais do aluno.
- [ ] Aluno não visualiza observações internas.
- [ ] Graduações usam o mesmo componente visual de faixas do restante do sistema.

---

## Ordem de execução sugerida

1. TAREFA 1 (independente)
2. TAREFA 2 (independente)
3. TAREFA 3 (cria o componente de faixas usado depois na 7)
4. TAREFA 6 (foto usada no dossiê)
5. TAREFA 4 → TAREFA 5 (financeiro: primeiro a visão do aluno com o modelo de dados, depois a gestão admin)
6. TAREFA 7 (consolida tudo)

> **Observação para o Claude Code:** se durante a execução encontrar decisões de arquitetura ambíguas (ex.: onde armazenar arquivos, qual lib de QR Code, formato do token de reset), escolha a opção mais simples compatível com o que já existe no projeto e documente a decisão no final da tarefa.
