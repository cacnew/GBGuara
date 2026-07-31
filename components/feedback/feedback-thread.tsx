"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FeedbackActionResult, FeedbackThreadMessage } from "@/modules/feedback/student-actions";

/**
 * Conversa em formato de chat (Fase 17.2) — mensagens do aluno alinhadas
 * diferente das de staff (`isStaff`, calculado em
 * `getMyFeedbackThread`/`author_user_id` vs `author_student_id`).
 */
export function FeedbackThread({
  feedbackId,
  messages,
  onReply,
}: {
  feedbackId: string;
  messages: FeedbackThreadMessage[];
  onReply: (feedbackId: string, body: string, attachmentUrl?: string) => Promise<FeedbackActionResult>;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleReply() {
    setIsSubmitting(true);
    const result = await onReply(feedbackId, body);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setBody("");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm space-y-3">
      <div className="space-y-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "rounded-lg border p-3 text-sm",
              message.isStaff ? "border-border bg-card" : "border-primary/20 bg-primary/5",
            )}
          >
            <p className="whitespace-pre-wrap">{message.body}</p>
            {message.attachmentUrl && (
              <a
                href={message.attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block text-primary hover:underline"
              >
                Ver anexo
              </a>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {message.authorName} · {new Date(message.createdAt).toLocaleString("pt-BR")}
            </p>
          </div>
        ))}
        {!messages.length && (
          <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
            Nenhuma mensagem ainda.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Escreva uma mensagem..."
          className="w-full rounded-lg border border-border bg-background p-2.5 text-sm"
        />
        <Button size="sm" disabled={isSubmitting || !body.trim()} onClick={handleReply}>
          {isSubmitting ? "Enviando..." : "Responder"}
        </Button>
      </div>
    </div>
  );
}
