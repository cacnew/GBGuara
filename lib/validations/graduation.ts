import { z } from "zod";

export const graduationSchema = z.object({
  newBeltId: z.string().uuid("Selecione a nova faixa"),
  newDegree: z.number().int().min(0, "Não pode ser negativo"),
  graduationDate: z.string().min(1, "Informe a data da graduação"),
  teacherId: z.string().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type GraduationInput = z.infer<typeof graduationSchema>;
