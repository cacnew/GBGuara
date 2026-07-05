/**
 * Formata uma data no formato `YYYY-MM-DD` (coluna `date` do Postgres, sem
 * horário) para `DD/MM/AAAA`. Evita `new Date(str).toLocaleDateString()`,
 * que interpreta a string como UTC e exibe o dia anterior em fusos
 * negativos (Brasil é GMT-3).
 */
export function formatDateOnly(dateOnly: string): string {
  const [year, month, day] = dateOnly.split("-");
  return `${day}/${month}/${year}`;
}
