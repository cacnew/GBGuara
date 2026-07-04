import { z } from "zod";

export const installmentPaymentSchema = z.object({
  financialAccountId: z.string().uuid("Selecione uma conta financeira"),
  paymentDate: z.string().min(1, "Informe a data de pagamento"),
  paymentMethod: z.enum([
    "pix",
    "cash",
    "credit_card",
    "debit_card",
    "bank_transfer",
    "other",
  ]),
  amountPaid: z.number().positive("O valor pago deve ser maior que zero"),
});

export type InstallmentPaymentInput = z.infer<typeof installmentPaymentSchema>;
