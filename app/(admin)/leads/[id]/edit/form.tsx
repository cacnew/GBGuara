"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { maskBrazilianPhoneInput } from "@/lib/phone";
import { leadSchema, type LeadInput } from "@/lib/validations/lead";
import { updateLead, convertLeadToStudent } from "../../actions";

const STATUS_LABEL: Record<LeadInput["status"], string> = {
  novo: "Novo",
  contatado: "Contatado",
  agendado: "Agendado",
  matriculado: "Matriculado",
  perdido: "Perdido",
};

export function EditLeadForm({
  id,
  defaultValues,
  convertedStudentId,
}: {
  id: string;
  defaultValues: LeadInput;
  convertedStudentId: string | null;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues,
  });

  async function onSubmit(data: LeadInput) {
    setIsSubmitting(true);
    const result = await updateLead(id, data);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Lead atualizado.");
    router.push("/leads");
  }

  async function onConvert() {
    setIsConverting(true);
    const result = await convertLeadToStudent(id);
    setIsConverting(false);

    if (result?.error) {
      toast.error(result.error);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6"
    >
      {convertedStudentId ? (
        <p className="text-sm text-muted-foreground">
          Este lead já foi convertido.{" "}
          <Link
            href={`/students/${convertedStudentId}/edit`}
            className="text-primary hover:underline"
          >
            Ver ficha do aluno
          </Link>
        </p>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={isConverting}
          onClick={onConvert}
        >
          {isConverting ? "Convertendo..." : "Converter em aluno"}
        </Button>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Telefone (opcional)</Label>
        <Input
          id="phone"
          placeholder="(61) 98151-4745"
          {...register("phone", {
            onChange: (event) => {
              event.target.value = maskBrazilianPhoneInput(event.target.value);
            },
          })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail (opcional)</Label>
        <Input id="email" type="email" {...register("email")} />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="source">Origem (opcional)</Label>
        <Input id="source" {...register("source")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          {...register("status")}
          className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
        >
          {Object.entries(STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Observações (opcional)</Label>
        <Input id="notes" {...register("notes")} />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
