"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MetricCard } from "@/components/dashboard/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateOnly } from "@/lib/dates/format";
import { sendPixCharge, updateSchoolPixKey } from "@/modules/finance/charge-actions";
import { registerInstallmentPayment } from "@/modules/finance/payment-actions";

export type ChargeableInstallment = {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  remainingAmount: number;
  status: string;
  studentId: string | null;
  studentName: string;
  planName: string;
  lastCharge: { pixPayload: string | null; sentAt: string } | null;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  paid: "Paga",
  partially_paid: "Parcial",
  overdue: "Vencida",
};

const PAYABLE_STATUSES = ["pending", "partially_paid", "overdue"];

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ChargesClient({
  hasPixKey,
  monthValue,
  studentFilter,
  installments,
  accounts,
  counts,
}: {
  hasPixKey: boolean;
  monthValue: string;
  studentFilter: string;
  installments: ChargeableInstallment[];
  accounts: { id: string; name: string }[];
  counts: { paid: number; pending: number; overdue: number };
}) {
  const router = useRouter();
  const [pixKeyInput, setPixKeyInput] = useState("");
  const [savingKey, setSavingKey] = useState(false);
  const [qrByInstallment, setQrByInstallment] = useState<Record<string, { payload: string; svg: string }>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);

  async function onSavePixKey() {
    setSavingKey(true);
    const result = await updateSchoolPixKey(pixKeyInput);
    setSavingKey(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Chave Pix da escola salva.");
    router.refresh();
  }

  async function onSendCharge(installmentId: string) {
    setSendingId(installmentId);
    const result = await sendPixCharge(installmentId);
    setSendingId(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    if (result.pixPayload && result.qrSvg) {
      setQrByInstallment((prev) => ({
        ...prev,
        [installmentId]: { payload: result.pixPayload!, svg: result.qrSvg! },
      }));
    }
    toast.success("Cobrança enviada ao aluno.");
    router.refresh();
  }

  function openPay(installmentId: string) {
    setPayingId(installmentId);
    setAccountId("");
    setPaymentDate(new Date().toISOString().slice(0, 10));
  }

  async function onConfirmPayment(installment: ChargeableInstallment) {
    if (!accountId) {
      toast.error("Selecione a conta financeira.");
      return;
    }
    setIsSubmittingPay(true);
    const result = await registerInstallmentPayment(installment.id, {
      financialAccountId: accountId,
      paymentDate,
      paymentMethod: "pix",
      amountPaid: installment.remainingAmount,
    });
    setIsSubmittingPay(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Pagamento confirmado.");
    setPayingId(null);
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 text-foreground">
      <h1 className="font-heading text-2xl font-semibold">Cobranças</h1>

      {!hasPixKey && (
        <div className="space-y-2 rounded-lg border border-dashed border-border bg-card p-4">
          <p className="text-sm font-medium">Configure a chave Pix da escola</p>
          <p className="text-sm text-muted-foreground">
            Necessária para gerar o Pix copia-e-cola/QR Code das cobranças.
          </p>
          <div className="flex max-w-sm gap-2">
            <Input
              placeholder="Chave Pix (CPF, CNPJ, e-mail, telefone ou aleatória)"
              value={pixKeyInput}
              onChange={(e) => setPixKeyInput(e.target.value)}
            />
            <Button disabled={savingKey} onClick={onSavePixKey}>
              {savingKey ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Pagas no mês" value={counts.paid} />
        <MetricCard label="Pendentes no mês" value={counts.pending} />
        <MetricCard label="Vencidas no mês" value={counts.overdue} variant="destructive" />
      </div>

      <form className="flex flex-wrap gap-2 text-sm">
        <input
          type="month"
          name="month"
          defaultValue={monthValue}
          className="h-8 rounded-lg border border-border bg-background px-2.5"
        />
        <input
          type="text"
          name="student"
          placeholder="Buscar aluno..."
          defaultValue={studentFilter}
          className="h-8 rounded-lg border border-border bg-background px-2.5"
        />
        <button
          type="submit"
          className="h-8 rounded-lg border border-border bg-background px-3 text-sm hover:bg-muted"
        >
          Filtrar
        </button>
      </form>

      <div className="space-y-2">
        {installments.map((installment) => {
          const isPayable = PAYABLE_STATUSES.includes(installment.status);
          const isOverdue = isPayable && installment.dueDate < new Date().toISOString().slice(0, 10);
          const qr = qrByInstallment[installment.id];
          return (
            <div key={installment.id} className="rounded-lg border border-border bg-card p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{installment.studentName}</p>
                  <p className="text-muted-foreground">
                    {installment.planName} · Parcela {installment.installmentNumber} —{" "}
                    {formatMoney(installment.amount)} · Vencimento: {formatDateOnly(installment.dueDate)}
                  </p>
                </div>
                <StatusBadge
                  value={isOverdue ? "overdue" : installment.status}
                  label={isOverdue ? "Vencida" : (STATUS_LABEL[installment.status] ?? installment.status)}
                />
              </div>

              {isPayable && (
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                  <button
                    type="button"
                    className="font-bold text-primary hover:underline disabled:opacity-50"
                    disabled={!hasPixKey || sendingId === installment.id}
                    onClick={() => onSendCharge(installment.id)}
                  >
                    {sendingId === installment.id
                      ? "Enviando..."
                      : installment.lastCharge
                        ? "Reenviar cobrança"
                        : "Enviar cobrança"}
                  </button>
                  <button
                    type="button"
                    className="font-bold text-primary hover:underline"
                    onClick={() => openPay(installment.id)}
                  >
                    Confirmar pagamento
                  </button>
                  {installment.lastCharge && (
                    <span className="text-muted-foreground">
                      Cobrança enviada em {formatDateOnly(installment.lastCharge.sentAt.slice(0, 10))}
                    </span>
                  )}
                </div>
              )}

              {qr && (
                <div className="mt-3 space-y-2 rounded-lg border border-dashed border-border bg-background p-3">
                  <p className="text-xs font-medium">Pix copia-e-cola</p>
                  <div
                    className="h-[180px] w-[180px]"
                    dangerouslySetInnerHTML={{ __html: qr.svg }}
                  />
                  <div className="flex items-center gap-2">
                    <Input readOnly value={qr.payload} className="text-xs" />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(qr.payload);
                        toast.success("Código copiado.");
                      }}
                    >
                      Copiar
                    </Button>
                  </div>
                </div>
              )}

              {payingId === installment.id && (
                <div className="mt-3 space-y-2 rounded-lg border border-dashed border-border bg-background p-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`account-${installment.id}`}>Conta financeira</Label>
                    <select
                      id={`account-${installment.id}`}
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
                    <Label htmlFor={`date-${installment.id}`}>Data do pagamento</Label>
                    <Input
                      id={`date-${installment.id}`}
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setPayingId(null)}>
                      Cancelar
                    </Button>
                    <Button
                      className="flex-1"
                      disabled={isSubmittingPay}
                      onClick={() => onConfirmPayment(installment)}
                    >
                      {isSubmittingPay ? "Salvando..." : `Confirmar ${formatMoney(installment.remainingAmount)}`}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {!installments.length && (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            Nenhuma parcela encontrada para o filtro atual.
          </p>
        )}
      </div>
    </div>
  );
}
