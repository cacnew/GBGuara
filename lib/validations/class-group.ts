import { z } from "zod";

export const WEEK_DAYS = [
  { value: "0", label: "Domingo" },
  { value: "1", label: "Segunda" },
  { value: "2", label: "Terça" },
  { value: "3", label: "Quarta" },
  { value: "4", label: "Quinta" },
  { value: "5", label: "Sexta" },
  { value: "6", label: "Sábado" },
] as const;

export const SUGGESTED_AUDIENCES = [
  "kids",
  "juvenil",
  "adulto",
  "feminino",
  "iniciante",
  "avancado",
  "competicao",
  "livre",
] as const;

export const classGroupSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto"),
  modalityId: z.string().uuid("Selecione uma modalidade"),
  mainTeacherId: z.string().optional().or(z.literal("")),
  weekDays: z.array(z.string()).min(1, "Selecione ao menos um dia"),
  startTime: z.string().min(1, "Informe o horário de início"),
  endTime: z.string().min(1, "Informe o horário de término"),
  suggestedAudience: z.string().optional().or(z.literal("")),
  suggestedStudentLimit: z.number().int().min(0),
  notes: z.string().trim().optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]),
});

export type ClassGroupInput = z.infer<typeof classGroupSchema>;
