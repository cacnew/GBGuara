"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { beltSchema, type BeltInput } from "@/lib/validations/belt";
import { updateBelt } from "../../../actions";

export function EditBeltForm({
  beltId,
  defaultValues,
}: {
  beltId: string;
  defaultValues: BeltInput;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BeltInput>({ resolver: zodResolver(beltSchema), defaultValues });

  async function onSubmit(data: BeltInput) {
    setIsSubmitting(true);
    const result = await updateBelt(beltId, data);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Faixa atualizada.");
    router.push("/belts");
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6"
    >
      <div className="space-y-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="colorHex">Cor (hex, opcional)</Label>
        <Input id="colorHex" {...register("colorHex")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ordering">Ordem</Label>
        <Input
          id="ordering"
          type="number"
          {...register("ordering", { valueAsNumber: true })}
        />
        {errors.ordering && (
          <p className="text-sm text-destructive">
            {errors.ordering.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="maxDegrees">Graus máximos</Label>
        <Input
          id="maxDegrees"
          type="number"
          {...register("maxDegrees", { valueAsNumber: true })}
        />
        {errors.maxDegrees && (
          <p className="text-sm text-destructive">
            {errors.maxDegrees.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
