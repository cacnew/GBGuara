/**
 * Substituição de variáveis do aviso de feriado (Fase 16.4). Função pura,
 * sem I/O — mesmo espírito de `renderBirthdayMessageTemplate` (Fase 15).
 * Sem tela de configuração nova: o texto vem de `holidays.custom_message`
 * (Fase 16.1/16.2) quando cadastrado, ou de `DEFAULT_HOLIDAY_NOTIFICATION_TEMPLATE`
 * quando o feriado não tem mensagem própria.
 */
export type HolidayNotificationVariables = {
  nome: string;
  data: string;
  nomeFeriado: string;
  academia: string;
};

export const DEFAULT_HOLIDAY_NOTIFICATION_TEMPLATE =
  "Olá {Nome}, lembramos que {Data} é feriado ({NomeFeriado}) e não haverá aula na {Academia}.";

export function renderHolidayNotificationTemplate(
  template: string,
  variables: HolidayNotificationVariables,
): string {
  return template
    .replaceAll("{Nome}", variables.nome)
    .replaceAll("{Data}", variables.data)
    .replaceAll("{NomeFeriado}", variables.nomeFeriado)
    .replaceAll("{Academia}", variables.academia);
}
