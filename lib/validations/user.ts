import { z } from "zod";

export const USER_ROLES = ["admin", "teacher"] as const;
export const USER_STATUSES = ["active", "inactive"] as const;

export const createUserSchema = z
  .object({
    name: z.string().trim().min(2, "Nome muito curto"),
    email: z.string().trim().email("E-mail invalido"),
    password: z.string().min(8, "Minimo de 8 caracteres"),
    confirmPassword: z.string(),
    role: z.enum(USER_ROLES),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas nao conferem",
    path: ["confirmPassword"],
  });

export const updateUserAccessSchema = z.object({
  role: z.enum(USER_ROLES),
  status: z.enum(USER_STATUSES),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserAccessInput = z.infer<typeof updateUserAccessSchema>;
