/**
 * Envio de e-mail via Resend (Fase 18.1). Configuracao exclusivamente por
 * variavel de ambiente (RESEND_API_KEY/EMAIL_FROM) — mesmo padrao de
 * lib/evolution/client.ts, nunca hardcodar chave/remetente.
 */

import { Resend } from "resend";

export async function sendEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}): Promise<{ error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return { error: "Integração de e-mail não configurada (RESEND_API_KEY/EMAIL_FROM)." };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({ from, to, subject, text });

    if (error) {
      return { error: error.message || "Falha ao enviar e-mail." };
    }

    return {};
  } catch {
    return { error: "Não foi possível conectar à API de e-mail." };
  }
}
