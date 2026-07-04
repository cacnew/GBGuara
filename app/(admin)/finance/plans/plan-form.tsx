"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PLAN_DURATIONS, planSchema, type PlanInput } from "@/lib/validations/plan";
import { createPlan, updatePlan } from "./actions";

const DURATION_LABEL: Record<string, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  annual: "Anual",
  drop_in: "Aula avulsa",
  package: "Pacote",
  trial: "Trial",
};

export function PlanForm({
  id,
  priceTables,
  defaultValues,
}: {
  id?: string;
  priceTables: { id: string; name: string }[];
  defaultValues?: PlanInput;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PlanInput>({
    resolver: zodResolver(planSchema),
    defaultValues: defaultValues ?? {
      durationMonths: 1,
      basePrice: 0,
      classesPerWeek: 0,
      classesTotal: 0,
      unlimited: true,
      setupFee: 0,
      loyaltyMonths: 0,
      status: "active",
    },
  });

  const unlimited = watch("unlimited");

  async function onSubmit(data: PlanInput) {
    setIsSubmitting(true);
    const result = id ? await updatePlan(id, data) : await createPlan(data);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(id ? "Plano atualizado." : "Plano criado.");
    router.push("/finance/plans");
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6"
    >
      <div className="space-y-1.5">
        <Label htmlFor="priceTableId">Tabela de preço</Label>
        <select
          id="priceTableId"
          {...register("priceTableId")}
          className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
        >
          <option value="">Selecione...</option>
          {priceTables.map((pt) => (
            <option key={pt.id} value={pt.id}>
              {pt.name}
            </option>
          ))}
        </select>
        {errors.priceTableId && (
          <p className="text-sm text-destructive">
            {errors.priceTableId.message}
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
        <Label htmlFor="planDuration">Duração</Label>
        <select
          id="planDuration"
          {...register("planDuration")}
          className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
        >
          {PLAN_DURATIONS.map((d) => (
            <option key={d} value={d}>
              {DURATION_LABEL[d]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="durationMonths">Duração em meses</Label>
        <Input
          id="durationMonths"
          type="number"
          {...register("durationMonths", { valueAsNumber: true })}
        />
        {errors.durationMonths && (
          <p className="text-sm text-destructive">
            {errors.durationMonths.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="basePrice">Preço base (R$)</Label>
        <Input
          id="basePrice"
          type="number"
          step="0.01"
          {...register("basePrice", { valueAsNumber: true })}
        />
        {errors.basePrice && (
          <p className="text-sm text-destructive">
            {errors.basePrice.message}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input id="unlimited" type="checkbox" {...register("unlimited")} />
        <Label htmlFor="unlimited">Aulas ilimitadas</Label>
      </div>

      {!unlimited && (
        <div className="flex gap-3">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="classesPerWeek">Aulas/semana</Label>
            <Input
              id="classesPerWeek"
              type="number"
              {...register("classesPerWeek", { valueAsNumber: true })}
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="classesTotal">Aulas totais</Label>
            <Input
              id="classesTotal"
              type="number"
              {...register("classesTotal", { valueAsNumber: true })}
            />
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="setupFee">Taxa de matrícula (R$)</Label>
          <Input
            id="setupFee"
            type="number"
            step="0.01"
            {...register("setupFee", { valueAsNumber: true })}
          />
        </div>
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="loyaltyMonths">Fidelidade (meses)</Label>
          <Input
            id="loyaltyMonths"
            type="number"
            {...register("loyaltyMonths", { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descrição (opcional)</Label>
        <Input id="description" {...register("description")} />
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
          <option value="legacy">Legado</option>
        </select>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : id ? "Salvar" : "Criar plano"}
      </Button>
    </form>
  );
}
