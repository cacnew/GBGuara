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
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validations/login";
import { resolveLoginDestination } from "@/modules/auth/actions";

export function LoginForm({
  academyName,
  logoUrl,
}: {
  academyName: string;
  logoUrl: string;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setIsSubmitting(true);
    const supabase = createClient();
    const { data: signInData, error } = await supabase.auth.signInWithPassword(data);

    if (error || !signInData.user) {
      setIsSubmitting(false);
      toast.error("E-mail ou senha invalidos");
      return;
    }

    const destination = await resolveLoginDestination(signInData.session.access_token);
    setIsSubmitting(false);
    router.push(destination);
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-background p-6 shadow-2xl"
    >
      <div className="space-y-3 text-center">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={academyName} className="mx-auto max-h-16 max-w-44 object-contain" />
        ) : (
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-black text-primary-foreground">
            {academyName.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="font-heading text-2xl font-semibold">Entrar</h1>
          <p className="text-sm text-muted-foreground">Acesse o painel da {academyName}.</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" {...register("email")} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" type="password" {...register("password")} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Entrando..." : "Entrar"}
      </Button>

      <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
        <Link href="/" className="hover:underline">
          Voltar ao site
        </Link>
        <span>•</span>
        <Link href="/privacy" className="hover:underline">
          Politica de privacidade
        </Link>
      </div>
    </form>
  );
}
