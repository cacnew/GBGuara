import { z } from "zod";

export const feedbackSchema = z.object({
  type: z.enum(["sugestao", "elogio", "reclamacao", "duvida"]),
  title: z.string().trim().min(2, "Título muito curto"),
  message: z.string().trim().min(1, "Mensagem obrigatória"),
  target: z.enum(["professor", "administrador", "ambos"]),
  attachmentUrl: z.string().trim().optional().or(z.literal("")),
});

export type FeedbackFormInput = z.infer<typeof feedbackSchema>;
