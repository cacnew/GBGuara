"use client";

import { useState } from "react";
import { toast } from "sonner";
import { suggestGraduation } from "@/modules/teacher/actions";

type BeltOption = {
  id: string;
  name: string;
  systemName: string;
};

export function GraduationSuggestionForm({
  studentId,
  belts,
  defaultBeltId,
  defaultDegree,
  hasPendingSuggestion,
}: {
  studentId: string;
  belts: BeltOption[];
  defaultBeltId: string;
  defaultDegree: number;
  hasPendingSuggestion: boolean;
}) {
  const [suggestedBeltId, setSuggestedBeltId] = useState(defaultBeltId);
  const [suggestedDegree, setSuggestedDegree] = useState(defaultDegree);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const result = await suggestGraduation(studentId, {
      suggestedBeltId,
      suggestedDegree,
      notes,
    });
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Sugestao de graduacao enviada.");
    setNotes("");
  }

  if (hasPendingSuggestion) {
    return (
      <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        Este aluno ja tem uma sugestao de graduacao pendente para avaliacao do
        admin.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div>
        <h2 className="font-heading text-lg font-semibold">Sugerir graduacao</h2>
        <p className="text-sm text-muted-foreground">
          A sugestao fica pendente para decisao do administrador.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
        <label className="space-y-1 text-sm font-bold">
          Faixa
          <select
            value={suggestedBeltId}
            onChange={(event) => setSuggestedBeltId(event.target.value)}
            className="w-full px-3"
          >
            {belts.map((belt) => (
              <option key={belt.id} value={belt.id}>
                {belt.systemName} - {belt.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm font-bold">
          Grau
          <input
            type="number"
            min={0}
            max={4}
            value={suggestedDegree}
            onChange={(event) => setSuggestedDegree(Number(event.target.value))}
            className="min-h-11 w-full rounded-lg border border-input bg-background px-3"
          />
        </label>
      </div>
      <label className="space-y-1 text-sm font-bold">
        Observacao
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          className="w-full resize-y px-3 py-2 text-sm"
          placeholder="Motivo da sugestao, pontos tecnicos ou observacoes..."
        />
      </label>
      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60"
      >
        {saving ? "Enviando..." : "Enviar sugestao"}
      </button>
    </form>
  );
}
