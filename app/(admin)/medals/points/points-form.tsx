"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MEDAL_LEVEL_LABELS, type MedalPointRule } from "@/modules/medals/points-rules";
import { updateMedalPointRules } from "./actions";

export function MedalPointsForm({ rules }: { rules: MedalPointRule[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(rules.map((r) => [r.level, r.points])),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await updateMedalPointRules(
      rules.map((r) => ({ level: r.level, points: Number(values[r.level]) })),
    );
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Pontuação atualizada.");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6"
    >
      {rules.map((rule) => (
        <div key={rule.level} className="space-y-1.5">
          <Label htmlFor={`points-${rule.level}`}>{MEDAL_LEVEL_LABELS[rule.level]}</Label>
          <Input
            id={`points-${rule.level}`}
            type="number"
            min={0}
            step={1}
            value={values[rule.level]}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, [rule.level]: Number(event.target.value) }))
            }
          />
        </div>
      ))}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
