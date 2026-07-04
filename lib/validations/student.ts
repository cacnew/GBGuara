import { z } from "zod";

export const studentSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto"),
  birthDate: z.string().min(1, "Informe a data de nascimento"),
  cpf: z.string().trim().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("E-mail inválido")
    .optional()
    .or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  emergencyContact: z.string().trim().optional().or(z.literal("")),
  status: z.enum(["ativo", "inativo", "pausado", "cancelado", "inadimplente"]),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type StudentInput = z.infer<typeof studentSchema>;
