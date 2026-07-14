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

/**
 * Rótulo pt-BR dos dias da semana em que uma turma recorrente ocorre, a
 * partir de `class_groups.week_days` (smallint[], mesma convenção do
 * Postgres `extract(dow ...)`/`Date#getUTCDay`: 0=domingo ... 6=sábado).
 */
const WEEKDAY_FULL_LABELS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export function formatWeekDays(weekDays: number[]): string {
  return [...weekDays]
    .sort((a, b) => a - b)
    .map((day) => WEEKDAY_FULL_LABELS[day] ?? "")
    .filter(Boolean)
    .join(", ");
}
