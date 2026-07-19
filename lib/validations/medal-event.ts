import { z } from "zod";

export const medalEventSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto"),
  organization: z.string().trim().optional().or(z.literal("")),
  eventDate: z.string().min(1, "Data obrigatória"),
  modalityId: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]),
  pointsOuro: z.string().optional().or(z.literal("")),
  pointsPrata: z.string().optional().or(z.literal("")),
  pointsBronze: z.string().optional().or(z.literal("")),
  pointsParticipacao: z.string().optional().or(z.literal("")),
});

export type MedalEventFormInput = z.infer<typeof medalEventSchema>;
