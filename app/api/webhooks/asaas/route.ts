import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapAsaasStatus } from "@/lib/asaas/client";
import { applyInstallmentPayment, applyInstallmentRefund } from "@/modules/finance/payment-core";

/**
 * Webhook de confirmação de pagamento do Asaas (Fase 19.3). Autenticado
 * pelo header `asaas-access-token` (token configurado no painel do Asaas
 * ao cadastrar a URL do webhook — não é o mesmo esquema `Bearer` da rota
 * de cron, que é injetado pelo próprio Vercel; aqui quem envia o header é
 * o Asaas, então o formato segue a convenção deles).
 *
 * Idempotência: `installment_charges.gateway_status` guarda o último
 * status já processado; se o status recebido for igual ao já gravado,
 * a requisição é tratada como reentrega do mesmo evento (o Asaas reenvia
 * webhooks não confirmados) — só atualiza `raw_payload` para auditoria,
 * sem reaplicar pagamento/estorno.
 *
 * `event` do payload não é usado — o `payment.status` já basta para
 * decidir a ação via `mapAsaasStatus`, independente de qual nome de
 * evento o Asaas mandou (`PAYMENT_CONFIRMED`/`PAYMENT_RECEIVED`/etc. todos
 * viram o mesmo status "confirmed" no nosso lado).
 */

type AsaasWebhookPayload = {
  payment?: { id?: string; status?: string };
};

const CHARGE_TYPE_TO_ACCOUNT_TYPE: Record<string, string> = {
  pix: "pix",
  boleto: "bank",
  cartao: "card",
};

const CHARGE_TYPE_TO_PAYMENT_METHOD: Record<string, string> = {
  pix: "pix",
  boleto: "bank_transfer",
  cartao: "credit_card",
};

export async function POST(request: Request) {
  const token = process.env.ASAAS_WEBHOOK_TOKEN;
  const receivedToken = request.headers.get("asaas-access-token");

  if (!token || receivedToken !== token) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as AsaasWebhookPayload | null;
  const paymentId = body?.payment?.id;
  const rawStatus = body?.payment?.status;

  if (!paymentId || !rawStatus) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: charge } = await supabase
    .from("installment_charges")
    .select("id, school_id, contract_installment_id, charge_type, gateway_status")
    .eq("asaas_charge_id", paymentId)
    .maybeSingle();

  if (!charge) {
    // Cobrança não reconhecida (ex: teste feito direto no painel do Asaas,
    // sem passar pela 19.4) — nada a fazer, mas não é erro nosso.
    return NextResponse.json({ ignored: true });
  }

  const mappedStatus = mapAsaasStatus(rawStatus);

  if (charge.gateway_status === mappedStatus) {
    await supabase.from("installment_charges").update({ raw_payload: body }).eq("id", charge.id);
    return NextResponse.json({ ok: true, alreadyProcessed: true });
  }

  const accountType = CHARGE_TYPE_TO_ACCOUNT_TYPE[charge.charge_type] ?? "other";

  if (mappedStatus === "confirmed") {
    const { data: installment } = await supabase
      .from("contract_installments")
      .select("remaining_amount")
      .eq("id", charge.contract_installment_id)
      .single();

    const { data: account } = await supabase
      .from("financial_accounts")
      .select("id")
      .eq("school_id", charge.school_id)
      .eq("type", accountType)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (!installment || !account) {
      return NextResponse.json({ error: "Parcela ou conta financeira não encontrada" }, { status: 500 });
    }

    const result = await applyInstallmentPayment({
      supabase,
      schoolId: charge.school_id,
      installmentId: charge.contract_installment_id,
      amountPaid: installment.remaining_amount,
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: CHARGE_TYPE_TO_PAYMENT_METHOD[charge.charge_type] ?? "other",
      financialAccountId: account.id,
      userId: null,
      auditAction: "payment_confirmed_gateway",
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } else if (mappedStatus === "refunded") {
    const { data: installment } = await supabase
      .from("contract_installments")
      .select("paid_amount")
      .eq("id", charge.contract_installment_id)
      .single();

    if (installment && installment.paid_amount > 0) {
      const { data: account } = await supabase
        .from("financial_accounts")
        .select("id")
        .eq("school_id", charge.school_id)
        .eq("type", accountType)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (!account) {
        return NextResponse.json({ error: "Conta financeira não encontrada" }, { status: 500 });
      }

      const result = await applyInstallmentRefund({
        supabase,
        schoolId: charge.school_id,
        installmentId: charge.contract_installment_id,
        refundAmount: installment.paid_amount,
        refundDate: new Date().toISOString().slice(0, 10),
        financialAccountId: account.id,
        userId: null,
        auditAction: "payment_refunded_gateway",
      });

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
    }
  }
  // "overdue"/"pending": parcela vencida é derivada por view (`overdue_students`),
  // não armazenada em `contract_installments.status` — só atualiza o
  // gateway_status da cobrança abaixo, sem efeito colateral na parcela.

  await supabase
    .from("installment_charges")
    .update({ gateway_status: mappedStatus, raw_payload: body })
    .eq("id", charge.id);

  return NextResponse.json({ ok: true });
}
