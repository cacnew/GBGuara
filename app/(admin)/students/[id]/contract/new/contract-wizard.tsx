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
