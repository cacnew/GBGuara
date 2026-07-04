# Fase 5.6 — Associar plano ao aluno — Plano de Implementação

> **Para quem for executar:** SUB-SKILL RECOMENDADA: use
> `superpowers:executing-plans` para rodar este plano tarefa a tarefa. Os
> passos usam checkbox (`- [ ]`) para acompanhamento.
>
> Este projeto (NexusDojo) não usa framework de testes automatizados — a
> validação de cada fase é feita manualmente via `npm run dev` no navegador,
> seguida de `npm run build` + `npx tsc --noEmit` + `npm run lint` (regra
> global do `CLAUDE.md` do usuário). Os passos de "teste" abaixo são
> roteiros de verificação manual, não testes automatizados.

**Goal:** Implementar o wizard multi-etapas "Associar plano ao aluno" que
cria `contract` + `contract_students` (+ `contract_installments`, via
trigger já existente da Fase 5.5) em uma única operação a partir da ficha
do aluno.

**Architecture:** Rota dedicada `app/(admin)/students/[id]/contract/new`.
Server Component (`page.tsx`) busca tabelas de preço ativas, planos ativos,
responsáveis vinculados ao aluno e um eventual contrato ativo existente, e
passa tudo para um Client Component (`contract-wizard.tsx`) que controla o
estado do wizard em 7 passos. A confirmação final chama uma única Server
Action (`actions.ts`) que valida com Zod, recalcula o preço final no
servidor (nunca confia no cálculo do cliente), encerra o contrato anterior
se necessário, insere o novo `contract` (o trigger já existente gera as
parcelas), cria o vínculo em `contract_students` e atualiza
`students.current_contract_id`.

**Tech Stack:** Next.js 14 App Router, Supabase (Postgres + RLS já
existentes, sem migration nova), `react-hook-form` não é necessário aqui
(o wizard é controlado por `useState` puro, sem validação campo-a-campo
complexa por passo — a validação forte acontece só na Server Action via
Zod), Zod, Tailwind, `sonner` para toasts.

## Global Constraints

- Sem framework de testes novo — validar via `npm run dev` manual, depois
  `npm run build && npx tsc --noEmit && npm run lint`.
- Sem migration nova nesta fase — o schema de `contracts`,
  `contract_students`, `contract_installments` já existe (Fases 5.4/5.5).
- Responder sempre em português nas mensagens de UI/toast.
- Seguir o padrão de Server Actions do projeto: `"use server"`,
  `requireRole("admin")` no início, `safeParse` do Zod, retorno
  `{ error?: string }`, `revalidatePath` ao final.
- Não usar `world: "MAIN"`/frameworks novos/ORMs — este é um projeto
  Next.js + Supabase puro, sem relação com as regras de Chrome Extension
  do CLAUDE.md global (essas não se aplicam aqui).
- Tipo `financial_responsible_id` em `contracts` não tem FK (é
  polimórfico) — a integridade é responsabilidade da aplicação.
- Regra de negócio obrigatória: **apenas um contrato `active` por aluno**.
  Se já existir um, a Server Action só prossegue se o cliente confirmar
  explicitamente encerrar o anterior (`endPreviousContractId` bate com o
  contrato ativo encontrado no servidor).

---

## Mapa de arquivos

- Criar: `lib/validations/contract.ts` — schema Zod `contractSchema`.
- Criar: `app/(admin)/students/[id]/contract/new/actions.ts` — Server
  Actions `getActiveContractForStudent` e `createContract`.
- Criar: `app/(admin)/students/[id]/contract/new/steps.tsx` — os 7
  componentes de passo do wizard (apenas apresentação, sem lógica de
  submissão).
- Criar: `app/(admin)/students/[id]/contract/new/contract-wizard.tsx` —
  Client Component que orquestra o estado do wizard e a navegação entre
  passos.
- Criar: `app/(admin)/students/[id]/contract/new/page.tsx` — Server
  Component que busca os dados iniciais e renderiza o wizard.
- Modificar:
  `app/(admin)/students/[id]/edit/page.tsx` — adicionar link "Associar
  plano" para a nova rota.

---

### Task 1: Schema de validação Zod (`lib/validations/contract.ts`)

**Files:**
- Create: `lib/validations/contract.ts`

**Interfaces:**
- Produces: `contractSchema` (ZodSchema), `type ContractInput` — consumidos
  pela Task 2 (Server Action) e pela Task 4 (wizard, ao montar o payload
  final).

- [ ] **Step 1: Criar o arquivo de validação**

```ts
import { z } from "zod";

export const CONTRACT_DISCOUNT_TYPES = ["none", "fixed", "percentage"] as const;
export const CONTRACT_RESPONSIBLE_TYPES = ["student", "guardian", "other"] as const;

export const contractSchema = z
  .object({
    priceTableId: z.string().uuid("Selecione uma tabela de preço"),
    planId: z.string().uuid("Selecione um plano"),
    startDate: z.string().min(1, "Informe a data de início"),
    endDate: z.string().optional().or(z.literal("")),
    firstDueDate: z.string().min(1, "Informe o primeiro vencimento"),
    discountType: z.enum(CONTRACT_DISCOUNT_TYPES),
    discountValue: z.number().min(0, "Não pode ser negativo"),
    installmentsCount: z
      .number()
      .int()
      .min(1, "Mínimo de 1 parcela")
      .max(12, "Máximo de 12 parcelas"),
    setupFeeAmount: z.number().min(0, "Não pode ser negativo"),
    financialResponsibleType: z.enum(CONTRACT_RESPONSIBLE_TYPES),
    financialResponsibleGuardianId: z.string().optional().or(z.literal("")),
    financialResponsibleOtherName: z.string().trim().optional().or(z.literal("")),
    endPreviousContractId: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (
      data.financialResponsibleType === "guardian" &&
      !data.financialResponsibleGuardianId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione o responsável financeiro",
        path: ["financialResponsibleGuardianId"],
      });
    }

    if (
      data.financialResponsibleType === "other" &&
      !data.financialResponsibleOtherName?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe o nome do responsável financeiro",
        path: ["financialResponsibleOtherName"],
      });
    }
  });

export type ContractInput = z.infer<typeof contractSchema>;
```

- [ ] **Step 2: Verificar que o projeto compila**

Run: `npx tsc --noEmit`
Expected: sem novos erros relacionados a `lib/validations/contract.ts`
(o arquivo ainda não é importado em lugar nenhum, então não deve gerar
nenhum erro).

- [ ] **Step 3: Commit**

```bash
git add lib/validations/contract.ts
git commit -m "feat: schema de validação do formulário de contrato (Fase 5.6)"
```

---

### Task 2: Server Actions (`app/(admin)/students/[id]/contract/new/actions.ts`)

**Files:**
- Create: `app/(admin)/students/[id]/contract/new/actions.ts`

**Interfaces:**
- Consumes: `contractSchema`, `type ContractInput` de
  `@/lib/validations/contract` (Task 1); `requireRole` de
  `@/lib/permissions`; `createClient` de `@/lib/supabase/server`.
- Produces: `type ActiveContractInfo`, `getActiveContractForStudent(studentId: string): Promise<ActiveContractInfo | null>`,
  `type ContractActionResult`,
  `createContract(studentId: string, input: ContractInput): Promise<ContractActionResult>`
  — consumidos pela Task 5 (`page.tsx`, para checar contrato ativo) e pela
  Task 4 (`contract-wizard.tsx`, ao confirmar).

- [ ] **Step 1: Criar o arquivo de Server Actions**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { contractSchema, type ContractInput } from "@/lib/validations/contract";

export type ContractActionResult = { error?: string };

export type ActiveContractInfo = {
  id: string;
  planName: string;
  startDate: string;
};

export async function getActiveContractForStudent(
  studentId: string,
): Promise<ActiveContractInfo | null> {
  await requireRole("admin");
  const supabase = await createClient();

  const { data } = await supabase
    .from("contracts")
    .select("id, start_date, plans(name), contract_students!inner(student_id)")
    .eq("contract_students.student_id", studentId)
    .eq("status", "active")
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    planName: data.plans?.name ?? "-",
    startDate: data.start_date,
  };
}

function calculateFinalPrice(
  basePrice: number,
  discountType: ContractInput["discountType"],
  discountValue: number,
): number {
  if (discountType === "fixed") {
    return Math.max(0, Math.round((basePrice - discountValue) * 100) / 100);
  }
  if (discountType === "percentage") {
    return Math.max(
      0,
      Math.round(basePrice * (1 - discountValue / 100) * 100) / 100,
    );
  }
  return basePrice;
}

export async function createContract(
  studentId: string,
  input: ContractInput,
): Promise<ContractActionResult> {
  const profile = await requireRole("admin");
  const parsed = contractSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("id, base_price")
    .eq("id", data.planId)
    .single();

  if (planError || !plan) {
    return { error: "Plano não encontrado" };
  }

  const activeContract = await getActiveContractForStudent(studentId);

  if (activeContract && activeContract.id !== data.endPreviousContractId) {
    return {
      error:
        "Este aluno já possui um contrato ativo. Confirme o encerramento do contrato anterior antes de continuar.",
    };
  }

  if (activeContract) {
    const { error: endError } = await supabase
      .from("contracts")
      .update({
        status: "finished",
        end_date: new Date().toISOString().slice(0, 10),
      })
      .eq("id", activeContract.id)
      .eq("school_id", profile.schoolId);

    if (endError) {
      return { error: endError.message };
    }
  }

  const originalPrice = plan.base_price;
  const finalPrice = calculateFinalPrice(
    originalPrice,
    data.discountType,
    data.discountValue,
  );
  const installmentAmount =
    Math.round((finalPrice / data.installmentsCount) * 100) / 100;
  const paymentDay = Number(data.firstDueDate.slice(8, 10));

  const financialResponsibleId =
    data.financialResponsibleType === "student"
      ? studentId
      : data.financialResponsibleType === "guardian"
        ? data.financialResponsibleGuardianId || null
        : null;

  const notes =
    data.financialResponsibleType === "other" &&
    data.financialResponsibleOtherName
      ? `Responsável financeiro (outro): ${data.financialResponsibleOtherName}`
      : null;

  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .insert({
      school_id: profile.schoolId,
      financial_responsible_type: data.financialResponsibleType,
      financial_responsible_id: financialResponsibleId,
      plan_id: data.planId,
      price_table_id: data.priceTableId,
      start_date: data.startDate,
      end_date: data.endDate || null,
      status: "active",
      original_price: originalPrice,
      discount_type: data.discountType,
      discount_value: data.discountValue,
      final_price: finalPrice,
      installments_count: data.installmentsCount,
      installment_amount: installmentAmount,
      first_due_date: data.firstDueDate,
      payment_day: paymentDay,
      setup_fee_amount: data.setupFeeAmount,
      notes,
    })
    .select("id")
    .single();

  if (contractError || !contract) {
    return { error: contractError?.message ?? "Não foi possível criar o contrato" };
  }

  const { error: linkError } = await supabase.from("contract_students").insert({
    school_id: profile.schoolId,
    contract_id: contract.id,
    student_id: studentId,
  });

  if (linkError) {
    return { error: linkError.message };
  }

  const { error: studentError } = await supabase
    .from("students")
    .update({ current_contract_id: contract.id })
    .eq("id", studentId);

  if (studentError) {
    return { error: studentError.message };
  }

  revalidatePath(`/students/${studentId}/edit`);
  return {};
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros. Se o Supabase gerar um tipo estrito demais para o
embed `plans(name)` ou `contract_students!inner(student_id)` (ex.:
`plans` inferido como array em vez de objeto), ajuste o acesso para
`Array.isArray(data.plans) ? data.plans[0]?.name : data.plans?.name` — mas
teste primeiro sem essa mudança, pois o padrão já usado em
`app/(admin)/finance/plans/page.tsx` (`price_tables(name)`) resolve como
objeto único.

- [ ] **Step 3: Commit**

```bash
git add "app/(admin)/students/[id]/contract/new/actions.ts"
git commit -m "feat: server actions de criação de contrato (Fase 5.6)"
```

---

### Task 3: Componentes de passo (`steps.tsx`)

**Files:**
- Create: `app/(admin)/students/[id]/contract/new/steps.tsx`

**Interfaces:**
- Consumes: `Input`, `Label` de `@/components/ui/*`.
- Produces: `PriceTableOption`, `PlanOption`, `GuardianOption` (types),
  `StepPriceTable`, `StepPlan`, `StepDates`, `StepDiscount`,
  `StepInstallments`, `StepResponsible`, `StepConfirm` (componentes React)
  — consumidos pela Task 4 (`contract-wizard.tsx`).

- [ ] **Step 1: Criar o arquivo com os 7 componentes de passo**

```tsx
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActiveContractInfo } from "./actions";
import type { WizardValues } from "./contract-wizard";

export type PriceTableOption = { id: string; name: string };

export type PlanOption = {
  id: string;
  priceTableId: string;
  name: string;
  basePrice: number;
  setupFee: number;
  planDuration: string;
};

export type GuardianOption = {
  id: string;
  name: string;
  isFinancialResponsible: boolean;
};

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const selectClass =
  "h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm";

export function StepPriceTable({
  priceTables,
  value,
  onChange,
}: {
  priceTables: PriceTableOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="priceTableId">Tabela de preço</Label>
      <select
        id="priceTableId"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={selectClass}
      >
        <option value="">Selecione...</option>
        {priceTables.map((pt) => (
          <option key={pt.id} value={pt.id}>
            {pt.name}
          </option>
        ))}
      </select>
      {!priceTables.length && (
        <p className="text-sm text-muted-foreground">
          Nenhuma tabela de preço ativa cadastrada.
        </p>
      )}
    </div>
  );
}

export function StepPlan({
  plans,
  value,
  onChange,
}: {
  plans: PlanOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="planId">Plano</Label>
      <select
        id="planId"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={selectClass}
      >
        <option value="">Selecione...</option>
        {plans.map((plan) => (
          <option key={plan.id} value={plan.id}>
            {plan.name} — {formatMoney(plan.basePrice)}
          </option>
        ))}
      </select>
      {!plans.length && (
        <p className="text-sm text-muted-foreground">
          Nenhum plano ativo nesta tabela de preço.
        </p>
      )}
    </div>
  );
}

export function StepDates({
  startDate,
  endDate,
  firstDueDate,
  onChange,
}: {
  startDate: string;
  endDate: string;
  firstDueDate: string;
  onChange: (
    field: "startDate" | "endDate" | "firstDueDate",
    value: string,
  ) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="startDate">Início do contrato</Label>
        <Input
          id="startDate"
          type="date"
          value={startDate}
          onChange={(e) => onChange("startDate", e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="endDate">Fim do contrato (opcional)</Label>
        <Input
          id="endDate"
          type="date"
          value={endDate}
          onChange={(e) => onChange("endDate", e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="firstDueDate">Primeiro vencimento</Label>
        <Input
          id="firstDueDate"
          type="date"
          value={firstDueDate}
          onChange={(e) => onChange("firstDueDate", e.target.value)}
        />
      </div>
    </div>
  );
}

export function StepDiscount({
  discountType,
  discountValue,
  originalPrice,
  finalPrice,
  onChange,
}: {
  discountType: WizardValues["discountType"];
  discountValue: number;
  originalPrice: number;
  finalPrice: number;
  onChange: (
    field: "discountType" | "discountValue",
    value: WizardValues["discountType"] & number,
  ) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Valor original: {formatMoney(originalPrice)}
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="discountType">Desconto</Label>
        <select
          id="discountType"
          value={discountType}
          onChange={(e) =>
            onChange("discountType", e.target.value as WizardValues["discountType"] & number)
          }
          className={selectClass}
        >
          <option value="none">Sem desconto</option>
          <option value="fixed">Valor fixo (R$)</option>
          <option value="percentage">Percentual (%)</option>
        </select>
      </div>
      {discountType !== "none" && (
        <div className="space-y-1.5">
          <Label htmlFor="discountValue">
            {discountType === "fixed" ? "Valor do desconto (R$)" : "Percentual (%)"}
          </Label>
          <Input
            id="discountValue"
            type="number"
            step="0.01"
            value={discountValue}
            onChange={(e) =>
              onChange(
                "discountValue",
                Number(e.target.value) as WizardValues["discountType"] & number,
              )
            }
          />
        </div>
      )}
      <p className="text-sm font-medium">
        Valor final: {formatMoney(finalPrice)}
      </p>
    </div>
  );
}

export function StepInstallments({
  installmentsCount,
  finalPrice,
  installmentPreview,
  onChange,
}: {
  installmentsCount: number;
  finalPrice: number;
  installmentPreview: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="installmentsCount">Número de parcelas</Label>
        <Input
          id="installmentsCount"
          type="number"
          min={1}
          max={12}
          value={installmentsCount}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        {installmentsCount}x de {formatMoney(installmentPreview)} = {formatMoney(finalPrice)}
      </p>
    </div>
  );
}

export function StepResponsible({
  studentName,
  guardians,
  type,
  guardianId,
  otherName,
  onChange,
}: {
  studentName: string;
  guardians: GuardianOption[];
  type: WizardValues["financialResponsibleType"];
  guardianId: string;
  otherName: string;
  onChange: (
    field:
      | "financialResponsibleType"
      | "financialResponsibleGuardianId"
      | "financialResponsibleOtherName",
    value: string,
  ) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="financialResponsibleType">Responsável financeiro</Label>
        <select
          id="financialResponsibleType"
          value={type}
          onChange={(e) => onChange("financialResponsibleType", e.target.value)}
          className={selectClass}
        >
          <option value="student">O próprio aluno ({studentName})</option>
          <option value="guardian">Um responsável vinculado ao aluno</option>
          <option value="other">Outro (empresa/terceiro sem cadastro)</option>
        </select>
      </div>

      {type === "guardian" && (
        <div className="space-y-1.5">
          <Label htmlFor="financialResponsibleGuardianId">Responsável</Label>
          <select
            id="financialResponsibleGuardianId"
            value={guardianId}
            onChange={(e) =>
              onChange("financialResponsibleGuardianId", e.target.value)
            }
            className={selectClass}
          >
            <option value="">Selecione...</option>
            {guardians.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
                {g.isFinancialResponsible ? " (financeiro)" : ""}
              </option>
            ))}
          </select>
          {!guardians.length && (
            <p className="text-sm text-destructive">
              Este aluno não tem responsáveis vinculados. Cadastre um na
              seção "Responsáveis" da ficha antes de continuar.
            </p>
          )}
        </div>
      )}

      {type === "other" && (
        <div className="space-y-1.5">
          <Label htmlFor="financialResponsibleOtherName">Nome</Label>
          <Input
            id="financialResponsibleOtherName"
            value={otherName}
            onChange={(e) =>
              onChange("financialResponsibleOtherName", e.target.value)
            }
          />
        </div>
      )}
    </div>
  );
}

export function StepConfirm({
  studentName,
  plan,
  priceTables,
  values,
  finalPrice,
  installmentPreview,
  activeContract,
  endPrevious,
  onEndPreviousChange,
}: {
  studentName: string;
  plan: PlanOption | null;
  priceTables: PriceTableOption[];
  values: WizardValues;
  finalPrice: number;
  installmentPreview: number;
  activeContract: ActiveContractInfo | null;
  endPrevious: boolean;
  onEndPreviousChange: (value: boolean) => void;
}) {
  const priceTableName =
    priceTables.find((pt) => pt.id === values.priceTableId)?.name ?? "-";

  return (
    <div className="space-y-3 text-sm">
      <p>
        <span className="text-muted-foreground">Aluno:</span> {studentName}
      </p>
      <p>
        <span className="text-muted-foreground">Tabela de preço:</span>{" "}
        {priceTableName}
      </p>
      <p>
        <span className="text-muted-foreground">Plano:</span> {plan?.name ?? "-"}
      </p>
      <p>
        <span className="text-muted-foreground">Início:</span>{" "}
        {values.startDate} · <span className="text-muted-foreground">1º vencimento:</span>{" "}
        {values.firstDueDate}
      </p>
      <p>
        <span className="text-muted-foreground">Valor final:</span>{" "}
        {formatMoney(finalPrice)} em {values.installmentsCount}x de{" "}
        {formatMoney(installmentPreview)}
      </p>
      <p>
        <span className="text-muted-foreground">Responsável financeiro:</span>{" "}
        {values.financialResponsibleType === "student"
          ? studentName
          : values.financialResponsibleType === "other"
            ? values.financialResponsibleOtherName
            : "Responsável vinculado"}
      </p>

      {activeContract && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3">
          <p className="text-destructive">
            Este aluno já possui um contrato ativo (plano{" "}
            {activeContract.planName}, iniciado em {activeContract.startDate}).
          </p>
          <label className="mt-2 flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={endPrevious}
              onChange={(e) => onEndPreviousChange(e.target.checked)}
            />
            Encerrar o contrato anterior e criar este novo
          </label>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: erros esperados neste ponto, pois `./contract-wizard` (tipo
`WizardValues`) ainda não existe — isso será resolvido na Task 4. Não
precisa corrigir agora; apenas confirme que o único erro é
"Cannot find module './contract-wizard'".

- [ ] **Step 3: Commit**

```bash
git add "app/(admin)/students/[id]/contract/new/steps.tsx"
git commit -m "feat: componentes de passo do wizard de contrato (Fase 5.6)"
```

---

### Task 4: Orquestrador do wizard (`contract-wizard.tsx`)

**Files:**
- Create: `app/(admin)/students/[id]/contract/new/contract-wizard.tsx`

**Interfaces:**
- Consumes: `createContract`, `type ActiveContractInfo` de `./actions`
  (Task 2); `StepPriceTable`, `StepPlan`, `StepDates`, `StepDiscount`,
  `StepInstallments`, `StepResponsible`, `StepConfirm`,
  `type PriceTableOption`, `type PlanOption`, `type GuardianOption` de
  `./steps` (Task 3); `Button` de `@/components/ui/button`.
- Produces: `type WizardValues`, `ContractWizard` (componente) — consumido
  pela Task 5 (`page.tsx`).

- [ ] **Step 1: Criar o arquivo do wizard**

```tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createContract, type ActiveContractInfo } from "./actions";
import {
  StepPriceTable,
  StepPlan,
  StepDates,
  StepDiscount,
  StepInstallments,
  StepResponsible,
  StepConfirm,
  type PriceTableOption,
  type PlanOption,
  type GuardianOption,
} from "./steps";

const STEP_LABELS = [
  "Tabela de preço",
  "Plano",
  "Datas",
  "Desconto",
  "Parcelamento",
  "Responsável financeiro",
  "Confirmação",
];

export type WizardValues = {
  priceTableId: string;
  planId: string;
  startDate: string;
  endDate: string;
  firstDueDate: string;
  discountType: "none" | "fixed" | "percentage";
  discountValue: number;
  installmentsCount: number;
  setupFeeAmount: number;
  financialResponsibleType: "student" | "guardian" | "other";
  financialResponsibleGuardianId: string;
  financialResponsibleOtherName: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function ContractWizard({
  studentId,
  studentName,
  priceTables,
  plans,
  guardians,
  activeContract,
}: {
  studentId: string;
  studentName: string;
  priceTables: PriceTableOption[];
  plans: PlanOption[];
  guardians: GuardianOption[];
  activeContract: ActiveContractInfo | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<WizardValues>({
    priceTableId: "",
    planId: "",
    startDate: todayIso(),
    endDate: "",
    firstDueDate: todayIso(),
    discountType: "none",
    discountValue: 0,
    installmentsCount: 1,
    setupFeeAmount: 0,
    financialResponsibleType: "student",
    financialResponsibleGuardianId: "",
    financialResponsibleOtherName: "",
  });
  const [endPrevious, setEndPrevious] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update<K extends keyof WizardValues>(key: K, value: WizardValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  const plansForTable = useMemo(
    () => plans.filter((p) => p.priceTableId === values.priceTableId),
    [plans, values.priceTableId],
  );

  const selectedPlan = plans.find((p) => p.id === values.planId) ?? null;
  const originalPrice = selectedPlan?.basePrice ?? 0;

  const finalPrice = useMemo(() => {
    if (values.discountType === "fixed") {
      return Math.max(0, originalPrice - values.discountValue);
    }
    if (values.discountType === "percentage") {
      return Math.max(0, originalPrice * (1 - values.discountValue / 100));
    }
    return originalPrice;
  }, [originalPrice, values.discountType, values.discountValue]);

  const installmentPreview = finalPrice / values.installmentsCount;

  function canAdvance(): boolean {
    if (step === 0) return !!values.priceTableId;
    if (step === 1) return !!values.planId;
    if (step === 2) return !!values.startDate && !!values.firstDueDate;
    if (step === 5) {
      if (values.financialResponsibleType === "guardian") {
        return !!values.financialResponsibleGuardianId;
      }
      if (values.financialResponsibleType === "other") {
        return values.financialResponsibleOtherName.trim().length > 0;
      }
      return true;
    }
    return true;
  }

  function next() {
    if (!canAdvance()) {
      toast.error("Preencha os campos obrigatórios antes de continuar.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function onConfirm() {
    if (activeContract && !endPrevious) {
      toast.error(
        "Marque a opção para encerrar o contrato anterior antes de continuar.",
      );
      return;
    }

    setIsSubmitting(true);
    const result = await createContract(studentId, {
      priceTableId: values.priceTableId,
      planId: values.planId,
      startDate: values.startDate,
      endDate: values.endDate,
      firstDueDate: values.firstDueDate,
      discountType: values.discountType,
      discountValue: values.discountValue,
      installmentsCount: values.installmentsCount,
      setupFeeAmount: values.setupFeeAmount,
      financialResponsibleType: values.financialResponsibleType,
      financialResponsibleGuardianId: values.financialResponsibleGuardianId,
      financialResponsibleOtherName: values.financialResponsibleOtherName,
      endPreviousContractId:
        activeContract && endPrevious ? activeContract.id : "",
    });
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Contrato criado com sucesso.");
    router.push(`/students/${studentId}/edit`);
  }

  return (
    <div className="w-full max-w-sm space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Passo {step + 1} de {STEP_LABELS.length}
        </span>
        <span>{STEP_LABELS[step]}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%` }}
        />
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        {step === 0 && (
          <StepPriceTable
            priceTables={priceTables}
            value={values.priceTableId}
            onChange={(v) => {
              update("priceTableId", v);
              update("planId", "");
            }}
          />
        )}
        {step === 1 && (
          <StepPlan
            plans={plansForTable}
            value={values.planId}
            onChange={(v) => {
              update("planId", v);
              const plan = plansForTable.find((p) => p.id === v);
              update("setupFeeAmount", plan?.setupFee ?? 0);
            }}
          />
        )}
        {step === 2 && (
          <StepDates
            startDate={values.startDate}
            endDate={values.endDate}
            firstDueDate={values.firstDueDate}
            onChange={(field, v) => update(field, v)}
          />
        )}
        {step === 3 && (
          <StepDiscount
            discountType={values.discountType}
            discountValue={values.discountValue}
            originalPrice={originalPrice}
            finalPrice={finalPrice}
            onChange={(field, v) => update(field, v as never)}
          />
        )}
        {step === 4 && (
          <StepInstallments
            installmentsCount={values.installmentsCount}
            finalPrice={finalPrice}
            installmentPreview={installmentPreview}
            onChange={(v) => update("installmentsCount", v)}
          />
        )}
        {step === 5 && (
          <StepResponsible
            studentName={studentName}
            guardians={guardians}
            type={values.financialResponsibleType}
            guardianId={values.financialResponsibleGuardianId}
            otherName={values.financialResponsibleOtherName}
            onChange={(field, v) => update(field, v as never)}
          />
        )}
        {step === 6 && (
          <StepConfirm
            studentName={studentName}
            plan={selectedPlan}
            priceTables={priceTables}
            values={values}
            finalPrice={finalPrice}
            installmentPreview={installmentPreview}
            activeContract={activeContract}
            endPrevious={endPrevious}
            onEndPreviousChange={setEndPrevious}
          />
        )}
      </div>

      <div className="flex gap-3">
        {step > 0 && (
          <Button type="button" variant="outline" className="flex-1" onClick={back}>
            Voltar
          </Button>
        )}
        {step < STEP_LABELS.length - 1 && (
          <Button type="button" className="flex-1" onClick={next}>
            Avançar
          </Button>
        )}
        {step === STEP_LABELS.length - 1 && (
          <Button
            type="button"
            className="flex-1"
            disabled={isSubmitting}
            onClick={onConfirm}
          >
            {isSubmitting ? "Salvando..." : "Confirmar e criar contrato"}
          </Button>
        )}
      </div>
    </div>
  );
}
```

Nota: os campos `discountType`/`financialResponsibleType` usam `as never`
no `onChange` porque os componentes de passo (Task 3) aceitam um union de
tipos genérico para o segundo argumento; isso é aceitável aqui pois cada
`Step*` já restringe internamente o formato do valor que emite.

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros relacionados a `contract-wizard.tsx` ou `steps.tsx`
(o módulo `./page` ainda não existe, então nenhum erro relacionado a ele
é esperado ainda).

- [ ] **Step 3: Commit**

```bash
git add "app/(admin)/students/[id]/contract/new/contract-wizard.tsx"
git commit -m "feat: orquestrador do wizard de contrato (Fase 5.6)"
```

---

### Task 5: Página da rota (`page.tsx`)

**Files:**
- Create: `app/(admin)/students/[id]/contract/new/page.tsx`

**Interfaces:**
- Consumes: `requireRole` de `@/lib/permissions`; `createClient` de
  `@/lib/supabase/server`; `getActiveContractForStudent` de `./actions`
  (Task 2); `ContractWizard` de `./contract-wizard` (Task 4).

- [ ] **Step 1: Criar a página**

```tsx
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { getActiveContractForStudent } from "./actions";
import { ContractWizard } from "./contract-wizard";

export default async function NewContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: studentId } = await params;
  await requireRole("admin");
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, name")
    .eq("id", studentId)
    .single();

  if (!student) notFound();

  const [{ data: priceTables }, { data: plans }, { data: guardianLinks }, activeContract] =
    await Promise.all([
      supabase
        .from("price_tables")
        .select("id, name")
        .eq("status", "active")
        .order("name"),
      supabase
        .from("plans")
        .select("id, price_table_id, name, base_price, setup_fee, plan_duration")
        .eq("status", "active")
        .order("name"),
      supabase
        .from("student_guardians")
        .select("is_financial_responsible, guardians(id, name)")
        .eq("student_id", studentId),
      getActiveContractForStudent(studentId),
    ]);

  const guardians = (guardianLinks ?? [])
    .filter((link) => link.guardians)
    .map((link) => ({
      id: link.guardians!.id,
      name: link.guardians!.name,
      isFinancialResponsible: link.is_financial_responsible,
    }));

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="w-full max-w-sm">
        <h1 className="font-heading text-2xl font-semibold">Associar plano</h1>
        <p className="text-sm text-muted-foreground">{student.name}</p>
      </div>
      <ContractWizard
        studentId={student.id}
        studentName={student.name}
        priceTables={priceTables ?? []}
        plans={(plans ?? []).map((plan) => ({
          id: plan.id,
          priceTableId: plan.price_table_id,
          name: plan.name,
          basePrice: plan.base_price,
          setupFee: plan.setup_fee,
          planDuration: plan.plan_duration,
        }))}
        guardians={guardians}
        activeContract={activeContract}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros. Se `link.guardians` for tipado como array pelo
Supabase (em vez de objeto único), troque
`link.guardians!.id`/`link.guardians!.name` por
`link.guardians[0]?.id`/`link.guardians[0]?.name` e ajuste o `.filter`
para `link.guardians?.length`.

- [ ] **Step 3: Commit**

```bash
git add "app/(admin)/students/[id]/contract/new/page.tsx"
git commit -m "feat: página do wizard de associação de plano (Fase 5.6)"
```

---

### Task 6: Link "Associar plano" na ficha do aluno

**Files:**
- Modify: `app/(admin)/students/[id]/edit/page.tsx`

**Interfaces:**
- Consumes: nenhuma nova — apenas adiciona um `Link` do `next/link` e o
  `buttonVariants` de `@/components/ui/button` (mesmo padrão usado em
  `app/(admin)/finance/plans/page.tsx`).

- [ ] **Step 1: Adicionar o link no topo da ficha**

Abra `app/(admin)/students/[id]/edit/page.tsx` e adicione o import e o
link, deixando o cabeçalho da página assim:

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import type { StudentInput } from "@/lib/validations/student";
import { EditStudentForm } from "./form";
import { GuardiansSection, type GuardianLink } from "./guardians-section";
import { AttendanceHistory } from "./attendance-history";
```

E, no JSX, troque o bloco do título:

```tsx
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-semibold">Editar aluno</h1>
          <Link
            href={`/students/${student.id}/contract/new`}
            className={buttonVariants({ size: "sm" })}
          >
            Associar plano
          </Link>
        </div>
      </div>
```

substituindo o bloco original:

```tsx
      <div className="w-full max-w-sm">
        <h1 className="font-heading text-2xl font-semibold">Editar aluno</h1>
      </div>
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add "app/(admin)/students/[id]/edit/page.tsx"
git commit -m "feat: link para associar plano na ficha do aluno (Fase 5.6)"
```

---

### Task 7: Verificação manual completa e fechamento da subtarefa

**Files:** nenhum arquivo novo — apenas validação.

- [ ] **Step 1: Subir o ambiente local**

Run: `supabase start` (se não estiver rodando) e `npm run dev`.

- [ ] **Step 2: Roteiro de teste manual — caminho feliz**

1. Logar como admin.
2. Ir em um aluno sem contrato ativo → clicar "Associar plano".
3. Percorrer os 7 passos: escolher tabela de preço → plano → datas →
   nenhum desconto → 3 parcelas → responsável = o próprio aluno →
   confirmar.
4. Verificar no Supabase Studio (`contracts`, `contract_students`,
   `contract_installments`) que os três registros foram criados
   corretamente e que `students.current_contract_id` foi atualizado.
5. Confirmar que a soma das 3 parcelas bate exatamente com o `final_price`
   (mesmo comportamento validado na Fase 5.5).

- [ ] **Step 3: Roteiro de teste manual — desconto e responsável guardian**

1. Repetir o fluxo em outro aluno que tenha ao menos um responsável
   vinculado (seção "Responsáveis" da ficha).
2. Aplicar desconto percentual de 10% e conferir que o valor final exibido
   bate com o cálculo manual.
3. Escolher responsável financeiro = "guardian" e selecionar o
   responsável vinculado.
4. Confirmar e checar no banco que `financial_responsible_type='guardian'`
   e `financial_responsible_id` aponta para o `guardians.id` correto.

- [ ] **Step 4: Roteiro de teste manual — contrato ativo existente**

1. Tentar associar um novo plano a um aluno que já tem contrato `active`
   (um dos alunos testados no Step 2/3).
2. Confirmar que o passo de confirmação mostra o aviso do contrato ativo
   e que o botão de confirmar falha com toast de erro se a caixa "Encerrar
   o contrato anterior" não estiver marcada.
3. Marcar a caixa, confirmar, e checar no banco que o contrato anterior
   ficou com `status='finished'` e `end_date` preenchido, e que o novo
   contrato foi criado normalmente.

- [ ] **Step 5: Roteiro de teste manual — responsável "outro"**

1. Criar um contrato escolhendo responsável financeiro = "Outro" e
   digitando um nome.
2. Confirmar no banco que `financial_responsible_type='other'`,
   `financial_responsible_id` é `null`, e `contracts.notes` contém o nome
   informado.

- [ ] **Step 6: Validação final de qualidade**

Run: `npm run build`
Expected: build sem erros.

Run: `npx tsc --noEmit`
Expected: sem erros.

Run: `npm run lint`
Expected: sem erros.

- [ ] **Step 7: Atualizar TASK.md e DECISIONS.md**

Marcar `- [x] **5.6 — ...**` em `TASK.md`. Adicionar uma entrada em
`docs/DECISIONS.md` documentando: rota dedicada escolhida, wizard
controlado por `useState` (sem lib de state machine), armazenamento do
nome do responsável "outro" em `contracts.notes`, e a recomputação do
preço final sempre no servidor (nunca confiar no valor calculado no
cliente).

- [ ] **Step 8: Commit final**

```bash
git add TASK.md docs/DECISIONS.md
git commit -m "docs: marcar Fase 5.6 concluída (associar plano ao aluno)"
git push origin master
```

---

## Auto-revisão do plano

- **Cobertura do spec:** os 7 passos do fluxo (`FINANCEIRO.md`, seção
  "Fluxo principal") estão mapeados 1:1 nos componentes `Step*` da Task 3
  e na ordem do `STEP_LABELS` da Task 4. A regra "um contrato ativo por
  aluno, perguntar se deve encerrar" está coberta na Task 2 (Server
  Action) e na Task 3/4 (checkbox de confirmação). A transação lógica
  (`contract` + `contract_students` + `contract_installments`) está
  coberta pela Task 2, aproveitando o trigger já existente da Fase 5.5
  para as parcelas.
- **Placeholders:** nenhum "TBD"/"TODO" — todo código é completo e
  executável como escrito.
- **Consistência de tipos:** `WizardValues` (Task 4) é a única fonte de
  verdade para os campos do formulário; `ContractInput` (Task 1) é a
  única fonte de verdade para o payload da Server Action. Os nomes batem
  entre `contract-wizard.tsx` e `actions.ts` (`priceTableId`, `planId`,
  `startDate`, `endDate`, `firstDueDate`, `discountType`, `discountValue`,
  `installmentsCount`, `setupFeeAmount`, `financialResponsibleType`,
  `financialResponsibleGuardianId`, `financialResponsibleOtherName`,
  `endPreviousContractId`).
