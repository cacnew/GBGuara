import { z } from "zod";

export const priceTableSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto"),
  description: z.string().trim().optional().or(z.literal("")),
  validFrom: z.string().min(1, "Informe o início da vigência"),
  validUntil: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "legacy"]),
});

export type PriceTableInput = z.infer<typeof priceTableSchema>;
