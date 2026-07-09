"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  classGroupSchema,
  SUGGESTED_AUDIENCES,
  WEEK_DAYS,
  type ClassGroupInput,
} from "@/lib/validations/class-group";
import { createClassGroup, updateClassGroup } from "./actions";

export function ClassGroupForm({
  id,
  modalities,
  teachers,
  defaultValues,
}: {
  id?: string;
  modalities: { id: string; name: string }[];
  teachers: { id: string; name: string }[];
  defaultValues?: ClassGroupInput;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClassGroupInput>({
    resolver: zodResolver(classGroupSchema),
    defaultValues: defaultValues ?? {
      weekDays: [],
      suggestedStudentLimit: 0,
      status: "active",
    },
  });

  async function onSubmit(data: ClassGroupInput) {
    setIsSubmitting(true);
    const result = id
      ? await updateClassGroup(id, data)
      : await createClassGroup(data);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(id ? "Turma atualizada." : "Turma criada.");
    router.push("/classes");
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid w-full max-w-5xl gap-4 rounded-lg border border-border bg-card p-6 md:grid-cols-2"
    >
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="modalityId">Modalidade</Label>
        <select
          id="modalityId"
          {...register("modalityId")}
          className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
        >
          <option value="">Selecione...</option>
          {modalities.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        {errors.modalityId && (
          <p className="text-sm text-destructive">
            {errors.modalityId.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="mainTeacherId">Professor principal (opcional)</Label>
        <select
          id="mainTeacherId"
          {...register("mainTeacherId")}
          className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
        >
          <option value="">Nenhum</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5 md:col-span-2">
        <Label>Dias da semana</Label>
        <div className="flex flex-wrap gap-3 text-sm">
          {WEEK_DAYS.map((day) => (
            <label key={day.value} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                value={day.value}
                {...register("weekDays")}
              />
              {day.label}
            </label>
          ))}
        </div>
        {errors.weekDays && (
          <p className="text-sm text-destructive">{errors.weekDays.message}</p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="startTime">Início</Label>
          <Input id="startTime" type="time" {...register("startTime")} />
          {errors.startTime && (
            <p className="text-sm text-destructive">
              {errors.startTime.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endTime">Término</Label>
          <Input id="endTime" type="time" {...register("endTime")} />
          {errors.endTime && (
            <p className="text-sm text-destructive">
              {errors.endTime.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="suggestedAudience">Público sugerido (opcional)</Label>
        <select
          id="suggestedAudience"
          {...register("suggestedAudience")}
          className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
        >
          <option value="">Nenhum</option>
          {SUGGESTED_AUDIENCES.map((audience) => (
            <option key={audience} value={audience}>
              {audience}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Apenas orientativo — o sistema não bloqueia ninguém por isso.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="suggestedStudentLimit">
          Limite sugerido de alunos (0 = sem limite)
        </Label>
        <Input
          id="suggestedStudentLimit"
          type="number"
          {...register("suggestedStudentLimit", { valueAsNumber: true })}
        />
        {errors.suggestedStudentLimit && (
          <p className="text-sm text-destructive">
            {errors.suggestedStudentLimit.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor="notes">Observações (opcional)</Label>
        <Input id="notes" {...register("notes")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          {...register("status")}
          className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
        >
          <option value="active">Ativa</option>
          <option value="inactive">Inativa</option>
        </select>
      </div>

      <Button type="submit" className="w-full md:col-span-2" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : id ? "Salvar" : "Criar turma"}
      </Button>
    </form>
  );
}
