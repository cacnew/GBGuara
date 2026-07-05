"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateOnly } from "@/lib/dates/format";
import {
  registerInstallmentPayment,
  cancelInstallment,
  refundInstallmentPayment,
} from "@/modules/finance/payment-actions";
import {
  pauseContract,
  resumeContract,
  endContract,
  editInstallmentDueDate,
} from "@/modules/finance/contract-actions";
import type { FinancialSummary, SituacaoFinanceira } from "./financial-queries";

const SITUACAO_LABEL: Record<SituacaoFinanceira, string> = {
  sem_contrato: "Sem contrato",
  isento: "Isento",
  inadimplente: "Inadimplente",
  pausado: "Pausado",
  encerrado: "Encerrado",
  regular: "Regular",
};

const CONTRACT_STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  finished: "Encerrado",
  canceled: "Cancelado",
  paused: "Pausado",
  overdue: "Vencido",
};

const INSTALLMENT_STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  paid: "Paga",
  partially_paid: "Parcial",
  overdue: "Vencida",
  canceled: "Cancelada",
  refunded: "Estornada",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  pix: "Pix",
  cash: "Dinheiro",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  bank_transfer: "Transferência",
  other: "Outro",
};

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type ActiveAction =
  | { type: "pay"; installmentId: string; remainingAmount: number }
  | { type: "refund"; installmentId: string; paidAmount: number }
  | { type: "editDueDate"; installmentId: string; currentDueDate: string }
  | null;

export function FinancialSection({
  studentId,
  summary,
  accounts,
}: {
  studentId: string;
  summary: FinancialSummary;
  accounts: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [activeAction, setActiveAction] = useState<ActiveAction>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [accountId, setAccountId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [amount, setAmount] = useState("0");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [newDueDate, setNewDueDate] = useState("");

  function openPay(installmentId: string, remainingAmount: number) {
    setActiveAction({ type: "pay", installmentId, remainingAmount });
    setAmount(String(remainingAmount));
    setDate(new Date().toISOString().slice(0, 10));
  }

  function openRefund(installmentId: string, paidAmount: number) {
    setActiveAction({ type: "refund", installmentId, paidAmount });
    setAmount(String(paidAmount));
    setDate(new Date().toISOString().slice(0, 10));
    setReason("");
  }

  function openEditDueDate(installmentId: string, currentDueDate: string) {
    setActiveAction({ type: "editDueDate", installmentId, currentDueDate });
    setNewDueDate(currentDueDate);
  }

  async function onCancel(installmentId: string) {
    const result = await cancelInstallment(installmentId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Parcela cancelada.");
    router.refresh();
  }

  async function onSubmitPay() {
    if (activeAction?.type !== "pay") return;
    setIsSubmitting(true);
    const result = await registerInstallmentPayment(activeAction.installmentId, {
      financialAccountId: accountId,
      paymentDate: date,
      paymentMethod: paymentMethod as never,
      amountPaid: Number(amount),
    });
    setIsSubmitting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Pagamento registrado.");
    setActiveAction(null);
    router.refresh();
  }

  async function onSubmitRefund() {
    if (activeAction?.type !== "refund") return;
    setIsSubmitting(true);
    const result = await refundInstallmentPayment(activeAction.installmentId, {
      financialAccountId: accountId,
      refundDate: date,
      refundAmount: Number(amount),
      reason: reason || undefined,
    });
    setIsSubmitting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Pagamento estornado.");
    setActiveAction(null);
    router.refresh();
  }

  async function onSubmitEditDueDate() {
    if (activeAction?.type !== "editDueDate") return;
    setIsSubmitting(true);
    const result = await editInstallmentDueDate(activeAction.installmentId, {
      dueDate: newDueDate,
    });
    setIsSubmitting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Vencimento atualizado.");
    setActiveAction(null);
    router.refresh();
  }

  async function onPause() {
    if (!summary.contract) return;
    const result = await pauseContract(summary.contract.id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Contrato pausado.");
    router.refresh();
  }

  async function onResume() {
    if (!summary.contract) return;
    const result = await resumeContract(summary.contract.id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Contrato retomado.");
    router.refresh();
  }

  async function onEnd() {
    if (!summary.contract) return;
    const result = await endContract(summary.contract.id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Contrato encerrado.");
    router.refresh();
  }

  const today = new Date().toISOString().slice(0, 10);
  const contract = summary.contract;

  return (
    <div className="w-full max-w-sm space-y-4">
      <h2 className="font-heading text-lg font-semibold">Financeiro</h2>

      <div className="rounded-lg border border-border bg-card p-4 text-sm space-y-1.5">
        <p>
          <span className="text-muted-foreground">Situação:</span>{" "}
          {SITUACAO_LABEL[summary.situacaoFinanceira]}
        </p>
        <p>
          <span className="text-muted-foreground">Plano atual:</span>{" "}
          {contract?.planName ?? "-"}
        </p>
        <p>
          <span className="text-muted-foreground">Próximo vencimento:</span>{" "}
          {summary.proximoVencimento ? formatDateOnly(summary.proximoVencimento) : "-"}
        </p>
        <p>
          <span className="text-muted-foreground">Valor em aberto:</span>{" "}
          {formatMoney(summary.valorEmAberto)}
        </p>
        <p>
          <span className="text-muted-foreground">Valor vencido:</span>{" "}
          {formatMoney(summary.valorVencido)}
        </p>
        <p>
          <span className="text-muted-foreground">Total pago:</span>{" "}
          {formatMoney(summary.totalPago)}
        </p>
        <p>
          <span className="text-muted-foreground">Total contratado:</span>{" "}
          {formatMoney(summary.totalContratado)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/students/${studentId}/contract/new`}
          className={buttonVariants({ size: "sm", variant: "outline" })}
        >
          {contract ? "Trocar/renovar plano" : "Associar plano"}
        </Link>
        {contract?.status === "active" && (
          <>
            <Button size="sm" variant="outline" onClick={onPause}>
              Pausar contrato
            </Button>
            <Button size="sm" variant="destructive" onClick={onEnd}>
              Encerrar contrato
            </Button>
          </>
        )}
        {contract?.status === "paused" && (
          <>
            <Button size="sm" variant="outline" onClick={onResume}>
              Retomar contrato
            </Button>
            <Button size="sm" variant="destructive" onClick={onEnd}>
              Encerrar contrato
            </Button>
          </>
        )}
      </div>

      {contract && (
        <div className="rounded-lg border border-border bg-card p-4 text-sm space-y-1.5">
          <p className="font-medium">Contrato atual ({CONTRACT_STATUS_LABEL[contract.status] ?? contract.status})</p>
          <p>
            <span className="text-muted-foreground">Tabela de preço:</span>{" "}
            {contract.priceTableName}
          </p>
          <p>
            <span className="text-muted-foreground">Período:</span>{" "}
            {formatDateOnly(contract.startDate)}
            {contract.endDate ? ` – ${formatDateOnly(contract.endDate)}` : ""}
          </p>
          <p>
            <span className="text-muted-foreground">Valor original:</span>{" "}
            {formatMoney(contract.originalPrice)}
          </p>
          <p>
            <span className="text-muted-foreground">Desconto:</span>{" "}
            {contract.discountType === "none"
              ? "-"
              : contract.discountType === "fixed"
                ? formatMoney(contract.discountValue)
                : `${contract.discountValue}%`}
          </p>
          <p>
            <span className="text-muted-foreground">Valor final:</span>{" "}
            {formatMoney(contract.finalPrice)} em {contract.installmentsCount}x
          </p>
          <p>
            <span className="text-muted-foreground">Parcelas pagas:</span>{" "}
            {summary.parcelasPagas} ·{" "}
            <span className="text-muted-foreground">Pendentes:</span>{" "}
            {summary.parcelasPendentes} ·{" "}
            <span className="text-muted-foreground">Vencidas:</span>{" "}
            {summary.parcelasVencidas}
          </p>
        </div>
      )}

      {summary.installments.length > 0 && (
        <div className="space-y-2">
          {summary.installments.map((installment) => (
            <div
              key={installment.id}
              className="rounded-lg border border-border bg-card p-3 text-sm"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  Parcela {installment.installmentNumber} —{" "}
                  {formatMoney(installment.amount)}
                </p>
                <span className="text-xs text-muted-foreground">
                  {INSTALLMENT_STATUS_LABEL[installment.status] ?? installment.status}
                </span>
              </div>
              <p className="text-muted-foreground">
                Vencimento: {formatDateOnly(installment.dueDate)}
                {installment.paidAmount > 0 &&
                  ` · Pago: ${formatMoney(installment.paidAmount)}`}
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                {(installment.status === "pending" ||
                  installment.status === "partially_paid" ||
                  installment.status === "overdue") && (
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => openPay(installment.id, installment.remainingAmount)}
                  >
                    Registrar pagamento
                  </button>
                )}
                {(installment.status === "paid" ||
                  installment.status === "partially_paid") && (
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => openRefund(installment.id, installment.paidAmount)}
                  >
                    Estornar
                  </button>
                )}
                {installment.status === "pending" && installment.dueDate >= today && (
                  <button
                    type="button"
                    className="text-destructive hover:underline"
                    onClick={() => onCancel(installment.id)}
                  >
                    Cancelar parcela
                  </button>
                )}
                {installment.status === "pending" && (
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => openEditDueDate(installment.id, installment.dueDate)}
                  >
                    Editar vencimento
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeAction?.type === "pay" && (
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium">Registrar pagamento</p>
          <div className="space-y-1.5">
            <Label htmlFor="payAccount">Conta financeira</Label>
            <select
              id="payAccount"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
            >
              <option value="">Selecione...</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="payMethod">Forma de pagamento</Label>
            <select
              id="payMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
            >
              {Object.entries(PAYMENT_METHOD_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="payDate">Data do pagamento</Label>
            <Input
              id="payDate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="payAmount">Valor pago (R$)</Label>
            <Input
              id="payAmount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setActiveAction(null)}
            >
              Cancelar
            </Button>
            <Button className="flex-1" disabled={isSubmitting} onClick={onSubmitPay}>
              {isSubmitting ? "Salvando..." : "Confirmar"}
            </Button>
          </div>
        </div>
      )}

      {activeAction?.type === "refund" && (
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium">Estornar pagamento</p>
          <div className="space-y-1.5">
            <Label htmlFor="refundAccount">Conta financeira</Label>
            <select
              id="refundAccount"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
            >
              <option value="">Selecione...</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="refundDate">Data do estorno</Label>
            <Input
              id="refundDate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="refundAmount">Valor do estorno (R$)</Label>
            <Input
              id="refundAmount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="refundReason">Motivo (opcional)</Label>
            <Input
              id="refundReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setActiveAction(null)}
            >
              Cancelar
            </Button>
            <Button className="flex-1" disabled={isSubmitting} onClick={onSubmitRefund}>
              {isSubmitting ? "Salvando..." : "Confirmar"}
            </Button>
          </div>
        </div>
      )}

      {activeAction?.type === "editDueDate" && (
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium">Editar vencimento</p>
          <div className="space-y-1.5">
            <Label htmlFor="newDueDate">Novo vencimento</Label>
            <Input
              id="newDueDate"
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setActiveAction(null)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              disabled={isSubmitting}
              onClick={onSubmitEditDueDate}
            >
              {isSubmitting ? "Salvando..." : "Confirmar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
