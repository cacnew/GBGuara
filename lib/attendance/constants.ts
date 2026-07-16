export const PRESENT_STATUSES = ["presente", "confirmed", "added_by_instructor"] as const;

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  presente: "Presente",
  confirmed: "Presente (confirmado)",
  added_by_instructor: "Presente (incluído pelo professor)",
  signaled: "Sinalizado (aguardando confirmação)",
  no_show: "Faltou",
  cancelled: "Cancelado",
  falta: "Falta",
  falta_justificada: "Falta justificada",
};
