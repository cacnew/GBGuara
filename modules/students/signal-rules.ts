// Regras de negócio confirmadas com o usuário (seção 3 e seção 8 —
// "pontos em aberto" — de modules/modulo_aluno.md): aluno sinaliza no
// máximo 7 dias antes da aula, e ainda pode sinalizar até 24h depois do
// horário de início (tolerância para quem esquece de sinalizar antes).
export const MAX_ADVANCE_DAYS = 7;
export const POST_START_TOLERANCE_HOURS = 24;

export const OCCUPYING_STATUSES = ["signaled", "confirmed", "added_by_instructor"];

export function weekdayOf(date: string): number {
  // `date` é YYYY-MM-DD; usa UTC para não deixar o fuso do servidor
  // deslocar o dia da semana. week_days segue a mesma convenção do
  // Date#getUTCDay (0=domingo … 6=sábado), confirmado contra os dados de
  // seed (seg/qua/sex => [1,3,5]).
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

export type SignalWindowCheck = { allowed: boolean; reason: string | null };

/** Janela temporal de sinalização: até `maxAdvanceDays` antes, até `toleranceHours` depois do início. */
export function checkSignalWindow(
  date: string,
  startTime: string,
  now: Date,
  maxAdvanceDays: number = MAX_ADVANCE_DAYS,
  toleranceHours: number = POST_START_TOLERANCE_HOURS,
): SignalWindowCheck {
  // `Z` explícito: sem isso, o motor JS interpreta a string no fuso LOCAL
  // do processo (ex.: America/Sao_Paulo, UTC-3), enquanto `now` é um
  // instante absoluto — gera um desvio sistemático de horas na janela de
  // sinalização se o servidor não rodar em UTC. Mesma convenção de
  // `weekdayOf`: horário da turma tratado como wall-clock/UTC.
  const sessionStart = new Date(`${date}T${startTime}Z`);
  const maxAdvanceMs = maxAdvanceDays * 24 * 60 * 60 * 1000;
  const toleranceMs = toleranceHours * 60 * 60 * 1000;

  if (sessionStart.getTime() - now.getTime() > maxAdvanceMs) {
    return { allowed: false, reason: `Só é possível sinalizar até ${maxAdvanceDays} dias antes` };
  }
  if (now.getTime() - sessionStart.getTime() > toleranceMs) {
    return { allowed: false, reason: "Prazo para sinalizar essa aula já passou" };
  }
  return { allowed: true, reason: null };
}

/** Duas turmas no mesmo dia com horários que se sobrepõem — bloqueia dupla sinalização. */
export function hasTimeOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return bStart < aEnd && aStart < bEnd;
}

/** `null`/sem capacidade definida = turma flexível, sempre tem vaga. */
export function hasAvailableCapacity(occupied: number, capacity: number | null): boolean {
  if (capacity == null) return true;
  return occupied < capacity;
}
