import { z } from "zod";

export const createStudentLoginSchema = z
  .object({
    email: z.string().trim().email("E-mail inválido"),
    password: z.string().min(8, "Mínimo de 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

export type CreateStudentLoginInput = z.infer<typeof createStudentLoginSchema>;
