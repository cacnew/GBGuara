"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateOnly } from "@/lib/dates/format";
import { MEDAL_LEVEL_LABELS } from "@/modules/medals/points";
import { updateApprovedMedal } from "@/modules/medals/staff-launch";
import type { MedalEventOption } from "@/modules/medals/events";

export function EditApprovedMedalButton({
  medalId,
  events,
  modalities,
  defaultValues,
}: {
  medalId: string;
  events: MedalEventOption[];
  modalities: { id: string; name: string }[];
  defaultValues: {
    eventId: string;
    modalityId: string;
    category: string;
    level: string;
    proofUrl: string;
  };
}) {
  const [open, setOpen] = useState(false);
  const [eventId, setEventId] = useState(defaultValues.eventId);
  const [modalityId, setModalityId] = useState(defaultValues.modalityId);
  const [category, setCategory] = useState(defaultValues.category);
  const [level, setLevel] = useState(defaultValues.level);
  const [proofUrl, setProofUrl] = useState(defaultValues.proofUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Defesa contra evento inativo (Fase 12.12): a lista de opções só traz
  // eventos ativos, mas o valor atual da medalha pode referenciar um
  // evento já inativado — sem isso, o <select> cairia na primeira opção
  // silenciosamente e o save trocaria o evento sem o staff perceber.
  const eventOptions = events.some((event) => event.id === eventId)
    ? events
    : [{ id: eventId, name: "(evento atual, inativo)", eventDate: "", organization: null }, ...events];

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await updateApprovedMedal(medalId, {
      eventId,
      modalityId,
      category,
      level,
      proofUrl,
    });
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Medalha atualizada.");
    setOpen(false);
  }

  if (!open) {
    return (
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        Editar
      </Button>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => setOpen(false)}
    >
      <form
        onSubmit={onSubmit}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-5 text-foreground shadow-lg"
      >
        <div>
          <h2 className="font-heading text-lg font-semibold">Editar medalha aprovada</h2>
          <p className="text-xs text-muted-foreground">
            Corrige o lançamento sem alterar quem aprovou nem a data de aprovação.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-event">Evento</Label>
          <select
            id="edit-event"
            value={eventId}
            onChange={(event) => setEventId(event.target.value)}
            className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
          >
            {eventOptions.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
                {event.eventDate ? ` — ${formatDateOnly(event.eventDate)}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-modality">Modalidade (opcional)</Label>
          <select
            id="edit-modality"
            value={modalityId}
            onChange={(event) => setModalityId(event.target.value)}
            className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
          >
            <option value="">Não informar</option>
            {modalities.map((modality) => (
              <option key={modality.id} value={modality.id}>
                {modality.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-category">Categoria/peso (opcional)</Label>
          <Input
            id="edit-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-level">Resultado</Label>
          <select
            id="edit-level"
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
          >
            {Object.entries(MEDAL_LEVEL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-proof">Link do comprovante/foto (opcional)</Label>
          <Input
            id="edit-proof"
            placeholder="https://..."
            value={proofUrl}
            onChange={(event) => setProofUrl(event.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
