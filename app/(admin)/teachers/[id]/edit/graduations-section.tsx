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
import {
  teacherGraduationSchema,
  type TeacherGraduationInput,
} from "@/lib/validations/teacher-graduation";
import { addTeacherGraduation } from "./graduations-actions";

export type TeacherGraduationRow = {
  id: string;
  modalityName: string;
  beltName: string;
  degree: number;
  sinceDate: string;
};

export function GraduationsSection({
  teacherId,
  modalities,
  belts,
  graduations,
}: {
  teacherId: string;
  modalities: { id: string; name: string }[];
  belts: { id: string; name: string }[];
  graduations: TeacherGraduationRow[];
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeacherGraduationInput>({
    resolver: zodResolver(teacherGraduationSchema),
    defaultValues: { degree: 0 },
  });

  async function onSubmit(data: TeacherGraduationInput) {
    setIsSubmitting(true);
    const result = await addTeacherGraduation(teacherId, data);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Graduação registrada.");
    reset({ degree: 0 });
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm space-y-4">
      <h2 className="font-heading text-lg font-semibold">Graduações</h2>

      <div className="space-y-2">
        {graduations.map((g) => (
          <div
            key={g.id}
            className="rounded-lg border border-border bg-card p-3 text-sm"
          >
            <p className="font-medium">
              {g.modalityName} · {g.beltName}
            </p>
            <p className="text-muted-foreground">
              Grau {g.degree} desde{" "}
              {formatDateOnly(g.sinceDate)}
            </p>
          </div>
        ))}
        {!graduations.length && (
          <p className="text-sm text-muted-foreground">
            Nenhuma graduação registrada.
          </p>
        )}
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-3 rounded-lg border border-border bg-card p-4"
      >
        <p className="text-sm font-medium">Registrar graduação</p>

        <div className="space-y-1.5">
          <Label htmlFor="modalityId">Modalidade</Label>
          <select
            id="modalityId"
            {...register("modalityId")}
            className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
          >
            <option value="">Selecione...</option>
            {modalities.map((modality) => (
              <option key={modality.id} value={modality.id}>
                {modality.name}
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
          <Label htmlFor="beltId">Faixa</Label>
          <select
            id="beltId"
            {...register("beltId")}
            className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
          >
            <option value="">Selecione...</option>
            {belts.map((belt) => (
              <option key={belt.id} value={belt.id}>
                {belt.name}
              </option>
            ))}
          </select>
          {errors.beltId && (
            <p className="text-sm text-destructive">{errors.beltId.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="degree">Grau</Label>
          <Input
            id="degree"
            type="number"
            {...register("degree", { valueAsNumber: true })}
          />
          {errors.degree && (
            <p className="text-sm text-destructive">{errors.degree.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sinceDate">Desde</Label>
          <Input id="sinceDate" type="date" {...register("sinceDate")} />
          {errors.sinceDate && (
            <p className="text-sm text-destructive">
              {errors.sinceDate.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Registrando..." : "Registrar graduação"}
        </Button>
      </form>
    </div>
  );
}
