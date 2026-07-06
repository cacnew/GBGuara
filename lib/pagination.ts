export const PAGE_SIZE = 20;

/**
 * `searchParams.page` chega como string (ou undefined) do Next.js — normaliza
 * para um inteiro >= 1, caindo em 1 para qualquer valor ausente/inválido
 * (não-numérico, zero, negativo) em vez de propagar um range inválido pro
 * Supabase.
 */
export function parsePage(page: string | undefined): number {
  const parsed = Number(page);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
}

/**
 * Converte a página (1-based) em `[from, to]` inclusive para `.range()` do
 * Supabase/PostgREST.
 */
export function getRange(page: number, pageSize: number = PAGE_SIZE): [number, number] {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return [from, to];
}
