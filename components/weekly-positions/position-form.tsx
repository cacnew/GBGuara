"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvatarUpload } from "@/components/forms/avatar-upload";
import {
  weeklyPositionSchema,
  type WeeklyPositionFormInput,
} from "@/lib/validations/weekly-position";
import { createWeeklyPosition, updateWeeklyPosition } from "@/modules/weekly-positions/positions";

export function WeeklyPositionForm({
  id,
  basePath,
  schoolId,
  defaultValues,
}: {
  id?: string;
  basePath: string;
  schoolId: string;
  defaultValues?: WeeklyPositionFormInput;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadEntityId] = useState(() => id ?? crypto.randomUUID());
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<WeeklyPositionFormInput>({
    resolver: zodResolver(weeklyPositionSchema),
    defaultValues: defaultValues ?? { imageUrl: "", published: false },
  });

  async function onSubmit(data: WeeklyPositionFormInput) {
    setIsSubmitting(true);
    const result = id ? await updateWeeklyPosition(id, data) : await createWeeklyPosition(data);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(id ? "Posição da semana atualizada." : "Posição da semana criada.");
    router.push(basePath);
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-6"
    >
      <input type="hidden" {...register("imageUrl")} />

      <AvatarUpload
        schoolId={schoolId}
        entityType="weekly_positions"
        entityId={uploadEntityId}
        currentUrl={defaultValues?.imageUrl ?? null}
        label="Imagem"
        shape="square"
        onUploaded={(url) => setValue("imageUrl", url, { shouldValidate: true })}
      />
      {errors.imageUrl && (
        <p className="text-sm text-destructive">{errors.imageUrl.message}</p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="title">Título</Label>
        <Input id="title" {...register("title")} />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descrição</Label>
        <textarea
          id="description"
          rows={4}
          {...register("description")}
          className="w-full rounded-lg border border-border bg-background p-2.5 text-sm"
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="youtubeUrl">Vídeo do YouTube (opcional)</Label>
        <Input
          id="youtubeUrl"
          placeholder="https://www.youtube.com/watch?v=..."
          {...register("youtubeUrl")}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="startDate">Data inicial</Label>
          <Input id="startDate" type="date" {...register("startDate")} />
          {errors.startDate && (
            <p className="text-sm text-destructive">{errors.startDate.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endDate">Data final (opcional)</Label>
          <Input id="endDate" type="date" {...register("endDate")} />
          {errors.endDate && (
            <p className="text-sm text-destructive">{errors.endDate.message}</p>
          )}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register("published")} />
        Publicado
      </label>
      <p className="text-xs text-muted-foreground">
        Só existe uma posição publicada por vez — ao marcar esta como publicada, qualquer outra
        posição publicada da escola é desativada automaticamente.
      </p>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : id ? "Salvar" : "Criar posição da semana"}
      </Button>
    </form>
  );
}
