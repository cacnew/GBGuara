import { describe, expect, it } from "vitest";
import {
  checkSignalWindow,
  hasAvailableCapacity,
  hasTimeOverlap,
  weekdayOf,
} from "./signal-rules";

describe("weekdayOf", () => {
  it("calcula o dia da semana em UTC, batendo com a convenção de week_days", () => {
    // 2026-07-06 é uma segunda-feira.
    expect(weekdayOf("2026-07-06")).toBe(1);
    // 2026-07-12 é um domingo.
    expect(weekdayOf("2026-07-12")).toBe(0);
    // 2026-07-11 é um sábado.
    expect(weekdayOf("2026-07-11")).toBe(6);
  });
});

describe("checkSignalWindow", () => {
  const MAX_DAYS = 7;
  const TOLERANCE_HOURS = 24;

  it("permite sinalizar uma aula hoje, no horário exato", () => {
    const now = new Date("2026-07-12T10:00:00Z");
    const result = checkSignalWindow("2026-07-12", "10:00:00", now, MAX_DAYS, TOLERANCE_HOURS);
    expect(result.allowed).toBe(true);
  });

  it("permite sinalizar no limite exato de antecedência (7 dias)", () => {
    const now = new Date("2026-07-12T10:00:00Z");
    const result = checkSignalWindow("2026-07-19", "10:00:00", now, MAX_DAYS, TOLERANCE_HOURS);
    expect(result.allowed).toBe(true);
  });

  it("bloqueia sinalizar além do limite de antecedência", () => {
    const now = new Date("2026-07-12T10:00:00Z");
    const result = checkSignalWindow("2026-07-20", "10:00:00", now, MAX_DAYS, TOLERANCE_HOURS);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("7 dias");
  });

  it("permite sinalizar dentro da tolerância pós-início (até 24h depois)", () => {
    const now = new Date("2026-07-12T09:00:00Z"); // 23h depois do início das 10:00 do dia 11
    const result = checkSignalWindow("2026-07-11", "10:00:00", now, MAX_DAYS, TOLERANCE_HOURS);
    expect(result.allowed).toBe(true);
  });

  it("bloqueia sinalizar depois de esgotada a tolerância pós-início", () => {
    const now = new Date("2026-07-13T11:00:00Z"); // 25h depois do início das 10:00 do dia 12
    const result = checkSignalWindow("2026-07-12", "10:00:00", now, MAX_DAYS, TOLERANCE_HOURS);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("já passou");
  });
});

describe("hasTimeOverlap", () => {
  it("detecta sobreposição quando os horários se cruzam", () => {
    expect(hasTimeOverlap("07:00:00", "08:00:00", "07:30:00", "08:30:00")).toBe(true);
  });

  it("detecta sobreposição quando uma turma contém a outra por completo", () => {
    expect(hasTimeOverlap("07:00:00", "09:00:00", "07:30:00", "08:00:00")).toBe(true);
  });

  it("não detecta sobreposição quando as turmas são sequenciais (fim = início)", () => {
    expect(hasTimeOverlap("07:00:00", "08:00:00", "08:00:00", "09:00:00")).toBe(false);
  });

  it("não detecta sobreposição quando os horários são totalmente distintos", () => {
    expect(hasTimeOverlap("07:00:00", "08:00:00", "19:00:00", "20:00:00")).toBe(false);
  });
});

describe("hasAvailableCapacity", () => {
  it("sempre tem vaga quando a turma não define capacidade (turma flexível)", () => {
    expect(hasAvailableCapacity(999, null)).toBe(true);
  });

  it("tem vaga quando a ocupação está abaixo da capacidade", () => {
    expect(hasAvailableCapacity(2, 5)).toBe(true);
  });

  it("não tem vaga quando a ocupação já atingiu a capacidade", () => {
    expect(hasAvailableCapacity(5, 5)).toBe(false);
  });

  it("não tem vaga quando a ocupação excede a capacidade", () => {
    expect(hasAvailableCapacity(6, 5)).toBe(false);
  });
});
