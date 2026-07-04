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
  extraClassSessionSchema,
  type ExtraClassSessionInput,
} from "@/lib/validations/class-session";
import { createExtraClassSession } from "@/modules/classes/sessions";

export function NewExtraSessionForm({
  classGroups,
}: {
  classGroups: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExtraClassSessionInput>({
    resolver: zodResolver(extraClassSessionSchema),
  });

  async function onSubmit(data: ExtraClassSessionInput) {
    setIsSubmitting(true);
    const result = await createExtraClassSession(data.classGroupId, data.date);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Sessão extra criada.");
    router.push("/classes/sessions");
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6"
    >
      <div className="space-y-1.5">
        <Label htmlFor="classGroupId">Turma</Label>
        <select
          id="classGroupId"
          {...register("classGroupId")}
          className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
        >
          <option value="">Selecione...</option>
          {classGroups.map((cg) => (
            <option key={cg.id} value={cg.id}>
              {cg.name}
            </option>
          ))}
        </select>
        {errors.classGroupId && (
          <p className="text-sm text-destructive">
            {errors.classGroupId.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="date">Data</Label>
        <Input id="date" type="date" {...register("date")} />
        {errors.date && (
          <p className="text-sm text-destructive">{errors.date.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Criando..." : "Criar sessão extra"}
      </Button>
    </form>
  );
}
