"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateOnly } from "@/lib/dates/format";
import { MEDAL_LEVEL_LABELS } from "@/modules/medals/points";
import { launchMedalForStudent } from "@/modules/medals/staff-launch";
import type { MedalEventOption } from "@/modules/medals/events";

export function LaunchMedalForStudentButton({
  studentId,
  events,
  modalities,
}: {
  studentId: string;
  events: MedalEventOption[];
  modalities: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [eventId, setEventId] = useState("");
  const [modalityId, setModalityId] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("ouro");
  const [proofUrl, setProofUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function reset() {
    setEventId("");
    setModalityId("");
    setCategory("");
    setLevel("ouro");
    setProofUrl("");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await launchMedalForStudent(studentId, {
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

    toast.success("Medalha lançada e aprovada.");
    reset();
    setOpen(false);
  }

  if (!open) {
    return (
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        Lançar medalha
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
          <h2 className="font-heading text-lg font-semibold">Lançar medalha</h2>
          <p className="text-xs text-muted-foreground">
            Lançamento feito pela equipe já nasce aprovado.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="staff-event">Evento</Label>
          <select
            id="staff-event"
            value={eventId}
            onChange={(event) => setEventId(event.target.value)}
            className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
          >
            <option value="">Selecione um evento</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name} — {formatDateOnly(event.eventDate)}
              </option>
            ))}
          </select>
          {!events.length && (
            <p className="text-xs text-muted-foreground">
              Nenhum evento cadastrado — crie um em Medalhas → Eventos antes.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="staff-modality">Modalidade (opcional)</Label>
          <select
            id="staff-modality"
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
          <Label htmlFor="staff-category">Categoria/peso (opcional)</Label>
          <Input
            id="staff-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="staff-level">Resultado</Label>
          <select
            id="staff-level"
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
          <Label htmlFor="staff-proof">Link do comprovante/foto (opcional)</Label>
          <Input
            id="staff-proof"
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
          <Button type="submit" disabled={isSubmitting || !eventId}>
            {isSubmitting ? "Lançando..." : "Lançar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
