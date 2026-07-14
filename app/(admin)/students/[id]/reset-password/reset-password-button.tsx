"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { resetStudentPassword } from "./actions";

export function ResetPasswordButton({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setTempPassword(null);
  }

  async function handleConfirm() {
    setIsSubmitting(true);
    const result = await resetStudentPassword(studentId);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setTempPassword(result.tempPassword ?? null);
  }

  async function handleCopy() {
    if (!tempPassword) return;
    await navigator.clipboard.writeText(tempPassword);
    toast.success("Senha copiada");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonVariants({ size: "sm", variant: "outline" })}
      >
        Resetar senha
      </button>

      <ConfirmDialog
        open={open}
        title={tempPassword ? "Senha redefinida" : "Resetar senha do aluno?"}
        description={
          tempPassword ? undefined : (
            <>
              Uma nova senha temporária será gerada para{" "}
              <strong className="text-foreground">{studentName}</strong>. O
              aluno precisará defini-la novamente no próximo acesso.
            </>
          )
        }
        confirmLabel={tempPassword ? "Concluído" : "Resetar senha"}
        cancelLabel="Cancelar"
        isConfirming={isSubmitting}
        onConfirm={tempPassword ? close : handleConfirm}
        onCancel={close}
      >
        {tempPassword && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Envie esta senha temporária para {studentName}. Ela só será
              exibida uma vez.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-sm">
                {tempPassword}
              </code>
              <Button type="button" size="sm" variant="outline" onClick={handleCopy}>
                Copiar
              </Button>
            </div>
          </div>
        )}
      </ConfirmDialog>
    </>
  );
}
