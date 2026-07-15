"use client";

import { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateOnly } from "@/lib/dates/format";
import type { SituacaoFinanceira, StudentFinance } from "@/modules/students/finance";

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
};

const INSTALLMENT_STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  paid: "Paga",
  partially_paid: "Parcial",
  overdue: "Vencida",
  canceled: "Cancelada",
  refunded: "Estornada",
};

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function FinanceClient({ finance }: { finance: StudentFinance }) {
  const [chargeModalInstallmentId, setChargeModalInstallmentId] = useState<string | null>(null);
  const { contract } = finance;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 text-foreground md:p-6">
      <h1 className="font-heading text-2xl font-semibold">Financeiro</h1>

      {!contract && (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          Nenhum plano associado no momento. Fale com a secretaria da academia.
        </p>
      )}

      {contract && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Situação</p>
              <p className="mt-1">
                <StatusBadge
                  value={finance.situacaoFinanceira}
                  label={SITUACAO_LABEL[finance.situacaoFinanceira]}
                />
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Próximo vencimento</p>
              <p className="mt-1 font-semibold">
                {finance.proximoVencimento ? formatDateOnly(finance.proximoVencimento) : "-"}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Valor em aberto</p>
              <p className="mt-1 font-semibold">{formatMoney(finance.valorEmAberto)}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Valor vencido</p>
              <p
                className={
                  finance.valorVencido > 0
                    ? "mt-1 font-semibold text-destructive"
                    : "mt-1 font-semibold"
                }
              >
                {formatMoney(finance.valorVencido)}
              </p>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 text-sm space-y-1.5">
            <p className="font-medium">
              Plano atual — {contract.planName} (
              {CONTRACT_STATUS_LABEL[contract.status] ?? contract.status})
            </p>
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
              <span className="text-muted-foreground">Valor do plano:</span>{" "}
              {formatMoney(contract.finalPrice)} em {contract.installmentsCount}x
            </p>
            <p>
              <span className="text-muted-foreground">Total pago:</span>{" "}
              {formatMoney(finance.totalPago)}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold">Parcelas</h2>
            <div className="space-y-2">
              {finance.installments.map((installment) => {
                const isPayable =
                  installment.status === "pending" || installment.status === "partially_paid";
                return (
                  <div
                    key={installment.id}
                    className="rounded-lg border border-border bg-card p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">
                        Parcela {installment.installmentNumber} —{" "}
                        {formatMoney(installment.amount)}
                      </p>
                      <StatusBadge
                        value={installment.isOverdue ? "overdue" : installment.status}
                        label={
                          installment.isOverdue
                            ? "Vencida"
                            : (INSTALLMENT_STATUS_LABEL[installment.status] ?? installment.status)
                        }
                      />
                    </div>
                    <p className="text-muted-foreground">
                      Vencimento: {formatDateOnly(installment.dueDate)}
                      {installment.paidAmount > 0 &&
                        ` · Pago: ${formatMoney(installment.paidAmount)}`}
                    </p>
                    {isPayable && (
                      <button
                        type="button"
                        className="mt-2 text-xs font-bold text-primary hover:underline"
                        onClick={() => setChargeModalInstallmentId(installment.id)}
                      >
                        Pagar
                      </button>
                    )}
                    {chargeModalInstallmentId === installment.id && (
                      <div className="mt-2 rounded-lg border border-dashed border-border bg-background p-3 text-xs">
                        {installment.charge ? (
                          <div className="space-y-2">
                            <p className="font-medium">Pix copia-e-cola</p>
                            <div
                              className="h-[180px] w-[180px]"
                              dangerouslySetInnerHTML={{ __html: installment.charge.qrSvg }}
                            />
                            <div className="flex items-center gap-2">
                              <Input readOnly value={installment.charge.pixPayload} className="text-xs" />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  navigator.clipboard.writeText(installment.charge!.pixPayload);
                                  toast.success("Código copiado.");
                                }}
                              >
                                Copiar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">
                            Aguardando o envio da cobrança pelo financeiro da academia. Fale com
                            a secretaria para regularizar esta parcela.
                          </p>
                        )}
                        <button
                          type="button"
                          className="mt-2 text-primary hover:underline"
                          onClick={() => setChargeModalInstallmentId(null)}
                        >
                          Fechar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {!finance.installments.length && (
                <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
                  Nenhuma parcela encontrada.
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
