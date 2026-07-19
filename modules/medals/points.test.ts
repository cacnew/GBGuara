import { describe, expect, it } from "vitest";
import { resolveMedalPoints } from "./points-rules";

describe("resolveMedalPoints", () => {
  it("usa o override do evento quando definido para o nível", () => {
    expect(resolveMedalPoints("ouro", { ouro: 10 }, { ouro: 3 })).toBe(10);
  });

  it("usa o default da escola quando o evento não tem override para o nível", () => {
    expect(resolveMedalPoints("prata", { ouro: 10 }, { prata: 2 })).toBe(2);
  });

  it("retorna 0 quando nem override nem default existem para o nível", () => {
    expect(resolveMedalPoints("bronze", {}, {})).toBe(0);
  });

  it("nível participação pode valer pontos maiores que zero quando configurado (decisão 2 da Fase 12)", () => {
    expect(resolveMedalPoints("participacao", {}, { participacao: 1 })).toBe(1);
  });

  it("override de 0 pontos é respeitado mesmo havendo default maior que zero", () => {
    expect(resolveMedalPoints("ouro", { ouro: 0 }, { ouro: 3 })).toBe(0);
  });
});
