import { describe, expect, it } from "vitest";
import { aggregateMedalPoints, type ApprovedMedalRecord } from "./ranking-rules";

const FIXED_POINTS: Record<string, number> = { ouro: 3, prata: 2, bronze: 1, participacao: 0 };
const pointsFor = (_eventId: string, level: string) => FIXED_POINTS[level] ?? 0;

const medals: ApprovedMedalRecord[] = [
  { studentId: "a", level: "ouro", eventId: "e1", eventYear: 2026 },
  { studentId: "a", level: "prata", eventId: "e2", eventYear: 2025 },
  { studentId: "b", level: "bronze", eventId: "e1", eventYear: 2026 },
  { studentId: "b", level: "participacao", eventId: "e3", eventYear: 2026 },
];

describe("aggregateMedalPoints", () => {
  it("soma pontos só do ano filtrado (ranking anual)", () => {
    const totals = aggregateMedalPoints(medals, pointsFor, { year: 2026 });
    expect(totals.get("a")).toBe(3);
    expect(totals.get("b")).toBe(1);
  });

  it("ano sem nenhuma medalha aprovada retorna mapa vazio", () => {
    const totals = aggregateMedalPoints(medals, pointsFor, { year: 2020 });
    expect(totals.size).toBe(0);
  });

  it("filtro por evento ignora o ano selecionado (decisão 12 da Fase 12)", () => {
    const totals = aggregateMedalPoints(medals, pointsFor, { eventId: "e2" });
    expect(totals.get("a")).toBe(2);
    expect(totals.has("b")).toBe(false);
  });

  it("sem filtro soma todos os anos (pontos totais do resumo pessoal)", () => {
    const totals = aggregateMedalPoints(medals, pointsFor, {});
    expect(totals.get("a")).toBe(5);
    expect(totals.get("b")).toBe(1);
  });

  it("nível participação com peso configurável entra na soma normalmente", () => {
    const weighted = (_eventId: string, level: string) => (level === "participacao" ? 1 : 0);
    const totals = aggregateMedalPoints(
      [{ studentId: "c", level: "participacao", eventId: "e4", eventYear: 2026 }],
      weighted,
      { year: 2026 },
    );
    expect(totals.get("c")).toBe(1);
  });
});
