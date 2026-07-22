import { z } from "zod";

export const weeklyPositionSchema = z
  .object({
    title: z.string().trim().min(2, "Título muito curto"),
    description: z.string().trim().min(1, "Descrição obrigatória"),
    imageUrl: z.string().trim().min(1, "Envie uma imagem"),
    youtubeUrl: z.string().trim().optional().or(z.literal("")),
    startDate: z.string().min(1, "Data inicial obrigatória"),
    endDate: z.string().optional().or(z.literal("")),
    published: z.boolean(),
  })
  .refine(
    (data) => !data.endDate || data.endDate >= data.startDate,
    { message: "Data final não pode ser antes da data inicial", path: ["endDate"] },
  );

export type WeeklyPositionFormInput = z.infer<typeof weeklyPositionSchema>;
