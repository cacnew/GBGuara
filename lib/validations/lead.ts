import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto"),
  phone: z.string().trim().optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("E-mail inválido")
    .optional()
    .or(z.literal("")),
  source: z.string().trim().optional().or(z.literal("")),
  status: z.enum(["novo", "contatado", "agendado", "matriculado", "perdido"]),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type LeadInput = z.infer<typeof leadSchema>;
