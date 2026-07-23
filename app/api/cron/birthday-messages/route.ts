import { NextResponse } from "next/server";
import { runBirthdayMessageJob } from "@/modules/birthday-messages/job";

/**
 * Disparo diário de mensagens de aniversário (Fase 15.3), agendado via
 * Vercel Cron (`vercel.json`, `"0 11 * * *"` — Vercel Cron roda em UTC;
 * 11:00 UTC = 08:00 BRT/UTC-3, horário pedido na especificação). Vercel
 * injeta automaticamente o header
 * `Authorization: Bearer ${CRON_SECRET}` nas chamadas do próprio cron
 * quando essa env var existe no projeto — qualquer outra origem sem o
 * segredo correto recebe 401, primeira rota de API do projeto (sem sessão
 * de usuário, protegida só por segredo compartilhado).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const summary = await runBirthdayMessageJob();
  return NextResponse.json(summary);
}
