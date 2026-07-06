# NexusDojo — Documento Mestre do Projeto (Planejamento para Claude Code)

> **Objetivo deste arquivo:** servir como documento-mãe para o Claude Code e para a equipe de desenvolvimento planejarem o projeto antes de implementar.  
> **Regra principal:** o Claude Code deve ler este documento inteiro, inspecionar o repositório atual e devolver um plano técnico completo antes de escrever qualquer código de feature.

---

## 1. Visão geral do projeto

Estamos iniciando o projeto **NexusDojo**, uma plataforma SaaS para gestão de escolas de lutas, começando com foco em **jiu-jitsu**, mas arquitetada desde o início para atender também:

- Jiu-jitsu com kimono
- No-gi
- Muay thai
- Boxe
- Wrestling
- Defesa pessoal
- Funcional
- Outras modalidades de luta ou artes marciais

O produto fará parte do ecossistema **CAC NEXUS** e deverá seguir uma arquitetura moderna, escalável, multiempresa e preparada para evolução incremental.

O foco inicial é criar um sistema validável com poucas escolas-piloto, sem tentar copiar todos os recursos de sistemas já consolidados. A primeira versão deve resolver bem a rotina real de uma escola de luta.

---

## 2. Produto e posicionamento

O NexusDojo não deve ser tratado como um sistema genérico de academia.

Ele deve ser pensado para a rotina real de uma escola de lutas, onde:

- Existem turmas/horários fixos na grade.
- O aluno não é preso obrigatoriamente a uma turma.
- O aluno pode treinar em horários diferentes.
- O aluno pode treinar mais de uma vez no mesmo dia.
- O professor registra a presença real do aluno na aula que aconteceu.
- A turma pode ter um público sugerido, mas o sistema não deve bloquear o aluno por isso.
- A frequência é importante, mas não substitui a avaliação do professor.
- A graduação deve ser uma decisão manual do professor/administrador.

O diferencial inicial do produto será:

> **Flexibilidade operacional real da escola de luta + gestão financeira organizada + controle de frequência por aula realizada.**

---

## 3. Conceito central: turma flexível

Este é o conceito mais importante do sistema.

Em uma escola de luta, uma turma não é necessariamente um grupo fechado de alunos.

A turma representa uma aula, horário, modalidade ou perfil de treino disponível na grade.

Exemplos:

- Aula matinal 07h
- Adulto 19h
- Kids 18h
- Feminina
- No-gi 12h
- Competição
- Open Mat
- Defesa pessoal
- Muay thai
- Boxe
- Funcional

O aluno pode frequentar diferentes turmas ao longo da semana ou até no mesmo dia.

Exemplo:

Um aluno pode treinar:

- Jiu-jitsu matinal 07h
- No-gi 12h
- Adulto 19h

Todas no mesmo dia, se ele participou dessas aulas.

### Regras importantes

- O aluno não precisa estar vinculado previamente à turma para registrar presença.
- O professor pode buscar qualquer aluno ativo da escola e registrar presença.
- O perfil da turma é apenas orientativo.
- Uma turma feminina é esperada para mulheres, mas o sistema não bloqueia tecnicamente homens.
- Uma turma kids é esperada para crianças, mas o sistema não bloqueia tecnicamente adultos.
- Cabe ao professor/escola orientar verbalmente o aluno caso ele não deva participar daquela turma.
- O sistema só deve impedir duplicidade da mesma presença na mesma aula/sessão.

Regra rígida:

> O mesmo aluno não pode ser registrado duas vezes na mesma turma, na mesma data e no mesmo horário/sessão.

---

## 4. Escopo geral por fases

O projeto deve ser implementado em fases. Não tente implementar tudo de uma vez.

---

# MVP 1A — Núcleo operacional obrigatório

Essa é a primeira entrega real do sistema.

## Entram no MVP 1A

- Setup do projeto
- Autenticação admin/professor
- Multi-tenancy básico via `school_id`
- Cadastro da escola
- Unidade default
- Cadastro de alunos
- Cadastro de responsáveis
- Cadastro de professores
- Cadastro de modalidades
- Cadastro de faixas básicas
- Cadastro de turmas/horários
- Criação/abertura de sessão de aula
- Controle de frequência por sessão
- Múltiplas presenças no mesmo dia em turmas diferentes
- Impedir presença duplicada na mesma sessão
- Gestão financeira núcleo
- Tabela de preços
- Planos
- Contratos financeiros
- Parcelas
- Pagamento manual
- Histórico financeiro do aluno
- Controle de inadimplência
- Controle de faixa/grau
- Histórico simples de graduação
- Dashboard básico do administrador
- Dashboard básico do professor
- Seeds de demonstração

---

# MVP 1B — Comunicação e experiência

Após validar o MVP 1A.

## Entram no MVP 1B

- WhatsApp manual via Evolution API
- Leads
- Conversão de lead para aluno
- Aniversariantes do mês
- Upload de foto via Supabase Storage
- Audit logs mais completos
- PWA refinado
- Política de privacidade revisada
- Relatórios financeiros extras
- Melhorias de dashboard

---

# MVP 2 — Automação e área do aluno

## Possíveis recursos

- Área logada do aluno
- Área logada do responsável
- Check-in por QR Code
- Integração Asaas, Mercado Pago ou outro provedor
- Pix automático
- Boleto
- Cartão online
- Régua de cobrança manual/semiautomática
- Notificações por e-mail
- Notificações por WhatsApp
- Recibos em PDF
- Multiunidade com telas próprias

---

# MVP 3 — Evolução técnica e comunidade

## Possíveis recursos

- Currículo técnico por faixa
- Avaliação qualitativa do aluno
- Controle de evolução técnica
- Campeonatos
- Eventos
- Seminários
- Graduações coletivas
- Relatórios avançados de evolução
- Ranking interno
- IA para análise de evasão e frequência

---

## 5. Stack técnica desejada

A stack sugerida para o projeto é:

- Next.js com App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth
- Supabase Postgres
- Supabase Row Level Security
- Supabase Storage futuramente
- TanStack Query quando necessário no client
- React Hook Form
- Zod
- date-fns ou dayjs
- lucide-react
- Recharts
- Sonner
- PWA futuramente ou desde a base inicial
- Vercel para deploy
- GitHub para versionamento

### Observação sobre versão

Usar a versão estável mais adequada do Next.js no momento de criação do projeto. Preferir App Router e Server Components por padrão.

---

## 6. Regras para secrets e variáveis de ambiente

Nunca hardcodar chaves, tokens, IPs privados, endpoints sensíveis ou secrets no código.

Criar `.env.example` com nomes das variáveis, sem valores reais.

Variáveis previstas:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

EVOLUTION_API_URL=
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE_PREFIX=nexusdojo_

RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
```

A Evolution API deve ser configurada exclusivamente por variável de ambiente.

---

## 7. Arquitetura esperada de pastas

O Claude Code deve propor a arquitetura final, mas uma sugestão inicial é:

```txt
.
├── app/
│   ├── (auth)/
│   ├── (admin)/
│   ├── (teacher)/
│   ├── (public)/
│   ├── api/
│   └── layout.tsx
├── components/
│   ├── ui/
│   ├── forms/
│   ├── layout/
│   ├── dashboard/
│   ├── students/
│   ├── teachers/
│   ├── classes/
│   ├── attendance/
│   ├── finance/
│   └── graduation/
├── lib/
│   ├── supabase/
│   ├── validations/
│   ├── utils/
│   ├── dates/
│   ├── money/
│   └── permissions/
├── modules/
│   ├── schools/
│   ├── users/
│   ├── students/
│   ├── teachers/
│   ├── classes/
│   ├── attendance/
│   ├── finance/
│   ├── graduation/
│   └── dashboard/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── docs/
│   ├── PROJECT.md
│   ├── FINANCEIRO.md
│   ├── ROADMAP.md
│   └── DECISIONS.md
├── public/
├── scripts/
├── README.md
├── CLAUDE.md
└── package.json
```

---

## 8. Regras de desenvolvimento com Claude Code

Antes de implementar qualquer feature, o Claude Code deve:

1. Ler este arquivo inteiro.
2. Inspecionar o repositório atual.
3. Identificar se o projeto está vazio ou já iniciado.
4. Devolver um plano técnico completo.
5. Propor arquitetura de pastas.
6. Propor bibliotecas.
7. Propor schema SQL ou Drizzle.
8. Separar MVP 1A e MVP 1B.
9. Apontar riscos, ambiguidades e dúvidas.
10. Aguardar aprovação.

### Importante

Não implementar feature antes da aprovação do plano.

Não criar migrations definitivas antes da aprovação do schema.

Não instalar bibliotecas sem listar e justificar.

Não adicionar recursos fora do escopo sem perguntar.

Não usar atalhos do tipo “depois eu corrijo”.

---

## 9. Fluxo de trabalho com o time

O projeto será executado em conjunto com outro desenvolvedor.

O Claude Code deve trabalhar como engenheiro autônomo colaborativo, não como executor cego.

Se perceber conflito entre uma decisão do documento e uma boa prática técnica, deve parar e questionar.

Se encontrar ambiguidade, deve perguntar.

Se tiver duas abordagens possíveis, deve apresentar prós e contras.

Se identificar melhoria de baixo custo e alto valor, deve sugerir antes de implementar.

A cada módulo concluído, deve:

- Explicar o que foi feito.
- Listar arquivos criados/alterados.
- Informar como testar.
- Sugerir commit semântico.
- Aguardar validação antes do próximo módulo.

---

# 10. Modelo de dados geral

O schema final deve ser proposto pelo Claude Code antes de implementar, mas o modelo conceitual esperado é o seguinte.

---

## 10.1 Schools

Representa a escola/tenant.

```txt
schools
- id
- name
- document
- phone
- email
- address
- city
- state
- status
- created_at
- updated_at
```

---

## 10.2 Units

Representa unidades físicas da escola.

No MVP 1A, criar unidade default automaticamente. Não construir CRUD de unidades ainda.

```txt
units
- id
- school_id
- name
- address
- status
- created_at
- updated_at
```

---

## 10.3 Users

Tabela de perfil da aplicação, separada de `auth.users`.

```txt
users
- id
- school_id
- auth_user_id
- name
- email
- role
- status
- created_at
- updated_at
```

Roles iniciais:

- admin
- teacher

Roles futuras:

- student
- guardian

---

## 10.4 Students

```txt
students
- id
- school_id
- unit_id
- name
- birth_date
- cpf
- phone
- email
- photo_url
- address
- emergency_contact
- enrollment_date
- status
- main_teacher_id
- notes
- medical_notes
- medical_certificate_url
- medical_certificate_expires_at
- lgpd_consent_at
- current_belt_id
- current_degree
- last_graduation_date
- current_contract_id
- financial_status
- created_at
- updated_at
```

Status:

- ativo
- inativo
- pausado
- cancelado
- inadimplente

Financial status:

- regular
- overdue
- exempt
- canceled

---

## 10.5 Guardians

Responsáveis dos alunos.

```txt
guardians
- id
- school_id
- name
- phone
- email
- document
- relationship
- notes
- created_at
- updated_at
```

---

## 10.6 Student Guardians

```txt
student_guardians
- id
- school_id
- student_id
- guardian_id
- is_primary
- is_financial_responsible
- created_at
- updated_at
```

---

## 10.7 Teachers

```txt
teachers
- id
- school_id
- name
- phone
- email
- photo_url
- status
- notes
- created_at
- updated_at
```

---

## 10.8 Modalities

Modalidades devem ser configuráveis por escola, não enum hardcoded.

```txt
modalities
- id
- school_id
- name
- slug
- icon
- status
- created_at
- updated_at
```

Seed default:

- jiu_jitsu
- no_gi
- muay_thai
- boxe
- defesa_pessoal
- wrestling
- funcional

---

## 10.9 Belt Systems

```txt
belt_systems
- id
- school_id
- modality_id
- name
- audience
- description
- created_at
- updated_at
```

Audience:

- adulto
- kids
- juvenil

---

## 10.10 Belts

```txt
belts
- id
- school_id
- belt_system_id
- name
- color_hex
- ordering
- max_degrees
- created_at
- updated_at
```

Seed inicial para jiu-jitsu adulto:

- branca
- azul
- roxa
- marrom
- preta
- coral
- vermelha

Seed inicial para jiu-jitsu kids:

- branca
- cinza
- amarela
- laranja
- verde

---

## 10.11 Teacher Graduations

```txt
teacher_graduations
- id
- school_id
- teacher_id
- modality_id
- belt_id
- degree
- since_date
- created_at
- updated_at
```

---

## 10.12 Class Groups

Representa turmas/horários da grade.

```txt
class_groups
- id
- school_id
- unit_id
- name
- modality_id
- main_teacher_id
- week_days
- start_time
- end_time
- suggested_audience
- suggested_student_limit
- notes
- status
- created_at
- updated_at
```

Suggested audience:

- kids
- juvenil
- adulto
- feminino
- iniciante
- avancado
- competicao
- livre

O campo `suggested_audience` é apenas orientativo.

---

## 10.13 Class Sessions

Representa uma aula que efetivamente aconteceu ou foi aberta no sistema.

```txt
class_sessions
- id
- school_id
- class_group_id
- date
- actual_teacher_id
- status
- notes
- created_at
- updated_at
```

Status:

- agendada
- realizada
- cancelada
- extra

---

## 10.14 Attendances

```txt
attendances
- id
- school_id
- class_session_id
- student_id
- registered_by_user_id
- status
- student_notes
- created_at
- updated_at
```

Status:

- presente
- falta
- falta_justificada

Constraint obrigatória:

```txt
UNIQUE(class_session_id, student_id)
```

---

## 10.15 Student Preferred Classes

Futura referência visual. Não bloquear presença.

```txt
student_preferred_classes
- id
- school_id
- student_id
- class_group_id
- created_at
```

---

# 11. Gestão financeira completa

A gestão financeira deve ser robusta o suficiente para atender a realidade de escolas de luta.

O ponto principal é separar:

> **Tabela de preço é referência comercial. Contrato do aluno é compromisso financeiro real.**

Nunca recalcular o financeiro de um aluno antigo com base no valor atual de uma tabela de preços.

---

## 11.1 Conceitos financeiros

A escola pode ter tabelas de preços diferentes por vigência.

Exemplo tabela antiga:

```txt
Mensal: R$ 200,00
Trimestral: R$ 550,00
Semestral: R$ 1.000,00
Anual: R$ 2.000,00
```

Exemplo tabela nova:

```txt
Mensal: R$ 210,00
Trimestral: R$ 590,00
Semestral: R$ 1.100,00
Anual: R$ 2.100,00
```

Alunos antigos podem permanecer em plano legado.

Novos alunos podem usar nova tabela.

O contrato do aluno deve congelar os valores acordados.

---

## 11.2 Price Tables

```txt
price_tables
- id
- school_id
- name
- description
- valid_from
- valid_until
- status
- created_at
- updated_at
```

Status:

- active
- inactive
- legacy

---

## 11.3 Plans

```txt
plans
- id
- school_id
- price_table_id
- name
- plan_duration
- duration_months
- base_price
- classes_per_week
- classes_total
- unlimited
- setup_fee
- loyalty_months
- description
- status
- created_at
- updated_at
```

Plan duration:

- monthly
- quarterly
- semiannual
- annual
- drop_in
- package
- trial

Status:

- active
- inactive
- legacy

---

## 11.4 Contracts

Usar `contracts`, e não apenas `student_contracts`, para permitir no futuro contratos com múltiplos alunos e plano família.

```txt
contracts
- id
- school_id
- financial_responsible_type
- financial_responsible_id
- plan_id
- price_table_id
- start_date
- end_date
- status
- original_price
- discount_type
- discount_value
- final_price
- installments_count
- installment_amount
- first_due_date
- payment_day
- setup_fee_amount
- notes
- created_at
- updated_at
```

Financial responsible type:

- student
- guardian
- other

Status:

- active
- finished
- canceled
- paused
- overdue

Discount type:

- none
- fixed
- percentage

---

## 11.5 Contract Students

Permite que um contrato esteja vinculado a um ou mais alunos.

```txt
contract_students
- id
- school_id
- contract_id
- student_id
- created_at
- updated_at
```

Exemplos:

- Contrato individual: um contrato para um aluno.
- Plano família futuro: um contrato para dois ou mais alunos.

---

## 11.6 Contract Installments

```txt
contract_installments
- id
- school_id
- contract_id
- installment_number
- reference_month
- due_date
- amount
- paid_amount
- remaining_amount
- status
- payment_date
- payment_method
- notes
- created_at
- updated_at
```

Status:

- pending
- paid
- partially_paid
- overdue
- canceled
- refunded

Payment method:

- pix
- cash
- credit_card
- debit_card
- bank_transfer
- other

Regras:

- Gerar parcelas automaticamente ao criar contrato.
- Permitir parcelamento de 1x a 12x.
- Ajustar arredondamento na última parcela.
- Não permitir excluir parcela paga.
- Permitir cancelar parcela futura.
- Permitir pagamento parcial.
- Em pagamento parcial, registrar saldo restante.
- Ao marcar paga, exigir data de pagamento e forma de pagamento.

---

## 11.7 Financial Movements

Visão de caixa.

```txt
financial_movements
- id
- school_id
- student_id
- contract_id
- contract_installment_id
- type
- amount
- movement_date
- payment_method
- category
- description
- created_at
- updated_at
```

Type:

- income
- refund
- adjustment

Category:

- mensalidade
- matricula
- graduacao
- seminario
- produto
- aula_avulsa
- campeonato
- outro

---

## 11.8 Financial Accounts

Para controlar onde o dinheiro entrou.

```txt
financial_accounts
- id
- school_id
- name
- type
- status
- created_at
- updated_at
```

Type:

- cash
- bank
- pix
- card
- other

---

## 11.9 Exemptions / Scholarships

Para alunos bolsistas, isentos, permutas ou cortesias.

```txt
student_financial_exemptions
- id
- school_id
- student_id
- reason
- start_date
- end_date
- status
- notes
- created_at
- updated_at
```

Status:

- active
- ended
- canceled

Alunos isentos ativos não devem aparecer como inadimplentes.

---

## 11.10 Payment Adjustments / Renegotiation

Para renegociação futura.

```txt
payment_adjustments
- id
- school_id
- contract_id
- adjustment_type
- amount
- reason
- created_by_user_id
- created_at
```

Adjustment type:

- discount
- surcharge
- refund
- renegotiation
- correction

No MVP 1A, pode deixar apenas modelado ou implementar parcialmente, conforme complexidade.

---

## 11.11 Regras financeiras obrigatórias

- Não editar contratos antigos quando a tabela de preços mudar.
- O contrato congela os valores acordados.
- A tabela de preço serve como referência comercial.
- O contrato representa compromisso financeiro real.
- Planos legados devem continuar visíveis no histórico.
- Planos legados não devem aparecer como opção padrão para novos alunos.
- Permitir desconto fixo ou percentual.
- Permitir parcelamento de 1x a 12x.
- Permitir pagamento parcial.
- Permitir estorno sem apagar histórico.
- Permitir cancelamento de parcelas futuras.
- Não excluir contrato com parcelas pagas.
- Não excluir parcela paga.
- Registrar log em alterações financeiras sensíveis.
- Permitir somente um contrato ativo por aluno no MVP 1A.
- Caso exista contrato ativo e seja criado outro, perguntar se deve encerrar o anterior.
- Para plano família futuro, permitir múltiplos alunos no mesmo contrato.

---

## 11.12 Fluxo financeiro principal

### Criar tabela de preços

O administrador cria uma tabela com vigência.

Exemplo:

```txt
Tabela Valores 2026
valid_from: 2026-01-01
valid_until: 2026-12-31
status: active
```

### Criar planos

Exemplo:

```txt
Mensal — R$ 200,00 — 1 mês
Trimestral — R$ 550,00 — 3 meses
Semestral — R$ 1.000,00 — 6 meses
Anual — R$ 2.000,00 — 12 meses
```

### Criar nova tabela

Não editar a tabela antiga para reajuste.

Criar nova tabela:

```txt
Tabela Valores 2027
Mensal — R$ 210,00
Trimestral — R$ 590,00
Semestral — R$ 1.100,00
Anual — R$ 2.100,00
```

Marcar anterior como legacy, se necessário.

### Associar plano ao aluno

Na ficha do aluno:

- Escolher tabela de preço
- Escolher plano
- Definir início
- Definir fim
- Conferir valor original
- Aplicar desconto, se houver
- Definir valor final
- Escolher parcelamento de 1x a 12x
- Definir primeiro vencimento
- Definir responsável financeiro
- Confirmar

O sistema cria:

- Contract
- ContractStudents
- ContractInstallments

---

## 11.13 Telas financeiras necessárias

### Tela de tabelas de preço

- Listar
- Criar
- Editar
- Marcar ativa
- Marcar legada
- Visualizar planos

### Tela de planos

- Criar plano dentro de tabela
- Editar
- Inativar
- Marcar legado
- Visualizar alunos/contratos vinculados

### Aba financeiro na ficha do aluno

Resumo:

- Plano atual
- Situação financeira
- Próximo vencimento
- Valor em aberto
- Valor vencido
- Total pago
- Total contratado

Contrato atual:

- Plano
- Tabela de preço
- Período
- Valor original
- Desconto
- Valor final
- Parcelamento
- Parcelas pagas
- Parcelas pendentes
- Parcelas vencidas

Ações:

- Associar plano
- Renovar plano
- Trocar plano
- Encerrar contrato
- Pausar contrato
- Registrar pagamento
- Editar vencimento de parcela pendente
- Cancelar parcela futura

### Tela de parcelas

Filtros:

- Mês
- Status
- Aluno
- Plano
- Forma de pagamento

### Tela de inadimplentes

Mostrar:

- Aluno
- Responsável financeiro
- Plano
- Valor vencido
- Parcela vencida
- Dias em atraso
- Telefone/WhatsApp
- Link para ficha financeira

### Dashboard financeiro

Cards:

- Receita prevista do mês
- Receita recebida do mês
- Valor em aberto
- Valor vencido
- Alunos inadimplentes
- Contratos ativos
- Parcelas vencidas
- Parcelas a vencer nos próximos 7 dias

---

# 12. Graduação e evolução

A frequência deve ser indicador, não critério automático de graduação.

O sistema deve permitir:

- Atualizar faixa/grau
- Registrar histórico
- Mostrar data da última graduação
- Mostrar presenças desde última graduação
- Mostrar tempo desde última graduação
- Permitir observações do professor

```txt
graduation_history
- id
- school_id
- student_id
- modality_id
- previous_belt_id
- previous_degree
- new_belt_id
- new_degree
- graduation_date
- registered_by_teacher_id
- notes
- created_at
- updated_at
```

---

# 13. Audit logs

Criar auditoria mínima para ações sensíveis.

```txt
audit_logs
- id
- school_id
- user_id
- entity_type
- entity_id
- action
- changes
- created_at
```

Logar especialmente:

- Alteração de pagamento
- Cancelamento de parcela
- Alteração de contrato
- Alteração de presença
- Alteração de graduação
- Alteração de dados pessoais do aluno

---

# 14. Dashboard inicial

## Dashboard admin

Cards:

- Total de alunos ativos
- Total de alunos inadimplentes
- Professores ativos
- Turmas ativas
- Receita prevista do mês
- Receita recebida do mês
- Valor vencido
- Presenças no mês
- Alunos sem frequência há 15 dias
- Próximos vencimentos

Listas:

- Inadimplentes
- Ausentes há 15+ dias
- Últimas presenças
- Últimas graduações
- Turmas do dia
- Pagamentos recentes

## Dashboard professor

- Turmas do dia
- Acesso rápido à chamada
- Últimas chamadas
- Alunos recentes
- Observações recentes

---

# 15. Interface e identidade visual

## Direção visual

- Tema escuro como principal
- Toggle para tema claro
- Estética moderna, limpa e esportiva
- Inspiração em tatame, kimono e escola de luta
- Não exagerar em elementos visuais

## Paleta sugerida

### Opção 1 — Tatame Red

- Preto profundo: `#0B0B0F`
- Grafite: `#18181B`
- Cinza: `#27272A`
- Branco suave: `#F4F4F5`
- Vermelho tatame: `#C8102E`

### Opção 2 — Dojo Gold

- Preto: `#09090B`
- Grafite: `#1F2937`
- Cinza claro: `#E5E7EB`
- Dourado: `#D4AF37`
- Vermelho discreto: `#991B1B`

### Opção 3 — Clean Fight

- Branco: `#FAFAFA`
- Preto: `#111827`
- Cinza: `#6B7280`
- Azul aço: `#2563EB`
- Vermelho ação: `#DC2626`

## Tipografia

Opções:

- Inter para texto
- Outfit para títulos
- Space Grotesk para títulos
- Geist como alternativa moderna

---

# 16. Requisitos de UX

A tela de chamada é crítica.

Ela deve ser otimizada para celular e uso rápido no tatame.

Requisitos:

- Botões grandes
- Busca rápida por nome
- Foto do aluno quando disponível
- Faixa/grau visíveis
- Um clique para marcar presente
- Evitar telas poluídas
- Funcionamento bom com uma mão
- Feedback visual claro
- Lista de presentes visível

Fluxo ideal:

```txt
Entrar -> Turmas do dia -> Abrir chamada -> Buscar aluno -> Marcar presente -> Salvar
```

---

# 17. Seeds de desenvolvimento

Criar seed realista com:

- 1 escola demo
- 1 unidade default
- 2 professores
- 30 alunos
- 5 turmas
- Modalidades default
- Faixas de jiu-jitsu adulto e kids
- 2 tabelas de preços
- 4 planos por tabela
- Contratos financeiros variados
- Parcelas pagas, pendentes e vencidas
- Algumas presenças
- Algumas graduações

---

# 18. Ordem sugerida de implementação

## Fase 0 — Planejamento e setup

- Ler documento
- Inspecionar repo
- Propor plano técnico
- Propor schema
- Aguardar aprovação
- Criar setup inicial

## Fase 1 — Base e autenticação

- Supabase
- Auth
- Schools
- Units
- Users
- RLS
- Onboarding inicial

## Fase 2 — Cadastros base

- Students
- Guardians
- Teachers
- Modalities
- Belts

## Fase 3 — Turmas e sessões

- Class groups
- Class sessions
- Turmas flexíveis
- Turmas do dia

## Fase 4 — Frequência

- Tela de chamada mobile
- Busca aluno ativo
- Registro de presença
- Constraint de duplicidade
- Histórico de presença

## Fase 5 — Financeiro núcleo

- Price tables
- Plans
- Contracts
- Contract students
- Installments
- Pagamento manual
- Inadimplência
- Histórico financeiro

## Fase 6 — Graduação

- Atualizar faixa/grau
- Histórico de graduação
- Indicadores de apoio

## Fase 7 — Dashboards

- Admin
- Professor
- Financeiro básico
- Frequência
- Ausentes
- Inadimplentes

## Fase 8 — MVP 1B

- WhatsApp manual
- Leads
- Aniversariantes
- Upload de foto
- PWA refinado
- Audit logs completos

---

# 19. O que não implementar no MVP 1A

Não implementar agora:

- Pagamento online
- Pix automático
- Boleto
- Cartão online
- Integração Asaas
- Régua automática de cobrança
- Área do aluno
- Área do responsável
- Check-in por QR Code
- Currículo técnico
- Avaliação qualitativa
- Campeonatos
- Eventos
- Seminários
- Multiunidade com telas
- IA
- Catraca física
- Marketplace
- White label
- App nativo

---

# 20. Instrução inicial para o Claude Code

Quando este arquivo for entregue ao Claude Code, a primeira resposta esperada é:

1. Plano técnico completo.
2. Arquitetura de pastas.
3. Lista de bibliotecas e justificativa.
4. Estratégia Supabase Auth + RLS.
5. Modelo de dados consolidado em SQL ou Drizzle.
6. Separação MVP 1A/MVP 1B.
7. Ordem de implementação.
8. Riscos e ambiguidades.
9. Perguntas antes de codar.
10. Proposta final de Fase 0.

## Proibido na primeira resposta

- Não implementar feature.
- Não criar migration final.
- Não criar CRUD.
- Não sair instalando dependências sem explicar.
- Não ignorar o financeiro robusto.
- Não transformar turma em grupo fechado.
- Não hardcodar secrets.

---

# 21. Prompt curto para iniciar no Claude Code

Copie e cole este prompt no Claude Code depois de salvar este documento no repositório:

```txt
Leia o arquivo docs/NEXUSDOJO_PROJECT.md inteiro.

Não implemente nenhuma feature ainda.

Inspecione o repositório atual e me devolva:

1. Plano técnico completo do projeto.
2. Arquitetura de pastas proposta.
3. Stack e bibliotecas recomendadas.
4. Estratégia de Supabase Auth, Postgres e RLS.
5. Modelo de dados consolidado, incluindo o módulo financeiro atualizado.
6. Separação entre MVP 1A e MVP 1B.
7. Ordem de implementação.
8. Pontos de atenção, riscos e ambiguidades.
9. Perguntas que você precisa me fazer antes de codar.
10. Proposta da Fase 0 — Setup.

Importante:
O financeiro deve usar modelo robusto com price_tables, plans, contracts, contract_students, contract_installments, financial_movements, financial_accounts, responsáveis financeiros, planos legados, pagamento parcial e possibilidade futura de plano família.

Não escreva código de feature.
Não crie migrations ainda.
Não instale dependências sem me apresentar o plano.
```

---

# 22. Critérios de sucesso do MVP 1A

O MVP 1A será considerado validável quando permitir que uma escola piloto:

- Cadastre alunos.
- Cadastre professores.
- Cadastre turmas/horários.
- Registre presença em aulas reais.
- Permita aluno em múltiplas aulas no mesmo dia.
- Controle faixa/grau.
- Cadastre tabela de preços.
- Cadastre planos.
- Associe plano ao aluno.
- Gere parcelas.
- Registre pagamentos.
- Identifique inadimplentes.
- Veja histórico financeiro do aluno.
- Veja dashboard básico.
- Use o sistema no celular de forma minimamente confortável.

---

# 23. Princípio final

O NexusDojo deve apoiar a operação real da escola de lutas, sem engessar a rotina.

A escola decide.
O professor valida.
O sistema registra, organiza e mostra indicadores.
 
---

# Atualizacoes de produto apos validacao

Esta secao consolida decisoes tomadas durante a validacao do sistema em uso.
Em caso de conflito com trechos antigos deste documento, estas regras mais
recentes prevalecem ate nova decisao explicita do usuario.

## Planos e acesso as aulas

- O sistema e voltado para escola de lutas, nao para academia com limite de
  aulas por semana.
- Pagou e aderiu a um plano ativo: o aluno pode treinar em qualquer turma
  disponivel, desde que a escola/professor permita operacionalmente.
- O sistema nao deve bloquear presenca por quantidade de aulas, pontuacao,
  creditos, saldo ou limite semanal.
- Campos como `classes_per_week`, `classes_total` e `unlimited`, quando
  existirem no schema, sao informativos/legados e nao devem dirigir regra de
  bloqueio de chamada.
- A compatibilidade da turma com o aluno e uma decisao operacional da escola,
  nao um bloqueio automatico do software.

## Presenca e graduacao

- A chamada registra a presenca real em uma sessao de aula.
- O aluno pode ter varias presencas no mesmo dia se participou de varias
  sessoes.
- Para indicadores de graduacao, contar no maximo uma presenca por dia por
  modalidade.
- Modalidades nao se misturam para graduacao: uma presenca de jiu-jitsu nao
  conta para muay thai, boxe ou outra modalidade.
- Frequencia e indicador de apoio; a graduacao continua sendo decisao manual
  do professor ou administrador.

## Historico de chamadas

- A tela do dia serve para operacao imediata, mas administradores e professores
  tambem precisam acessar sessoes passadas.
- O historico deve permitir ver aulas ja realizadas e os alunos que
  participaram de cada chamada.
- Esse acesso deve estar disponivel na navegacao, nao escondido apenas por URL.

## Usuarios, professores e administradores

- O papel inicial de um professor e acesso basico de professor.
- Em situacoes especiais, um professor pode ser administrador.
- A tela de usuarios deve permitir criar usuarios e alterar role/status.
- O sistema deve preservar pelo menos um admin ativo por escola para evitar
  bloqueio administrativo.

## UX de fluxo

- Telas de criacao, edicao e assistentes devem sempre oferecer caminho de
  retorno para a listagem, ficha ou tela de origem.
- O professor normalmente opera pelo celular; fluxos de chamada devem ser
  rapidos, com lista de alunos e lista de presentes sempre faceis de enxergar.
- O design system vigente do produto e o definido em `DESIGN-pinterest.md`.

