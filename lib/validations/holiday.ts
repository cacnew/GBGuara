import { z } from "zod";

export const holidaySchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto"),
  date: z.string().min(1, "Data obrigatória"),
  recurring: z.boolean(),
  hasClass: z.boolean(),
  customMessage: z.string().trim().optional().or(z.literal("")),
});

export type HolidayFormInput = z.infer<typeof holidaySchema>;
