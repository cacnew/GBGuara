import { z } from "zod";

export const installmentDueDateSchema = z.object({
  dueDate: z.string().min(1, "Informe a nova data de vencimento"),
});

export type InstallmentDueDateInput = z.infer<typeof installmentDueDateSchema>;
