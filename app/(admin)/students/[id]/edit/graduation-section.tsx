"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerGraduation } from "@/modules/graduation/actions";

export type BeltSystemOption = { id: string; name: string };
export type BeltOption = {
  id: string;
  beltSystemId: string;
  name: string;
  ordering: number;
};
export type TeacherOption = { id: string; name: string };

function formatElapsed(days: number): string {
  if (days < 30) return `${days} dia${days === 1 ? "" : "s"}`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} ${months === 1 ? "mês" : "meses"}`;
  }
  const years = Math.floor(days / 365);
  const remainingMonths = Math.floor((days % 365) / 30);
  return `${years} ${years === 1 ? "ano" : "anos"}${remainingMonths > 0 ? ` e ${remainingMonths} ${remainingMonths === 1 ? "mês" : "meses"}` : ""}`;
}

export function GraduationSection({
  studentId,
  currentBeltName,
  currentDegree,
  beltSystems,
  belts,
  teachers,
  attendancesSinceLastGraduation,
  daysSinceLastGraduation,
}: {
  studentId: string;
  currentBeltName: string | null;
  currentDegree: number;
  beltSystems: BeltSystemOption[];
  belts: BeltOption[];
  teachers: TeacherOption[];
  attendancesSinceLastGraduation: number;
  daysSinceLastGraduation: number;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [beltSystemId, setBeltSystemId] = useState("");
  const [newBeltId, setNewBeltId] = useState("");
  const [newDegree, setNewDegree] = useState("0");
  const [graduationDate, setGraduationDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [teacherId, setTeacherId] = useState("");
  const [notes, setNotes] = useState("");

  const beltsForSystem = useMemo(
    () => belts.filter((b) => b.beltSystemId === beltSystemId).sort((a, b) => a.ordering - b.ordering),
    [belts, beltSystemId],
  );

  async function onSubmit() {
    setIsSubmitting(true);
    const result = await registerGraduation(studentId, {
      newBeltId,
      newDegree: Number(newDegree),
      graduationDate,
      teacherId: teacherId || undefined,
      notes: notes || undefined,
    });
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Graduação registrada.");
    setNewBeltId("");
    setNotes("");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm space-y-4">
      <h2 className="font-heading text-lg font-semibold">Graduação</h2>

      <div className="rounded-lg border border-border bg-card p-4 text-sm space-y-1.5">
        <p>
          <span className="text-muted-foreground">Faixa/grau atual:</span>{" "}
          {currentBeltName ?? "Sem faixa"} {currentBeltName ? `— grau ${currentDegree}` : ""}
        </p>
        <p>
          <span className="text-muted-foreground">
            Dias de presença desde a última graduação:
          </span>{" "}
          {attendancesSinceLastGraduation}
        </p>
        <p>
          <span className="text-muted-foreground">Tempo desde a última graduação:</span>{" "}
          {formatElapsed(daysSinceLastGraduation)}
        </p>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-medium">Registrar graduação</p>

        <div className="space-y-1.5">
          <Label htmlFor="beltSystemId">Sistema de faixas</Label>
          <select
            id="beltSystemId"
            value={beltSystemId}
            onChange={(e) => {
              setBeltSystemId(e.target.value);
              setNewBeltId("");
            }}
            className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
          >
            <option value="">Selecione...</option>
            {beltSystems.map((system) => (
              <option key={system.id} value={system.id}>
                {system.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="newBeltId">Nova faixa</Label>
          <select
            id="newBeltId"
            value={newBeltId}
            onChange={(e) => setNewBeltId(e.target.value)}
            className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
            disabled={!beltSystemId}
          >
            <option value="">Selecione...</option>
            {beltsForSystem.map((belt) => (
              <option key={belt.id} value={belt.id}>
                {belt.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="newDegree">Grau</Label>
          <Input
            id="newDegree"
            type="number"
            min={0}
            value={newDegree}
            onChange={(e) => setNewDegree(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="graduationDate">Data</Label>
          <Input
            id="graduationDate"
            type="date"
            value={graduationDate}
            onChange={(e) => setGraduationDate(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="teacherId">Professor responsável (opcional)</Label>
          <select
            id="teacherId"
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
          >
            <option value="">Selecione...</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="graduationNotes">Observações (opcional)</Label>
          <Input
            id="graduationNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <Button
          className="w-full"
          disabled={isSubmitting || !newBeltId}
          onClick={onSubmit}
        >
          {isSubmitting ? "Salvando..." : "Registrar graduação"}
        </Button>
      </div>
    </div>
  );
}
