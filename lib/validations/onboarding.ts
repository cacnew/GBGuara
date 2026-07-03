import { z } from "zod";

export const onboardingSchema = z
  .object({
    schoolName: z.string().trim().min(2, "Nome da escola muito curto"),
    adminName: z.string().trim().min(2, "Nome muito curto"),
    adminEmail: z.string().trim().email("E-mail inválido"),
    adminPassword: z.string().min(8, "Mínimo de 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.adminPassword === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

export type OnboardingInput = z.infer<typeof onboardingSchema>;
