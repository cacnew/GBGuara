# Nexus Dojo — Especificação do Módulo do Aluno

Documento de referência para desenvolvimento incremental via Claude Code. Baseado no fluxo de negócio definido e nas telas de referência do app Alliance Jiu Jitsu.

---

## 1. Visão geral do fluxo

1. As **turmas** são cadastradas de forma recorrente e ficam programadas para o ano inteiro (ex.: "Fundamentals, seg/qua/sex 07:00–08:00, Instrutor Diego Marques, de 04.01 a 30.12").
2. O **aluno** abre o app, vê a agenda de aulas disponíveis e **sinaliza** em qual aula vai participar (check-in de intenção).
3. No horário da aula, o **professor** abre a lista da sessão, vê os alunos que sinalizaram e **confirma** quem realmente esteve presente.
4. Se um aluno presente **não sinalizou** previamente, o professor pode **incluí-lo manualmente** na lista de presença.
5. A presença confirmada alimenta o **histórico de treinos** do aluno (painel com calendário, gráficos e evolução de faixas).

---

## 2. Modelo de dados (entidades principais)

### Aluno (Student)
- id, nome, foto, e-mail/telefone, data de nascimento, sexo
- faixa atual (branca, azul, roxa, marrom, preta...) e graus (0–4)
- academia vinculada, status (ativo/inativo), data de matrícula

### Instrutor (Instructor)
- id, nome, foto, faixa/graus, academia, status

### Turma (ClassTemplate) — o "molde" recorrente
- id, nome (ex.: Fundamentals, Intermediate, Advanced, Masters, Private, Eagle Warrior)
- período de vigência (data início / data fim, ex.: 04.01.2025 – 30.12.2025)
- dias da semana e horário (ex.: ter 07:00–08:00)
- instrutor responsável
- capacidade máxima (ex.: 30; aula particular: 4)
- restrições de elegibilidade: sexo (todas/masc/fem), faixa mínima, graus mínimos
- status (ativa/inativa)

### Sessão (ClassSession) — ocorrência da turma em uma data
- id, turma (FK), data, horário efetivo, instrutor (pode sobrescrever o da turma)
- status (planejada, realizada, cancelada)
- Geração: materializar sessões a partir da recorrência da turma (job/comando que gera o calendário do período) **ou** calcular sob demanda e persistir apenas quando houver interação (check-in/presença). Decidir na fase de arquitetura; a segunda opção evita milhares de linhas ociosas.

### Presença (Attendance) — vínculo aluno × sessão
- id, aluno (FK), sessão (FK)
- status: `signaled` (aluno sinalizou), `confirmed` (professor confirmou), `added_by_instructor` (incluído manualmente), `no_show` (sinalizou e faltou), `cancelled` (aluno desmarcou)
- timestamps: sinalizado_em, confirmado_em, confirmado_por (instrutor)
- Constraint: único por (aluno, sessão)

### Notificação (Notification)
- id, destinatário (aluno), tipo (`presence_confirmed`, `added_to_class`, `class_cancelled`...), payload (turma, data, hora, faixa), lida/não lida, criada_em

---

## 3. Regras de negócio

- Aluno só pode sinalizar presença em sessão **futura ou do dia**, dentro da vigência da turma, se houver **vaga** (contagem de `signaled` + `confirmed` < capacidade) e se atender às **restrições** (faixa/graus/sexo).
- Aluno pode **cancelar** a sinalização até o início da aula.
- Professor só confirma presença em sessões da data corrente ou passadas (não confirma presença no futuro).
- Inclusão manual pelo professor cria registro direto com status `added_by_instructor` + `confirmed`.
- Alunos sinalizados e não confirmados após o fechamento da aula viram `no_show` (opcional, mas útil para relatórios).
- Toda confirmação ou inclusão manual gera **notificação** para o aluno (padrão observado no app de referência: "Instrutor confirmou sua presença no evento de aula Intermediate realizado em 07.07.2026 às 19:30h" / "Instrutor adicionou você ao evento de aula...").

---

## 4. Telas do módulo do aluno

Navegação inferior (bottom tab bar), conforme referência: **Painel · Agenda · Minha Academia · Notificações · Loja (futuro) · Perfil**.

### 4.1 Agenda (tela principal de check-in)
- Toggle no topo: **Minhas** (só aulas em que sinalizei) / **Todas**.
- Seletor horizontal de dias da semana (Seg–Dom) com a data e indicador (ponto) nos dias que têm aula; dia selecionado destacado.
- Lista de cards por sessão do dia selecionado, cada card com:
  - nome da turma, horário (ex.: "07:00 até 08:00"), foto do instrutor
  - chips informativos: **Alunos** (ocupação, ex.: 3/30), **Sexo** (Todas/M/F), **Faixa** (WHITE/BLUE...), **Graus** (mínimo)
- Ação no card: **Sinalizar presença** / **Cancelar sinalização** (com feedback visual de estado).
- Card desabilitado quando: lotado, fora da elegibilidade do aluno, ou sessão encerrada.

### 4.2 Painel (dashboard do aluno)
- Calendário mensal com marcação (ponto) nos dias em que o aluno treinou (presenças confirmadas).
- Gráfico de barras "**Total de treinos do mês**" — 12 barras (jan–dez) do ano corrente.
- Seção "**Evolução das faixas**" — linha do tempo das faixas do aluno (branca → azul → roxa → marrom → preta), com destaque da atual.
- (Este painel é alimentado exclusivamente por presenças com status `confirmed`/`added_by_instructor`.)

### 4.3 Histórico de aulas
- Lista cronológica das aulas em que o aluno esteve presente: data, turma, horário, instrutor.
- Filtro por período/mês. Pode ser acessível a partir do Painel (tocar em um mês/dia).

### 4.4 Minha Academia (menus de consulta)
- Tabs no topo: **Instrutores · Alunos · Aulas** (+ busca).
- **Instrutores**: lista com foto e nome, tocável para ver detalhe.
- **Alunos**: relação de alunos cadastrados na escola (foto, nome, faixa).
- **Aulas**: catálogo das turmas cadastradas — nome, período de vigência (04.01.2025 – 30.12.2025), horário, instrutor, status (Active).

### 4.5 Notificações
- Feed cronológico com avatar do instrutor, título ("Instrutor confirmou sua presença" / "Instrutor adicionou você ao evento de aula"), descrição com turma, faixa/graus, data e hora, e timestamp.
- Ação de "marcar todas como lidas" no topo.

### 4.6 Perfil
- Editar perfil, editar senha, mudar de academia, idioma, trocar de conta, excluir conta, atualizar token de push, sair.
- Rodapé com versão do app e botão "Verificar atualização".

---

## 5. Telas do professor (contraparte mínima para fechar o fluxo)

### 5.1 Chamada da aula (lista de presença da sessão)
- Professor seleciona a sessão do dia e vê a lista de alunos que **sinalizaram**.
- Para cada aluno: botão de **confirmar presença** (toggle presente/ausente).
- Botão "**Adicionar aluno**": busca na base de alunos da academia e inclui manualmente (status `added_by_instructor`).
- Ao salvar/fechar a chamada: dispara notificações e consolida `no_show`.

---

## 6. API (esboço de endpoints)

```
GET  /classes                          → catálogo de turmas (menu Aulas)
GET  /sessions?date=YYYY-MM-DD         → sessões do dia (agenda)
GET  /sessions?student=me&range=...    → minhas aulas sinalizadas
POST /sessions/{id}/signal             → aluno sinaliza presença
DELETE /sessions/{id}/signal           → aluno cancela sinalização
GET  /sessions/{id}/attendances        → lista da chamada (professor)
POST /sessions/{id}/attendances/{studentId}/confirm   → confirma presença
POST /sessions/{id}/attendances        → inclusão manual pelo professor
GET  /students/me/attendances?year=... → histórico + dados do painel
GET  /students /instructors            → menus de consulta
GET  /notifications                    → feed de notificações
```

Validações no backend: capacidade, elegibilidade (faixa/graus/sexo), janela temporal, unicidade (aluno, sessão), autorização por papel (aluno × instrutor).

---

## 7. Sequência sugerida de prompts para o Claude Code

Dê os comandos nesta ordem, um por vez, validando cada etapa antes da seguinte:

1. **Modelagem**: "Crie as entidades/migrations de Student, Instructor, ClassTemplate (com recorrência: dias da semana, horário, vigência, capacidade, restrições de faixa/graus/sexo), ClassSession, Attendance (com os status signaled/confirmed/added_by_instructor/no_show/cancelled e constraint única aluno+sessão) e Notification, conforme a seção 2 desta spec."
2. **Geração de sessões**: "Implemente o serviço que materializa as ClassSessions a partir da recorrência das turmas para um período informado, de forma idempotente."
3. **API do aluno**: "Implemente os endpoints de agenda (sessões por dia com ocupação e elegibilidade calculadas), sinalizar e cancelar sinalização, com as validações da seção 3."
4. **API do professor**: "Implemente a chamada: listar sinalizados da sessão, confirmar presença, incluir aluno manualmente, fechar chamada gerando no_show e notificações."
5. **Tela Agenda**: "Construa a tela de agenda do aluno conforme a seção 4.1: seletor de dias da semana, toggle Minhas/Todas, cards com chips Alunos/Sexo/Faixa/Graus e botão de sinalizar/cancelar."
6. **Tela Chamada (professor)**: "Construa a tela de chamada conforme a seção 5.1."
7. **Painel e histórico**: "Construa o Painel do aluno (calendário de treinos, gráfico de barras jan–dez, evolução de faixas) e a tela de histórico, alimentados apenas por presenças confirmadas."
8. **Minha Academia**: "Construa a tela com tabs Instrutores/Alunos/Aulas e busca, conforme a seção 4.4."
9. **Notificações e Perfil**: "Construa o feed de notificações (seção 4.5), disparo nos eventos de confirmação/inclusão, e a tela de perfil (seção 4.6)."
10. **Testes**: "Escreva testes cobrindo as regras da seção 3: lotação, elegibilidade, dupla sinalização, cancelamento, inclusão manual e no_show."

---

## 8. Pontos em aberto (decidir antes ou durante o desenvolvimento)

- Sessões pré-materializadas para o ano inteiro **ou** geradas sob demanda?
- Existe janela mínima/máxima para sinalizar (ex.: só a partir de 7 dias antes; até 15 min após o início)?
- Aluno pode sinalizar em mais de uma aula no mesmo horário?
- O professor pode reabrir uma chamada já fechada para corrigir presença?
- Push notifications reais (FCM/APNs) já nesta fase ou apenas feed interno?
