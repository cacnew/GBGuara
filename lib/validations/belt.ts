import { z } from "zod";

export const beltSystemSchema = z.object({
  modalityId: z.string().uuid("Selecione uma modalidade"),
  name: z.string().trim().min(2, "Nome muito curto"),
  audience: z.enum(["adulto", "kids", "juvenil"]),
  description: z.string().trim().optional().or(z.literal("")),
});

export type BeltSystemInput = z.infer<typeof beltSystemSchema>;

export const beltSchema = z.object({
  name: z.string().trim().min(1, "Nome muito curto"),
  colorHex: z.string().trim().optional().or(z.literal("")),
  ordering: z.number().int().min(1, "Deve ser 1 ou maior"),
  maxDegrees: z.number().int().min(0, "Não pode ser negativo"),
});

export type BeltInput = z.infer<typeof beltSchema>;
