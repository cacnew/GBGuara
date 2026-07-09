import { z } from "zod";

export const graduationSchema = z.object({
  newBeltId: z.string().uuid("Selecione a nova faixa"),
  newDegree: z
    .number()
    .int()
    .min(0, "Nao pode ser negativo")
    .max(10, "Informe um grau entre 0 e 10"),
  graduationDate: z.string().min(1, "Informe a data da graduacao"),
  teacherId: z.string().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type GraduationInput = z.infer<typeof graduationSchema>;
