"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FEEDBACK_STATUS_LABELS } from "@/modules/feedback/labels";
import type { FeedbackActionResult } from "@/modules/feedback/student-actions";

type FeedbackStatus = "recebida" | "em_analise" | "respondida" | "encerrada";

/**
 * Mudança manual de status (17.3) — separada do envio de resposta
 * (`replyToFeedbackAsStaff` já move para `respondida` sozinho ao
 * responder). Cobre o "decidir" do critério de pronto: ex. marcar
 * `em_analise` sem ainda ter uma resposta, ou `encerrada` ao final.
 */
export function FeedbackStatusControl({
  feedbackId,
  status,
  onUpdate,
}: {
  feedbackId: string;
  status: string;
  onUpdate: (feedbackId: string, status: FeedbackStatus) => Promise<FeedbackActionResult>;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    const result = await onUpdate(feedbackId, value as FeedbackStatus);
    setIsSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Status atualizado.");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm"
      >
        {Object.entries(FEEDBACK_STATUS_LABELS).map(([optionValue, label]) => (
          <option key={optionValue} value={optionValue}>
            {label}
          </option>
        ))}
      </select>
      <Button size="sm" variant="outline" disabled={isSaving || value === status} onClick={handleSave}>
        {isSaving ? "Salvando..." : "Salvar status"}
      </Button>
    </div>
  );
}
