"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BeltWithPreview } from "@/components/belts/belt-preview";
import type { BeltSystemRequirements } from "@/modules/graduation/requirements";
import { updateBeltGraduationRequirement } from "./actions";

export function GraduationRequirementsForm({ system }: { system: BeltSystemRequirements }) {
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(system.transitions.map((t) => [t.fromBeltId, t.requiredClasses])),
  );
  const [savingId, setSavingId] = useState<string | null>(null);

  async function saveTransition(fromBeltId: string, toBeltId: string) {
    const requiredClasses = Number(values[fromBeltId]);

    if (!Number.isInteger(requiredClasses) || requiredClasses < 0) {
      toast.error("Nº de aulas deve ser um número inteiro maior ou igual a zero");
      return;
    }

    setSavingId(fromBeltId);
    const result = await updateBeltGraduationRequirement({
      beltSystemId: system.beltSystemId,
      fromBeltId,
      toBeltId,
      requiredClasses,
    });
    setSavingId(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Meta salva.");
  }

  if (system.transitions.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="font-heading text-lg font-semibold">{system.beltSystemName}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Só existe uma faixa cadastrada — sem próxima faixa para configurar.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="font-heading text-lg font-semibold">{system.beltSystemName}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="pb-2 font-medium">Faixa atual</th>
              <th className="pb-2 font-medium">Próxima faixa</th>
              <th className="pb-2 font-medium">Nº de aulas para estar apto</th>
            </tr>
          </thead>
          <tbody>
            {system.transitions.map((transition) => (
              <tr key={transition.fromBeltId} className="border-t border-border">
                <td className="py-2 pr-4">
                  <BeltWithPreview name={transition.fromBeltName} />
                </td>
                <td className="py-2 pr-4">
                  <BeltWithPreview name={transition.toBeltName} />
                </td>
                <td className="py-2">
                  <Label htmlFor={`req-${transition.fromBeltId}`} className="sr-only">
                    Nº de aulas para {transition.fromBeltName} → {transition.toBeltName}
                  </Label>
                  <Input
                    id={`req-${transition.fromBeltId}`}
                    type="number"
                    min={0}
                    step={1}
                    className="w-24"
                    disabled={savingId === transition.fromBeltId}
                    value={values[transition.fromBeltId]}
                    onChange={(event) =>
                      setValues((prev) => ({
                        ...prev,
                        [transition.fromBeltId]: Number(event.target.value),
                      }))
                    }
                    onBlur={() => saveTransition(transition.fromBeltId, transition.toBeltId)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
