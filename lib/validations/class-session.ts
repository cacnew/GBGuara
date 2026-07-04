import { z } from "zod";

export const extraClassSessionSchema = z.object({
  classGroupId: z.string().uuid("Selecione uma turma"),
  date: z.string().min(1, "Informe a data"),
});

export type ExtraClassSessionInput = z.infer<typeof extraClassSessionSchema>;
