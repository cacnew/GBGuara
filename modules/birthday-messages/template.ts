/**
 * Substituição de variáveis do template de mensagem de aniversário (Fase
 * 15). Função pura, sem I/O — reaproveitada tanto no preview da tela de
 * configuração (15.2, client-side) quanto no job diário de disparo (15.3,
 * server-side).
 */
export type BirthdayMessageVariables = {
  nome: string;
  faixa: string;
  academia: string;
  professor: string;
};

export function renderBirthdayMessageTemplate(
  template: string,
  variables: BirthdayMessageVariables,
): string {
  return template
    .replaceAll("{Nome}", variables.nome)
    .replaceAll("{Faixa}", variables.faixa)
    .replaceAll("{Academia}", variables.academia)
    .replaceAll("{Professor}", variables.professor);
}
