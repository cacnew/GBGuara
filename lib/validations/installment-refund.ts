import { z } from "zod";

export const installmentRefundSchema = z.object({
  financialAccountId: z.string().uuid("Selecione uma conta financeira"),
  refundDate: z.string().min(1, "Informe a data do estorno"),
  refundAmount: z.number().positive("O valor do estorno deve ser maior que zero"),
  reason: z.string().trim().optional().or(z.literal("")),
});

export type InstallmentRefundInput = z.infer<typeof installmentRefundSchema>;
