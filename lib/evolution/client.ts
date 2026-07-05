/**
 * Envio manual de mensagem avulsa via Evolution API (Fase 8.3).
 * Sem automação/régua — apenas disparo pontual a partir da ficha do
 * aluno/lead. Configuração exclusivamente por variável de ambiente
 * (seção 6 do NEXUSDOJO_PROJECT.md) — nunca hardcodar URL/token/instância.
 */

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length <= 11 ? `55${digits}` : digits;
}

export async function sendWhatsAppMessage({
  schoolId,
  phone,
  text,
}: {
  schoolId: string;
  phone: string;
  text: string;
}): Promise<{ error?: string }> {
  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instancePrefix = process.env.EVOLUTION_INSTANCE_PREFIX ?? "nexusdojo_";

  if (!apiUrl || !apiKey) {
    return { error: "Integração com WhatsApp não configurada (EVOLUTION_API_URL/EVOLUTION_API_KEY)." };
  }

  const instance = `${instancePrefix}${schoolId}`;
  const number = normalizePhone(phone);

  try {
    const response = await fetch(
      `${apiUrl.replace(/\/$/, "")}/message/sendText/${instance}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
        },
        body: JSON.stringify({ number, text }),
      },
    );

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return { error: `Falha ao enviar mensagem (${response.status}): ${body || "erro desconhecido"}` };
    }

    return {};
  } catch {
    return { error: "Não foi possível conectar à Evolution API." };
  }
}
