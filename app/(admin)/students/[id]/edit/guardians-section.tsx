"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { guardianSchema, type GuardianInput } from "@/lib/validations/guardian";
import {
  addGuardianToStudent,
  removeGuardianLink,
  updateGuardianLink,
} from "./guardians-actions";

export type GuardianLink = {
  linkId: string;
  guardianId: string;
  name: string;
  phone: string | null;
  relationship: string | null;
  isPrimary: boolean;
  isFinancialResponsible: boolean;
};

export function GuardiansSection({
  studentId,
  guardians,
}: {
  studentId: string;
  guardians: GuardianLink[];
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GuardianInput>({
    resolver: zodResolver(guardianSchema),
    defaultValues: { isPrimary: false, isFinancialResponsible: false },
  });

  async function onSubmit(data: GuardianInput) {
    setIsSubmitting(true);
    const result = await addGuardianToStudent(studentId, data);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Responsável adicionado.");
    reset();
    router.refresh();
  }

  async function onToggle(
    link: GuardianLink,
    field: "isPrimary" | "isFinancialResponsible",
  ) {
    const result = await updateGuardianLink(link.linkId, studentId, {
      isPrimary: field === "isPrimary" ? !link.isPrimary : link.isPrimary,
      isFinancialResponsible:
        field === "isFinancialResponsible"
          ? !link.isFinancialResponsible
          : link.isFinancialResponsible,
    });

    if (result.error) {
      toast.error(result.error);
      return;
    }

    router.refresh();
  }

  async function onRemove(linkId: string) {
    const result = await removeGuardianLink(linkId, studentId);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Responsável removido do aluno.");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm space-y-4">
      <h2 className="font-heading text-lg font-semibold">Responsáveis</h2>

      <div className="space-y-2">
        {guardians.map((link) => (
          <div
            key={link.linkId}
            className="rounded-lg border border-border bg-card p-3 text-sm"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium">{link.name}</p>
              <button
                type="button"
                onClick={() => onRemove(link.linkId)}
                className="text-xs text-destructive hover:underline"
              >
                Remover
              </button>
            </div>
            <p className="text-muted-foreground">
              {link.relationship || "-"} · {link.phone || "-"}
            </p>
            <div className="mt-2 flex gap-4 text-xs">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={link.isPrimary}
                  onChange={() => onToggle(link, "isPrimary")}
                />
                Principal
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={link.isFinancialResponsible}
                  onChange={() => onToggle(link, "isFinancialResponsible")}
                />
                Responsável financeiro
              </label>
            </div>
          </div>
        ))}
        {!guardians.length && (
          <p className="text-sm text-muted-foreground">
            Nenhum responsável vinculado.
          </p>
        )}
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-3 rounded-lg border border-border bg-card p-4"
      >
        <p className="text-sm font-medium">Adicionar responsável</p>

        <div className="space-y-1.5">
          <Label htmlFor="guardianName">Nome</Label>
          <Input id="guardianName" {...register("name")} />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="guardianPhone">Telefone (opcional)</Label>
          <Input id="guardianPhone" {...register("phone")} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="guardianRelationship">Parentesco (opcional)</Label>
          <Input id="guardianRelationship" {...register("relationship")} />
        </div>

        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input type="checkbox" {...register("isPrimary")} />
            Principal
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" {...register("isFinancialResponsible")} />
            Resp. financeiro
          </label>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Adicionando..." : "Adicionar responsável"}
        </Button>
      </form>
    </div>
  );
}
