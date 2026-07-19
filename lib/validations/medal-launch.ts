import { z } from "zod";

export const medalLaunchSchema = z.object({
  eventId: z.string().min(1, "Selecione um evento"),
  modalityId: z.string().optional().or(z.literal("")),
  category: z.string().trim().optional().or(z.literal("")),
  level: z.enum(["ouro", "prata", "bronze", "participacao"]),
  proofUrl: z.string().trim().optional().or(z.literal("")),
});

export type MedalLaunchFormInput = z.infer<typeof medalLaunchSchema>;
