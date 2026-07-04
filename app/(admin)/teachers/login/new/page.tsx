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
  createTeacherLoginSchema,
  type CreateTeacherLoginInput,
} from "@/lib/validations/create-teacher-login";
import { createTeacherLogin } from "./actions";

export default function NewTeacherPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateTeacherLoginInput>({
    resolver: zodResolver(createTeacherLoginSchema),
  });

  async function onSubmit(data: CreateTeacherLoginInput) {
    setIsSubmitting(true);
    const result = await createTeacherLogin(data);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Professor cadastrado com sucesso.");
    reset();
    router.push("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="w-full max-w-sm space-y-1">
        <h1 className="font-heading text-2xl font-semibold">
          Novo professor
        </h1>
        <p className="text-sm text-muted-foreground">
          Cria o acesso do professor ao sistema. Ficha completa (foto,
          telefone, faixas) chega na Fase 2.
        </p>
      </div>

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
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Senha inicial</Label>
          <Input id="password" type="password" {...register("password")} />
          {errors.password && (
            <p className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirmar senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Criando..." : "Criar professor"}
        </Button>
      </form>
    </div>
  );
}
