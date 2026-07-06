"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateUserAccess } from "./actions";

export function UserAccessForm({
  userId,
  currentUserId,
  defaultRole,
  defaultStatus,
}: {
  userId: string;
  currentUserId: string;
  defaultRole: "admin" | "teacher";
  defaultStatus: "active" | "inactive";
}) {
  const router = useRouter();
  const [role, setRole] = useState(defaultRole);
  const [status, setStatus] = useState(defaultStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const changed = role !== defaultRole || status !== defaultStatus;

  async function onSubmit() {
    setIsSubmitting(true);
    const result = await updateUserAccess(userId, { role, status });
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Acesso atualizado.");
    router.refresh();
  }

  return (
    <div className="flex min-w-[18rem] flex-wrap items-center justify-end gap-2">
      <select
        value={role}
        onChange={(event) => setRole(event.target.value as "admin" | "teacher")}
        className="rounded-lg border border-input bg-background px-3 text-sm"
      >
        <option value="teacher">Professor</option>
        <option value="admin">Admin</option>
      </select>
      <select
        value={status}
        onChange={(event) => setStatus(event.target.value as "active" | "inactive")}
        className="rounded-lg border border-input bg-background px-3 text-sm"
      >
        <option value="active">Ativo</option>
        <option value="inactive">Inativo</option>
      </select>
      <Button
        type="button"
        size="sm"
        variant={userId === currentUserId ? "secondary" : "default"}
        disabled={!changed || isSubmitting}
        onClick={onSubmit}
      >
        {isSubmitting ? "Salvando..." : "Salvar"}
      </Button>
    </div>
  );
}
