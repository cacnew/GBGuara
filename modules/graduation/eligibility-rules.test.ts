import { describe, expect, it } from "vitest";
import { computeGraduationEligibility } from "./eligibility-rules";

describe("computeGraduationEligibility", () => {
  it("aluno sem meta configurada nunca é apto, sem quebrar (requiredClasses null)", () => {
    const result = computeGraduationEligibility(78, null);
    expect(result).toEqual({
      attendancesSinceLastGraduation: 78,
      requiredClasses: null,
      isEligible: false,
      remaining: 0,
    });
  });

  it("aluno abaixo da meta não é apto e informa quantas faltam", () => {
    const result = computeGraduationEligibility(58, 80);
    expect(result).toEqual({
      attendancesSinceLastGraduation: 58,
      requiredClasses: 80,
      isEligible: false,
      remaining: 22,
    });
  });

  it("aluno exatamente na meta é apto, sem faltar nenhuma aula", () => {
    const result = computeGraduationEligibility(40, 40);
    expect(result.isEligible).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("aluno acima da meta é apto, sem faltar nenhuma aula", () => {
    const result = computeGraduationEligibility(45, 40);
    expect(result.isEligible).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("meta zero: qualquer contagem (inclusive zero) já é apto", () => {
    const result = computeGraduationEligibility(0, 0);
    expect(result.isEligible).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("múltiplas transições com metas diferentes são calculadas de forma independente", () => {
    const transitions = [
      { label: "Branca -> Azul", attendances: 45, required: 40, expectedEligible: true, expectedRemaining: 0 },
      { label: "Azul -> Roxa", attendances: 30, required: 60, expectedEligible: false, expectedRemaining: 30 },
      { label: "Roxa -> Marrom", attendances: 60, required: 60, expectedEligible: true, expectedRemaining: 0 },
      { label: "Marrom -> Preta", attendances: 10, required: 100, expectedEligible: false, expectedRemaining: 90 },
    ];

    for (const t of transitions) {
      const result = computeGraduationEligibility(t.attendances, t.required);
      expect(result.isEligible, t.label).toBe(t.expectedEligible);
      expect(result.remaining, t.label).toBe(t.expectedRemaining);
      expect(result.requiredClasses, t.label).toBe(t.required);
    }
  });
});
