import { describe, expect, it } from "vitest";
import { renderBirthdayMessageTemplate } from "./template";

describe("renderBirthdayMessageTemplate", () => {
  const variables = {
    nome: "Maria Silva",
    faixa: "Azul grau 2",
    academia: "Gracie Barra Dev",
    professor: "Rafael Mendes",
  };

  it("substitui todas as variáveis pelo valor correspondente", () => {
    const result = renderBirthdayMessageTemplate(
      "Oi {Nome}! Sua faixa é {Faixa}, aqui na {Academia} com o professor {Professor}.",
      variables,
    );
    expect(result).toBe(
      "Oi Maria Silva! Sua faixa é Azul grau 2, aqui na Gracie Barra Dev com o professor Rafael Mendes.",
    );
  });

  it("substitui múltiplas ocorrências da mesma variável", () => {
    const result = renderBirthdayMessageTemplate("{Nome}, parabéns {Nome}!", variables);
    expect(result).toBe("Maria Silva, parabéns Maria Silva!");
  });

  it("deixa o texto sem variáveis intacto", () => {
    const result = renderBirthdayMessageTemplate("Feliz aniversário!", variables);
    expect(result).toBe("Feliz aniversário!");
  });

  it("substitui variável por string vazia quando o valor é vazio (ex: {Professor} para professor)", () => {
    const result = renderBirthdayMessageTemplate("Prof: {Professor}.", { ...variables, professor: "" });
    expect(result).toBe("Prof: .");
  });

  it("não altera texto que contém chaves que não são variáveis conhecidas", () => {
    const result = renderBirthdayMessageTemplate("Olá {Nome}, veja {isso}!", variables);
    expect(result).toBe("Olá Maria Silva, veja {isso}!");
  });
});
