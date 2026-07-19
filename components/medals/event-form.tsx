"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { medalEventSchema, type MedalEventFormInput } from "@/lib/validations/medal-event";
import { createMedalEvent, updateMedalEvent, deleteMedalEvent } from "@/modules/medals/events";
import { MEDAL_LEVEL_LABELS } from "@/modules/medals/points-rules";

export function MedalEventForm({
  id,
  basePath,
  modalities,
  defaultValues,
  hasMedals,
}: {
  id?: string;
  basePath: string;
  modalities: { id: string; name: string }[];
  defaultValues?: MedalEventFormInput;
  hasMedals?: boolean;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MedalEventFormInput>({
    resolver: zodResolver(medalEventSchema),
    defaultValues: defaultValues ?? { modalityId: "", status: "active" },
  });

  async function onSubmit(data: MedalEventFormInput) {
    setIsSubmitting(true);
    const input = {
      name: data.name,
      organization: data.organization ?? "",
      eventDate: data.eventDate,
      modalityId: data.modalityId ?? "",
      status: data.status,
      points: {
        ouro: data.pointsOuro ?? "",
        prata: data.pointsPrata ?? "",
        bronze: data.pointsBronze ?? "",
        participacao: data.pointsParticipacao ?? "",
      },
    };
    const result = id ? await updateMedalEvent(id, input) : await createMedalEvent(input);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(id ? "Evento atualizado." : "Evento criado.");
    router.push(basePath);
  }

  async function onDelete() {
    if (!id) return;
    setIsDeleting(true);
    const result = await deleteMedalEvent(id);
    setIsDeleting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Evento removido.");
    router.push(basePath);
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6"
    >
      <div className="space-y-1.5">
        <Label htmlFor="name">Nome do evento</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="organization">Organização (opcional)</Label>
        <Input id="organization" {...register("organization")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="eventDate">Data do evento</Label>
        <Input id="eventDate" type="date" {...register("eventDate")} />
        {errors.eventDate && (
          <p className="text-sm text-destructive">{errors.eventDate.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="modalityId">Modalidade sugerida (opcional)</Label>
        <select
          id="modalityId"
          {...register("modalityId")}
          className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
        >
          <option value="">Sem modalidade específica</option>
          {modalities.map((modality) => (
            <option key={modality.id} value={modality.id}>
              {modality.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          {...register("status")}
          className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
        >
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
        </select>
        <p className="text-xs text-muted-foreground">
          Evento inativo sai das listas de lançamento, mas continua aparecendo no ranking e no
          histórico dos alunos.
        </p>
      </div>

      <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
        <p className="text-sm font-medium">Pontuação específica deste evento (opcional)</p>
        <p className="text-xs text-muted-foreground">
          Deixe em branco para usar a pontuação default da escola.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="pointsOuro" className="text-xs">
              {MEDAL_LEVEL_LABELS.ouro}
            </Label>
            <Input id="pointsOuro" type="number" min={0} step={1} {...register("pointsOuro")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pointsPrata" className="text-xs">
              {MEDAL_LEVEL_LABELS.prata}
            </Label>
            <Input id="pointsPrata" type="number" min={0} step={1} {...register("pointsPrata")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pointsBronze" className="text-xs">
              {MEDAL_LEVEL_LABELS.bronze}
            </Label>
            <Input
              id="pointsBronze"
              type="number"
              min={0}
              step={1}
              {...register("pointsBronze")}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pointsParticipacao" className="text-xs">
              {MEDAL_LEVEL_LABELS.participacao}
            </Label>
            <Input
              id="pointsParticipacao"
              type="number"
              min={0}
              step={1}
              {...register("pointsParticipacao")}
            />
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : id ? "Salvar" : "Criar evento"}
      </Button>

      {id && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={isDeleting || hasMedals}
          onClick={onDelete}
          title={hasMedals ? "Evento com medalhas lançadas não pode ser removido" : undefined}
        >
          {isDeleting ? "Removendo..." : hasMedals ? "Não é possível remover" : "Remover evento"}
        </Button>
      )}
    </form>
  );
}
