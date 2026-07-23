import { describe, expect, it } from "vitest";
import { isBirthdayToday } from "./recipients";

describe("isBirthdayToday", () => {
  it("é aniversário quando mês/dia coincidem, mesmo com anos diferentes", () => {
    expect(isBirthdayToday("1998-07-23", "2026-07-23")).toBe(true);
  });

  it("não é aniversário quando o dia é diferente", () => {
    expect(isBirthdayToday("1998-07-22", "2026-07-23")).toBe(false);
  });

  it("não é aniversário quando o mês é diferente", () => {
    expect(isBirthdayToday("1998-08-23", "2026-07-23")).toBe(false);
  });

  it("retorna false quando não há data de nascimento cadastrada", () => {
    expect(isBirthdayToday(null, "2026-07-23")).toBe(false);
  });

  it("compara corretamente aniversário em 29 de fevereiro", () => {
    expect(isBirthdayToday("2000-02-29", "2028-02-29")).toBe(true);
    expect(isBirthdayToday("2000-02-29", "2027-02-28")).toBe(false);
  });

  it("não usa new Date() (imune a fuso) — string com T/hora embutida ainda compara só a substring", () => {
    expect(isBirthdayToday("1990-12-31", "2026-12-31")).toBe(true);
  });
});
