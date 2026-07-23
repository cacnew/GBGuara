/**
 * Regra pura de "quem faz aniversário hoje" (Fase 15.3/15.4), extraída do
 * job para ser testável sem banco. Compara só mês/dia como substring da
 * string `date` (YYYY-MM-DD), nunca via `new Date()` — mesma lição do bug
 * 7.8 (evita desvio de dia em fusos negativos).
 */
export function isBirthdayToday(birthDate: string | null, todayISO: string): boolean {
  if (!birthDate) return false;
  return birthDate.slice(5, 10) === todayISO.slice(5, 10);
}
