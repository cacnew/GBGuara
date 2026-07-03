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
  beltSystemSchema,
  type BeltSystemInput,
} from "@/lib/validations/belt";
import { createBeltSystem } from "../../actions";

export function NewBeltSystemForm({
  modalities,
}: {
  modalities: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BeltSystemInput>({ resolver: zodResolver(beltSystemSchema) });

  async function onSubmit(data: BeltSystemInput) {
    setIsSubmitting(true);
    const result = await createBeltSystem(data);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Sistema de faixa criado.");
    router.push("/belts");
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6"
    >
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
        <Label htmlFor="name">Nome</Label>
        <Input id="name" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="audience">Público</Label>
        <select
          id="audience"
          {...register("audience")}
          className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
        >
          <option value="adulto">Adulto</option>
          <option value="kids">Kids</option>
          <option value="juvenil">Juvenil</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descrição (opcional)</Label>
        <Input id="description" {...register("description")} />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Criando..." : "Criar sistema de faixa"}
      </Button>
    </form>
  );
}
