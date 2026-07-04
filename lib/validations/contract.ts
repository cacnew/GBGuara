import { z } from "zod";

export const CONTRACT_DISCOUNT_TYPES = ["none", "fixed", "percentage"] as const;
export const CONTRACT_RESPONSIBLE_TYPES = ["student", "guardian", "other"] as const;

export const contractSchema = z
  .object({
    priceTableId: z.string().uuid("Selecione uma tabela de preço"),
    planId: z.string().uuid("Selecione um plano"),
    startDate: z.string().min(1, "Informe a data de início"),
    endDate: z.string().optional().or(z.literal("")),
    firstDueDate: z.string().min(1, "Informe o primeiro vencimento"),
    discountType: z.enum(CONTRACT_DISCOUNT_TYPES),
    discountValue: z.number().min(0, "Não pode ser negativo"),
    installmentsCount: z
      .number()
      .int()
      .min(1, "Mínimo de 1 parcela")
      .max(12, "Máximo de 12 parcelas"),
    setupFeeAmount: z.number().min(0, "Não pode ser negativo"),
    financialResponsibleType: z.enum(CONTRACT_RESPONSIBLE_TYPES),
    financialResponsibleGuardianId: z.string().optional().or(z.literal("")),
    financialResponsibleOtherName: z.string().trim().optional().or(z.literal("")),
    endPreviousContractId: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (
      data.financialResponsibleType === "guardian" &&
      !data.financialResponsibleGuardianId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione o responsável financeiro",
        path: ["financialResponsibleGuardianId"],
      });
    }

    if (
      data.financialResponsibleType === "other" &&
      !data.financialResponsibleOtherName?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe o nome do responsável financeiro",
        path: ["financialResponsibleOtherName"],
      });
    }
  });

export type ContractInput = z.infer<typeof contractSchema>;
