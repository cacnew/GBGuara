/**
 * Lógica pura de aptidão para graduação — sem nenhum import via alias
 * `@/`, de propósito (mesmo motivo documentado nas Fases 9.11/12.9/13.1:
 * um import `@/` aqui quebra o vitest, que não resolve esse alias).
 */

export type GraduationEligibility = {
  attendancesSinceLastGraduation: number;
  requiredClasses: number | null;
  isEligible: boolean;
  remaining: number;
};

/**
 * Compara as presenças desde a última graduação (Fase 6.3) contra a meta
 * configurada para a transição de faixa atual do aluno (Fase 13.1).
 * `requiredClasses` null significa que o admin ainda não configurou meta
 * para essa transição (ou o aluno já está na última faixa do sistema) —
 * nesse caso o aluno nunca aparece como apto, mas a tela também não
 * quebra. O sistema nunca gradua automaticamente: isto só alimenta o
 * indicador visual, a decisão continua sendo do professor.
 */
export function computeGraduationEligibility(
  attendancesSinceLastGraduation: number,
  requiredClasses: number | null,
): GraduationEligibility {
  if (requiredClasses === null) {
    return {
      attendancesSinceLastGraduation,
      requiredClasses: null,
      isEligible: false,
      remaining: 0,
    };
  }

  const isEligible = attendancesSinceLastGraduation >= requiredClasses;
  return {
    attendancesSinceLastGraduation,
    requiredClasses,
    isEligible,
    remaining: isEligible ? 0 : requiredClasses - attendancesSinceLastGraduation,
  };
}
