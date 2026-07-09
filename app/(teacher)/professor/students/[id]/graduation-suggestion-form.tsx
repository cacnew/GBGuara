"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BeltWithPreview } from "@/components/belts/belt-preview";
import { IBJJF_GRADUATION_RULES_URL } from "@/lib/ibjjf";
import { suggestGraduation } from "@/modules/teacher/actions";

type BeltOption = {
  id: string;
  name: string;
  systemName: string;
  maxDegrees: number;
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
  const selectedBelt = belts.find((belt) => belt.id === suggestedBeltId);
  const maxDegree = selectedBelt?.maxDegrees ?? 10;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (suggestedDegree > maxDegree) {
      toast.error(`Esta faixa permite grau ate ${maxDegree}.`);
      return;
    }

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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-semibold">Sugerir graduacao</h2>
          <a
            href={IBJJF_GRADUATION_RULES_URL}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-primary hover:underline"
          >
            Regras IBJJF
          </a>
        </div>
        <p className="text-sm text-muted-foreground">
          A sugestao fica pendente para decisao do administrador.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
        <label className="space-y-1 text-sm font-bold">
          Faixa
          <select
            value={suggestedBeltId}
            onChange={(event) => {
              const nextBelt = belts.find((belt) => belt.id === event.target.value);
              setSuggestedBeltId(event.target.value);
              if (nextBelt && suggestedDegree > nextBelt.maxDegrees) {
                setSuggestedDegree(nextBelt.maxDegrees);
              }
            }}
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
            max={maxDegree}
            value={suggestedDegree}
            onChange={(event) => setSuggestedDegree(Number(event.target.value))}
            className="min-h-11 w-full rounded-lg border border-input bg-background px-3"
          />
        </label>
      </div>
      {selectedBelt && (
        <div className="rounded-lg border border-dashed border-border bg-background p-3 text-sm">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Previa selecionada
          </p>
          <BeltWithPreview name={selectedBelt.name} degree={suggestedDegree} />
        </div>
      )}
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
