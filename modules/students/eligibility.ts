export type MinBeltInfo = { ordering: number; belt_system_id: string } | null;

export type ClassEligibilityRequirements = {
  sex_restriction: string | null;
  min_belt_id: string | null;
  min_degree: number | null;
  belts: MinBeltInfo;
};

export type StudentEligibility = {
  sex: string | null;
  current_degree: number;
  belts: { ordering: number; belt_system_id: string } | null;
};

export type EligibilityResult = { eligible: boolean; reason: string | null };

/**
 * Regras de elegibilidade de turma (seção 3 da spec): sexo, faixa mínima e
 * grau mínimo — todas opt-in (Fase 9.2/9.4), turma sem restrição configurada
 * é sempre elegível. Faixa só é comparada quando aluno e turma usam o mesmo
 * `belt_system_id` (fail-closed caso contrário, já que não dá pra confirmar
 * o requisito).
 */
export function checkEligibility(
  classGroup: ClassEligibilityRequirements,
  student: StudentEligibility,
): EligibilityResult {
  if (classGroup.sex_restriction && student.sex !== classGroup.sex_restriction) {
    return { eligible: false, reason: "Restrito por sexo" };
  }

  if (classGroup.min_belt_id) {
    const minBelt = classGroup.belts;
    const studentBelt = student.belts;

    if (!minBelt || !studentBelt || studentBelt.belt_system_id !== minBelt.belt_system_id) {
      return { eligible: false, reason: "Faixa mínima não atendida" };
    }
    if (studentBelt.ordering < minBelt.ordering) {
      return { eligible: false, reason: "Faixa mínima não atendida" };
    }
    if (
      studentBelt.ordering === minBelt.ordering &&
      classGroup.min_degree != null &&
      student.current_degree < classGroup.min_degree
    ) {
      return { eligible: false, reason: "Grau mínimo não atendido" };
    }
  }

  return { eligible: true, reason: null };
}
