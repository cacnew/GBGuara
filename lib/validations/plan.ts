import { z } from "zod";

export const PLAN_DURATIONS = [
  "monthly",
  "quarterly",
  "semiannual",
  "annual",
  "drop_in",
  "package",
  "trial",
] as const;

export const planSchema = z.object({
  priceTableId: z.string().uuid("Selecione uma tabela de preço"),
  name: z.string().trim().min(2, "Nome muito curto"),
  planDuration: z.enum(PLAN_DURATIONS),
  durationMonths: z.number().int().min(1, "Deve ser 1 ou maior"),
  basePrice: z.number().min(0, "Não pode ser negativo"),
  setupFee: z.number().min(0, "Não pode ser negativo"),
  loyaltyMonths: z.number().int().min(0, "Não pode ser negativo"),
  description: z.string().trim().optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "legacy"]),
});

export type PlanInput = z.infer<typeof planSchema>;
