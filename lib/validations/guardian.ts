import { z } from "zod";

export const guardianSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto"),
  phone: z.string().trim().optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("E-mail inválido")
    .optional()
    .or(z.literal("")),
  document: z.string().trim().optional().or(z.literal("")),
  relationship: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
  isPrimary: z.boolean(),
  isFinancialResponsible: z.boolean(),
});

export type GuardianInput = z.infer<typeof guardianSchema>;
