import { z } from "zod";

export const birthdayMessageSettingsSchema = z.object({
  notifyStudents: z.boolean(),
  notifyTeachers: z.boolean(),
  enabled: z.boolean(),
  messageTemplate: z.string().trim().min(1, "Mensagem obrigatória"),
});

export type BirthdayMessageSettingsInput = z.infer<typeof birthdayMessageSettingsSchema>;
