import { z } from "zod";

export const teacherSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto"),
  phone: z.string().trim().optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("E-mail inválido")
    .optional()
    .or(z.literal("")),
  photoUrl: z
    .string()
    .trim()
    .url("URL inválida")
    .optional()
    .or(z.literal("")),
  status: z.enum(["active", "inactive"]),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type TeacherInput = z.infer<typeof teacherSchema>;
