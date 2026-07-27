"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { holidaySchema, type HolidayFormInput } from "@/lib/validations/holiday";
import { createHoliday, updateHoliday } from "@/modules/holidays/holidays";

export function HolidayForm({
  id,
  defaultValues,
}: {
  id?: string;
  defaultValues?: HolidayFormInput;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HolidayFormInput>({
    resolver: zodResolver(holidaySchema),
    defaultValues: defaultValues ?? { recurring: true, hasClass: false },
  });

  async function onSubmit(data: HolidayFormInput) {
    setIsSubmitting(true);
    const result = id ? await updateHoliday(id, data) : await createHoliday(data);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(id ? "Feriado atualizado." : "Feriado criado.");
    router.push("/calendar/holidays");
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-6"
    >
      <div className="space-y-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="date">Data</Label>
        <Input id="date" type="date" {...register("date")} />
        {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="customMessage">Mensagem personalizada (opcional)</Label>
        <textarea
          id="customMessage"
          rows={3}
          {...register("customMessage")}
          className="w-full rounded-lg border border-border bg-background p-2.5 text-sm"
          placeholder="Usada no aviso enviado aos alunos e professores"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register("recurring")} />
        Recorrente (repete todo ano nesta data)
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register("hasClass")} />
        Haverá aula normalmente nesta data
      </label>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : id ? "Salvar" : "Criar feriado"}
      </Button>
    </form>
  );
}
