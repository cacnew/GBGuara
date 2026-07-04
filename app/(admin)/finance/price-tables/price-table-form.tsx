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
  priceTableSchema,
  type PriceTableInput,
} from "@/lib/validations/price-table";
import { createPriceTable, updatePriceTable } from "./actions";

export function PriceTableForm({
  id,
  defaultValues,
}: {
  id?: string;
  defaultValues?: PriceTableInput;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PriceTableInput>({
    resolver: zodResolver(priceTableSchema),
    defaultValues: defaultValues ?? { status: "active" },
  });

  async function onSubmit(data: PriceTableInput) {
    setIsSubmitting(true);
    const result = id
      ? await updatePriceTable(id, data)
      : await createPriceTable(data);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(id ? "Tabela atualizada." : "Tabela criada.");
    router.push("/finance/price-tables");
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
        <Label htmlFor="description">Descrição (opcional)</Label>
        <Input id="description" {...register("description")} />
      </div>

      <div className="flex gap-3">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="validFrom">Vigência início</Label>
          <Input id="validFrom" type="date" {...register("validFrom")} />
          {errors.validFrom && (
            <p className="text-sm text-destructive">
              {errors.validFrom.message}
            </p>
          )}
        </div>
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="validUntil">Vigência fim (opcional)</Label>
          <Input id="validUntil" type="date" {...register("validUntil")} />
        </div>
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
          <option value="legacy">Legada</option>
        </select>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : id ? "Salvar" : "Criar tabela"}
      </Button>
    </form>
  );
}
