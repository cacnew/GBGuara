"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatDateOnly } from "@/lib/dates/format";
import { addInternalNote, type InternalNote } from "@/modules/students/internal-notes";

export function InternalNotesSection({
  studentId,
  notes,
}: {
  studentId: string;
  notes: InternalNote[];
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit() {
    setIsSubmitting(true);
    const result = await addInternalNote(studentId, text);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setText("");
    toast.success("Observação registrada.");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm space-y-3">
      <h2 className="font-heading text-lg font-semibold">Observações internas</h2>
      <p className="text-xs text-muted-foreground">
        Visível apenas para admin e professores — nunca aparece para o aluno.
      </p>

      <div className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Registrar uma observação..."
          rows={3}
          className="w-full rounded-lg border border-border bg-background p-2.5 text-sm"
        />
        <Button size="sm" disabled={isSubmitting || !text.trim()} onClick={onSubmit}>
          {isSubmitting ? "Salvando..." : "Adicionar observação"}
        </Button>
      </div>

      <div className="space-y-2">
        {notes.map((n) => (
          <div key={n.id} className="rounded-lg border border-border bg-card p-3 text-sm">
            <p>{n.note}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {n.authorName ?? "Equipe"} · {formatDateOnly(n.createdAt.slice(0, 10))}
            </p>
          </div>
        ))}
        {!notes.length && (
          <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
            Nenhuma observação registrada ainda.
          </p>
        )}
      </div>
    </div>
  );
}
