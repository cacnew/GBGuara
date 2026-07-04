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
              seção &quot;Responsáveis&quot; da ficha antes de continuar.
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
