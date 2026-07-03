import { z } from "zod";

export const modalitySchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug muito curto")
    .regex(/^[a-z0-9_]+$/, "Use apenas letras minúsculas, números e _"),
  icon: z.string().trim().optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]),
});

export type ModalityInput = z.infer<typeof modalitySchema>;
