"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateOnly } from "@/lib/dates/format";
import { medalLaunchSchema, type MedalLaunchFormInput } from "@/lib/validations/medal-launch";
import { MEDAL_LEVEL_LABELS } from "@/modules/medals/points-rules";
import type { MedalEventOption } from "@/modules/medals/events";

export function MedalLaunchForm({
  id,
  basePath,
  events,
  modalities,
  defaultValues,
  onCreate,
  onUpdate,
  submitLabel,
}: {
  id?: string;
  basePath: string;
  events: MedalEventOption[];
  modalities: { id: string; name: string }[];
  defaultValues?: MedalLaunchFormInput;
  onCreate?: (input: MedalLaunchFormInput) => Promise<{ error?: string }>;
  onUpdate?: (id: string, input: MedalLaunchFormInput) => Promise<{ error?: string }>;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MedalLaunchFormInput>({
    resolver: zodResolver(medalLaunchSchema),
    defaultValues: defaultValues ?? { level: "ouro", modalityId: "" },
  });

  async function onSubmit(data: MedalLaunchFormInput) {
    setIsSubmitting(true);
    const result =
      id && onUpdate
        ? await onUpdate(id, data)
        : onCreate
          ? await onCreate(data)
          : { error: "Operação inválida" };
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(id ? "Lançamento atualizado." : "Medalha lançada para análise.");
    router.push(basePath);
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6"
    >
      <div className="space-y-1.5">
        <Label htmlFor="eventId">Evento</Label>
        <select
          id="eventId"
          {...register("eventId")}
          className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
        >
          <option value="">Selecione um evento</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name} — {formatDateOnly(event.eventDate)}
            </option>
          ))}
        </select>
        {errors.eventId && <p className="text-sm text-destructive">{errors.eventId.message}</p>}
        {!events.length && (
          <p className="text-xs text-muted-foreground">
            Nenhum evento cadastrado ainda — peça para o professor ou admin criar o evento antes
            de lançar.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="modalityId">Modalidade (opcional)</Label>
        <select
          id="modalityId"
          {...register("modalityId")}
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
        <Label htmlFor="category">Categoria/peso (opcional)</Label>
        <Input id="category" placeholder="ex: Adulto Leve Faixa Azul" {...register("category")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="level">Resultado</Label>
        <select
          id="level"
          {...register("level")}
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
        <Label htmlFor="proofUrl">Link do comprovante/foto (opcional)</Label>
        <Input id="proofUrl" placeholder="https://..." {...register("proofUrl")} />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Enviando..." : submitLabel ?? (id ? "Salvar e reenviar" : "Lançar medalha")}
      </Button>
    </form>
  );
}
