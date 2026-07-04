import { z } from "zod";

export const teacherGraduationSchema = z.object({
  modalityId: z.string().uuid("Selecione uma modalidade"),
  beltId: z.string().uuid("Selecione uma faixa"),
  degree: z.number().int().min(0, "Não pode ser negativo"),
  sinceDate: z.string().min(1, "Informe a data"),
});

export type TeacherGraduationInput = z.infer<typeof teacherGraduationSchema>;
