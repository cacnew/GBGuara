# FINANCEIRO.md — Regras do módulo financeiro

Resumo operacional das regras financeiras do NexusDojo. Modelo de dados
completo (tabelas e campos): seção 10 e 11 do `NEXUSDOJO_PROJECT.md`.

## Princípio central

> Tabela de preço é referência comercial. Contrato do aluno é compromisso
> financeiro real.

Nunca recalcular o financeiro de um aluno existente com base no valor
atual de uma tabela de preços. O contrato **congela** os valores acordados
no momento em que foi criado — mesmo que a escola lance uma tabela nova
depois.

## Entidades e papel de cada uma

- **`price_tables`** — vigência (`valid_from`/`valid_until`) e status
  (`active`/`inactive`/`legacy`). Referência comercial, não financeira.
- **`plans`** — dentro de uma `price_table`: duração, preço base,
  parcelamento sugerido.
- **`contracts`** — compromisso financeiro real do aluno (ou de múltiplos
  alunos, no futuro plano família via `contract_students`). Congela
  `original_price`, desconto e `final_price`.
- **`contract_students`** — liga um contrato a um ou mais alunos.
- **`contract_installments`** — parcelas geradas automaticamente a partir
  do contrato (1x a 12x, com ajuste de arredondamento na última parcela).
- **`financial_movements`** — visão de caixa (entradas, estornos, ajustes).
- **`financial_accounts`** — onde o dinheiro entrou (caixa, banco, pix, etc).
- **`student_financial_exemptions`** — bolsistas/isentos/permutas. Aluno
  isento ativo nunca aparece como inadimplente.
- **`payment_adjustments`** — modelagem para renegociação futura (schema
  no MVP 1A, tela não obrigatória ainda).

## Regras obrigatórias (não violar)

- Não editar contratos antigos quando a tabela de preços mudar — criar
  tabela nova e marcar a anterior como `legacy` se necessário.
- Permitir desconto fixo ou percentual, parcelamento de 1x a 12x e
  pagamento parcial (com saldo restante registrado).
- Não excluir contrato com parcelas pagas. Não excluir parcela paga.
- Permitir cancelar parcela futura e estornar pagamento sem apagar
  histórico.
- Marcar parcela como paga exige data de pagamento e forma de pagamento.
- Apenas um contrato ativo por aluno no MVP 1A. Se já existir um ativo e
  for criado outro, perguntar se deve encerrar o anterior antes.
- Registrar log (`audit_logs`) em alterações financeiras sensíveis.
- Planos/tabelas legados continuam visíveis no histórico, mas não aparecem
  como opção padrão para novos alunos.

## Fluxo principal (criação de contrato)

1. Escolher tabela de preço → escolher plano.
2. Definir início/fim, conferir valor original.
3. Aplicar desconto (se houver) → valor final.
4. Escolher parcelamento (1x a 12x) e primeiro vencimento.
5. Definir responsável financeiro (aluno, responsável ou outro).
6. Confirmar → sistema cria `contract` + `contract_students` +
   `contract_installments` em uma única transação.

## Telas obrigatórias (ver seção 11.13 do documento mestre)

Tabelas de preço, planos, aba financeira na ficha do aluno, parcelas (com
filtros), inadimplentes, dashboard financeiro.
