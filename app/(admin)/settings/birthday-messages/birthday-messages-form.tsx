"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { renderBirthdayMessageTemplate } from "@/modules/birthday-messages/template";
import type { BirthdayMessageSettings } from "@/modules/birthday-messages/settings";
import { updateBirthdayMessageSettings } from "./actions";

const VARIABLES = ["{Nome}", "{Faixa}", "{Academia}", "{Professor}"] as const;

const PREVIEW_VARIABLES = {
  nome: "Maria Silva",
  faixa: "Faixa Azul",
  academia: "Gracie Barra Guará",
  professor: "Professor Rafael Mendes",
};

export function BirthdayMessagesForm({ settings }: { settings: BirthdayMessageSettings }) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [notifyStudents, setNotifyStudents] = useState(settings.notifyStudents);
  const [notifyTeachers, setNotifyTeachers] = useState(settings.notifyTeachers);
  const [enabled, setEnabled] = useState(settings.enabled);
  const [messageTemplate, setMessageTemplate] = useState(settings.messageTemplate);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const preview = useMemo(
    () => renderBirthdayMessageTemplate(messageTemplate, PREVIEW_VARIABLES),
    [messageTemplate],
  );

  function insertVariable(variable: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      setMessageTemplate((prev) => prev + variable);
      return;
    }

    const start = textarea.selectionStart ?? messageTemplate.length;
    const end = textarea.selectionEnd ?? messageTemplate.length;
    const next = messageTemplate.slice(0, start) + variable + messageTemplate.slice(end);
    setMessageTemplate(next);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + variable.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await updateBirthdayMessageSettings({
      notifyStudents,
      notifyTeachers,
      enabled,
      messageTemplate,
    });
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Configuração salva.");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-lg space-y-5 rounded-lg border border-border bg-card p-6"
    >
      <div className="space-y-2.5">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={notifyStudents}
            onChange={(event) => setNotifyStudents(event.target.checked)}
          />
          Enviar aniversário para alunos
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={notifyTeachers}
            onChange={(event) => setNotifyTeachers(event.target.checked)}
          />
          Enviar aniversário para professores
        </label>
        <label className="flex items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />
          Habilitar envio automático
        </label>
        {!enabled && (
          <p className="text-xs text-muted-foreground">
            Enquanto desligado, nenhuma mensagem é enviada mesmo com os
            destinatários marcados acima.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="messageTemplate">Mensagem padrão</Label>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {VARIABLES.map((variable) => (
            <button
              key={variable}
              type="button"
              onClick={() => insertVariable(variable)}
              className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground hover:bg-secondary/80"
            >
              {variable}
            </button>
          ))}
        </div>
        <textarea
          id="messageTemplate"
          ref={textareaRef}
          rows={8}
          value={messageTemplate}
          onChange={(event) => setMessageTemplate(event.target.value)}
          className="w-full rounded-lg border border-border bg-background p-2.5 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Pré-visualização</Label>
        <div className="whitespace-pre-line rounded-lg border border-border bg-muted p-3 text-sm text-foreground">
          {preview}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
