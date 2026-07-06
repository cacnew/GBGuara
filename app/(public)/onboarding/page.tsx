"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { onboardingSchema, type OnboardingInput } from "@/lib/validations/onboarding";
import { onboardSchool } from "./actions";

export default function OnboardingPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingInput>({ resolver: zodResolver(onboardingSchema) });

  async function onSubmit(data: OnboardingInput) {
    setIsSubmitting(true);
    const result = await onboardSchool(data);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Escola criada! Faça login para continuar.");
    router.push("/login");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-background px-4 py-12 text-foreground">
      <div className="flex w-full max-w-sm justify-end">
        <Link href="/login" className={buttonVariants({ variant: "outline" })}>
          Voltar
        </Link>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6"
      >
        <div className="space-y-1 text-center">
          <h1 className="font-heading text-2xl font-semibold">
            Cadastrar escola
          </h1>
          <p className="text-sm text-muted-foreground">
            Crie a conta da sua escola e o primeiro acesso de administrador.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="schoolName">Nome da escola</Label>
          <Input id="schoolName" {...register("schoolName")} />
          {errors.schoolName && (
            <p className="text-sm text-destructive">
              {errors.schoolName.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="adminName">Seu nome</Label>
          <Input id="adminName" {...register("adminName")} />
          {errors.adminName && (
            <p className="text-sm text-destructive">
              {errors.adminName.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="adminEmail">E-mail</Label>
          <Input id="adminEmail" type="email" {...register("adminEmail")} />
          {errors.adminEmail && (
            <p className="text-sm text-destructive">
              {errors.adminEmail.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="adminPassword">Senha</Label>
          <Input
            id="adminPassword"
            type="password"
            {...register("adminPassword")}
          />
          {errors.adminPassword && (
            <p className="text-sm text-destructive">
              {errors.adminPassword.message}
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
          {isSubmitting ? "Criando..." : "Criar escola"}
        </Button>
      </form>
    </div>
  );
}
