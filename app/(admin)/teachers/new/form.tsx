"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvatarUpload } from "@/components/forms/avatar-upload";
import { maskBrazilianPhoneInput } from "@/lib/phone";
import { teacherSchema, type TeacherInput } from "@/lib/validations/teacher";
import { createTeacherProfile } from "../actions";

export function NewTeacherProfileForm({ schoolId }: { schoolId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadEntityId] = useState(() => crypto.randomUUID());
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TeacherInput>({
    resolver: zodResolver(teacherSchema),
    defaultValues: { status: "active", photoUrl: "" },
  });

  async function onSubmit(data: TeacherInput) {
    setIsSubmitting(true);
    const result = await createTeacherProfile(data);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Professor cadastrado.");
    router.push("/teachers");
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6"
    >
      <input type="hidden" {...register("photoUrl")} />

      <AvatarUpload
        schoolId={schoolId}
        entityType="teachers"
        entityId={uploadEntityId}
        currentUrl={null}
        hint="Para um melhor enquadramento na landing page, sugerimos fazer upload de imagem vertical em 1200 x 1600 px (proporcao 3:4), com rosto e tronco centralizados."
        onUploaded={(url) => setValue("photoUrl", url)}
      />

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
        <Label htmlFor="notes">Observações (opcional)</Label>
        <Input id="notes" {...register("notes")} />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : "Cadastrar professor"}
      </Button>
    </form>
  );
}
