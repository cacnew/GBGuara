"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { feedbackSchema, type FeedbackFormInput } from "@/lib/validations/feedback";
import { FEEDBACK_TARGET_LABELS, FEEDBACK_TYPE_LABELS } from "@/modules/feedback/labels";
import type { FeedbackActionResult } from "@/modules/feedback/student-actions";
import { AttachmentUpload } from "./attachment-upload";

export function FeedbackForm({
  schoolId,
  studentId,
  onCreate,
}: {
  schoolId: string;
  studentId: string;
  onCreate: (input: FeedbackFormInput) => Promise<FeedbackActionResult>;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FeedbackFormInput>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { type: "sugestao", target: "administrador" },
  });

  async function onSubmit(data: FeedbackFormInput) {
    setIsSubmitting(true);
    const result = await onCreate({ ...data, attachmentUrl });
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Mensagem enviada.");
    router.push(`/aluno/fale-conosco/${result.id}`);
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6"
    >
      <div className="space-y-1.5">
        <Label htmlFor="type">Tipo</Label>
        <select
          id="type"
          {...register("type")}
          className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
        >
          {Object.entries(FEEDBACK_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title">Título</Label>
        <Input id="title" {...register("title")} />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">Mensagem</Label>
        <textarea
          id="message"
          rows={4}
          {...register("message")}
          className="w-full rounded-lg border border-border bg-background p-2.5 text-sm"
        />
        {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="target">Destinatário</Label>
        <select
          id="target"
          {...register("target")}
          className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
        >
          {Object.entries(FEEDBACK_TARGET_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          O administrador sempre recebe, independente da escolha.
        </p>
      </div>

      <AttachmentUpload schoolId={schoolId} studentId={studentId} onUploaded={setAttachmentUrl} />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Enviando..." : "Enviar"}
      </Button>
    </form>
  );
}
