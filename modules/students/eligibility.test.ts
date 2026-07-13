import { describe, expect, it } from "vitest";
import { checkEligibility } from "./eligibility";

const BELT_SYSTEM_A = "belt-system-a";
const BELT_SYSTEM_B = "belt-system-b";

describe("checkEligibility", () => {
  it("é elegível quando a turma não tem nenhuma restrição", () => {
    const result = checkEligibility(
      { sex_restriction: null, min_belt_id: null, min_degree: null, belts: null },
      { sex: null, current_degree: 0, belts: null },
    );
    expect(result).toEqual({ eligible: true, reason: null });
  });

  it("bloqueia por sexo quando a turma restringe e o aluno não atende", () => {
    const result = checkEligibility(
      { sex_restriction: "feminino", min_belt_id: null, min_degree: null, belts: null },
      { sex: "masculino", current_degree: 0, belts: null },
    );
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("Restrito por sexo");
  });

  it("permite quando o sexo do aluno atende à restrição da turma", () => {
    const result = checkEligibility(
      { sex_restriction: "feminino", min_belt_id: null, min_degree: null, belts: null },
      { sex: "feminino", current_degree: 0, belts: null },
    );
    expect(result.eligible).toBe(true);
  });

  it("bloqueia por faixa mínima quando o aluno não tem faixa nenhuma", () => {
    const result = checkEligibility(
      {
        sex_restriction: null,
        min_belt_id: "belt-blue",
        min_degree: null,
        belts: { ordering: 2, belt_system_id: BELT_SYSTEM_A },
      },
      { sex: null, current_degree: 0, belts: null },
    );
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("Faixa mínima não atendida");
  });

  it("bloqueia (fail-closed) quando aluno e turma usam belt_system_id diferentes", () => {
    const result = checkEligibility(
      {
        sex_restriction: null,
        min_belt_id: "belt-blue",
        min_degree: null,
        belts: { ordering: 2, belt_system_id: BELT_SYSTEM_A },
      },
      { sex: null, current_degree: 3, belts: { ordering: 5, belt_system_id: BELT_SYSTEM_B } },
    );
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("Faixa mínima não atendida");
  });

  it("bloqueia quando a faixa do aluno é inferior à faixa mínima exigida", () => {
    const result = checkEligibility(
      {
        sex_restriction: null,
        min_belt_id: "belt-blue",
        min_degree: null,
        belts: { ordering: 2, belt_system_id: BELT_SYSTEM_A },
      },
      { sex: null, current_degree: 4, belts: { ordering: 1, belt_system_id: BELT_SYSTEM_A } },
    );
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("Faixa mínima não atendida");
  });

  it("permite quando a faixa do aluno é superior à mínima, mesmo com grau baixo", () => {
    const result = checkEligibility(
      {
        sex_restriction: null,
        min_belt_id: "belt-blue",
        min_degree: 3,
        belts: { ordering: 2, belt_system_id: BELT_SYSTEM_A },
      },
      { sex: null, current_degree: 0, belts: { ordering: 3, belt_system_id: BELT_SYSTEM_A } },
    );
    expect(result.eligible).toBe(true);
  });

  it("bloqueia por grau mínimo quando a faixa é igual mas o grau é insuficiente", () => {
    const result = checkEligibility(
      {
        sex_restriction: null,
        min_belt_id: "belt-blue",
        min_degree: 3,
        belts: { ordering: 2, belt_system_id: BELT_SYSTEM_A },
      },
      { sex: null, current_degree: 1, belts: { ordering: 2, belt_system_id: BELT_SYSTEM_A } },
    );
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("Grau mínimo não atendido");
  });

  it("permite quando a faixa é igual e o grau atende ao mínimo exigido", () => {
    const result = checkEligibility(
      {
        sex_restriction: null,
        min_belt_id: "belt-blue",
        min_degree: 3,
        belts: { ordering: 2, belt_system_id: BELT_SYSTEM_A },
      },
      { sex: null, current_degree: 3, belts: { ordering: 2, belt_system_id: BELT_SYSTEM_A } },
    );
    expect(result.eligible).toBe(true);
  });
});
