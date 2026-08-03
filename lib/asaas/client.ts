/**
 * Integração com o Asaas (Fase 19.2) — pagamento online via gateway
 * (Pix/boleto/cartão). Configuração exclusivamente por variável de
 * ambiente (`ASAAS_API_KEY`/`ASAAS_ENV`), mesmo padrão de
 * `lib/evolution/client.ts`/`lib/email/client.ts` — nunca hardcodar chave.
 */

const ASAAS_BASE_URLS = {
  sandbox: "https://sandbox.asaas.com/api/v3",
  production: "https://api.asaas.com/v3",
} as const;

const MISSING_CONFIG_ERROR = "Integração com o Asaas não configurada (ASAAS_API_KEY).";

function getAsaasConfig(): { apiKey: string; baseUrl: string } | null {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) return null;

  const env = process.env.ASAAS_ENV === "production" ? "production" : "sandbox";
  return { apiKey, baseUrl: ASAAS_BASE_URLS[env] };
}

type AsaasErrorBody = { errors?: { description?: string }[] };

async function asaasFetch<T>(
  config: { apiKey: string; baseUrl: string },
  path: string,
  init?: RequestInit,
): Promise<{ data: T } | { error: string }> {
  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: config.apiKey,
      ...init?.headers,
    },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (body as AsaasErrorBody | null)?.errors?.[0]?.description || `Falha na API do Asaas (${response.status}).`;
    return { error: message };
  }

  return { data: body as T };
}

const NETWORK_ERROR = { error: "Não foi possível conectar à API do Asaas." } as const;

export type AsaasBillingType = "PIX" | "BOLETO" | "CREDIT_CARD";

export type AsaasGatewayStatus = "pending" | "confirmed" | "overdue" | "refunded";

/**
 * Mapeia os status brutos do Asaas (várias variações internas) para o
 * enum reduzido usado em `installment_charges.gateway_status` — usado
 * tanto por `getAsaasChargeStatus` (consulta ativa) quanto pelo webhook
 * de confirmação de pagamento (Fase 19.3), para não duplicar a lógica de
 * mapeamento nos dois lugares.
 */
export function mapAsaasStatus(rawStatus: string): AsaasGatewayStatus {
  switch (rawStatus) {
    case "RECEIVED":
    case "CONFIRMED":
    case "RECEIVED_IN_CASH":
      return "confirmed";
    case "OVERDUE":
      return "overdue";
    case "REFUNDED":
    case "REFUND_REQUESTED":
    case "CHARGEBACK_REQUESTED":
    case "CHARGEBACK_DISPUTE":
      return "refunded";
    default:
      return "pending";
  }
}

export async function createAsaasCustomer({
  name,
  cpfCnpj,
  email,
  phone,
}: {
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
}): Promise<{ customerId: string } | { error: string }> {
  const config = getAsaasConfig();
  if (!config) return { error: MISSING_CONFIG_ERROR };

  const result = await asaasFetch<{ id: string }>(config, "/customers", {
    method: "POST",
    body: JSON.stringify({ name, cpfCnpj, email, phone }),
  }).catch(() => NETWORK_ERROR);

  if ("error" in result) return { error: result.error };
  return { customerId: result.data.id };
}

/**
 * Cria a cobrança no Asaas. Para Pix, busca em seguida o copia-e-cola via
 * `/payments/{id}/pixQrCode` (endpoint separado do Asaas) e devolve em
 * `pixPayload` — mesmo formato de texto EMV já usado por `pix_payload`
 * (Fase 10.6), renderizável pelo mesmo componente de QR Code existente.
 * Se a busca do QR Code falhar, a cobrança em si já foi criada com
 * sucesso no Asaas — não desfaz, só devolve sem `pixPayload` (o link da
 * fatura em `invoiceUrl` continua funcionando como alternativa).
 */
export async function createAsaasCharge({
  customerId,
  billingType,
  value,
  dueDate,
  description,
}: {
  customerId: string;
  billingType: AsaasBillingType;
  value: number;
  dueDate: string;
  description?: string;
}): Promise<{ chargeId: string; invoiceUrl: string; pixPayload?: string } | { error: string }> {
  const config = getAsaasConfig();
  if (!config) return { error: MISSING_CONFIG_ERROR };

  const result = await asaasFetch<{ id: string; invoiceUrl: string }>(config, "/payments", {
    method: "POST",
    body: JSON.stringify({ customer: customerId, billingType, value, dueDate, description }),
  }).catch(() => NETWORK_ERROR);

  if ("error" in result) return { error: result.error };

  const { id: chargeId, invoiceUrl } = result.data;

  if (billingType !== "PIX") {
    return { chargeId, invoiceUrl };
  }

  const pixResult = await asaasFetch<{ payload: string }>(config, `/payments/${chargeId}/pixQrCode`).catch(
    () => NETWORK_ERROR,
  );
  if ("error" in pixResult) return { chargeId, invoiceUrl };

  return { chargeId, invoiceUrl, pixPayload: pixResult.data.payload };
}

export async function getAsaasChargeStatus(
  chargeId: string,
): Promise<{ status: AsaasGatewayStatus } | { error: string }> {
  const config = getAsaasConfig();
  if (!config) return { error: MISSING_CONFIG_ERROR };

  const result = await asaasFetch<{ status: string }>(config, `/payments/${chargeId}`).catch(() => NETWORK_ERROR);
  if ("error" in result) return { error: result.error };

  return { status: mapAsaasStatus(result.data.status) };
}
