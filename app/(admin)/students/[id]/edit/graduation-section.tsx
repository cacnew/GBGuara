"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BeltWithPreview } from "@/components/belts/belt-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateOnly } from "@/lib/dates/format";
import { IBJJF_GRADUATION_RULES_URL } from "@/lib/ibjjf";
import { registerGraduation } from "@/modules/graduation/actions";

export type BeltSystemOption = { id: string; name: string };
export type BeltOption = {
  id: string;
  beltSystemId: string;
  name: string;
  ordering: number;
  maxDegrees: number;
};
export type TeacherOption = { id: string; name: string };
export type GraduationHistoryRow = {
  id: string;
  date: string;
  previousBeltName: string | null;
  previousDegree: number;
  newBeltName: string;
  newDegree: number;
  teacherName: string | null;
  notes: string | null;
};

function formatElapsed(days: number): string {
  if (days < 30) return `${days} dia${days === 1 ? "" : "s"}`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} ${months === 1 ? "mes" : "meses"}`;
  }
  const years = Math.floor(days / 365);
  const remainingMonths = Math.floor((days % 365) / 30);
  return `${years} ${years === 1 ? "ano" : "anos"}${
    remainingMonths > 0
      ? ` e ${remainingMonths} ${remainingMonths === 1 ? "mes" : "meses"}`
      : ""
  }`;
}

export function GraduationSection({
  studentId,
  currentBeltName,
  currentDegree,
  beltSystems,
  belts,
  teachers,
  history,
  attendancesSinceLastGraduation,
  daysSinceLastGraduation,
}: {
  studentId: string;
  currentBeltName: string | null;
  currentDegree: number;
  beltSystems: BeltSystemOption[];
  belts: BeltOption[];
  teachers: TeacherOption[];
  history: GraduationHistoryRow[];
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
    () =>
      belts
        .filter((belt) => belt.beltSystemId === beltSystemId)
        .sort((a, b) => a.ordering - b.ordering),
    [belts, beltSystemId],
  );
  const selectedBelt = belts.find((belt) => belt.id === newBeltId);
  const maxDegree = selectedBelt?.maxDegrees ?? 10;

  async function onSubmit() {
    if (Number(newDegree) > maxDegree) {
      toast.error(`Esta faixa permite grau ate ${maxDegree}.`);
      return;
    }

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

    toast.success("Graduacao registrada.");
    setNewBeltId("");
    setNotes("");
    router.refresh();
  }

  return (
    <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:items-start">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-semibold">Graduacao</h2>
          <a
            href={IBJJF_GRADUATION_RULES_URL}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-primary hover:underline"
          >
            Regras IBJJF
          </a>
        </div>

        <div className="space-y-1.5 rounded-lg border border-border bg-card p-4 text-sm">
          <p>
            <span className="text-muted-foreground">Faixa/grau atual:</span>{" "}
            {currentBeltName ? (
              <BeltWithPreview
                name={currentBeltName}
                degree={currentDegree}
                className="ml-1 align-middle"
              />
            ) : (
              "Sem faixa"
            )}
          </p>
          <p>
            <span className="text-muted-foreground">
              Dias de presenca desde a ultima graduacao:
            </span>{" "}
            {attendancesSinceLastGraduation}
          </p>
          <p>
            <span className="text-muted-foreground">
              Tempo desde a ultima graduacao:
            </span>{" "}
            {formatElapsed(daysSinceLastGraduation)}
          </p>
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium">Registrar graduacao</p>

        <div className="space-y-1.5">
          <Label htmlFor="beltSystemId">Sistema de faixas</Label>
          <select
            id="beltSystemId"
            value={beltSystemId}
            onChange={(event) => {
              setBeltSystemId(event.target.value);
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
            onChange={(event) => {
              const nextBelt = belts.find((belt) => belt.id === event.target.value);
              setNewBeltId(event.target.value);
              if (nextBelt && Number(newDegree) > nextBelt.maxDegrees) {
                setNewDegree(String(nextBelt.maxDegrees));
              }
            }}
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
            max={maxDegree}
            value={newDegree}
            onChange={(event) => setNewDegree(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="graduationDate">Data</Label>
          <Input
            id="graduationDate"
            type="date"
            value={graduationDate}
            onChange={(event) => setGraduationDate(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="teacherId">Professor responsavel (opcional)</Label>
          <select
            id="teacherId"
            value={teacherId}
            onChange={(event) => setTeacherId(event.target.value)}
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
          <Label htmlFor="graduationNotes">Observacoes (opcional)</Label>
          <Input
            id="graduationNotes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>

        {selectedBelt && (
          <div className="rounded-lg border border-dashed border-border bg-background p-3 text-sm">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Previa selecionada
            </p>
            <BeltWithPreview name={selectedBelt.name} degree={Number(newDegree)} />
          </div>
        )}

          <Button
            className="w-full"
            disabled={isSubmitting || !newBeltId}
            onClick={onSubmit}
          >
            {isSubmitting ? "Salvando..." : "Registrar graduacao"}
          </Button>
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-medium">Historico de graduacoes</p>
        <div className="grid gap-3 xl:grid-cols-2">
          {history.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-border bg-background p-3 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold">
                    <BeltWithPreview
                      name={item.newBeltName}
                      degree={item.newDegree}
                    />
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Anterior: {item.previousBeltName ?? "Sem faixa"} - grau{" "}
                    {item.previousDegree}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDateOnly(item.date)}
                </p>
              </div>
              {item.teacherName && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Professor: {item.teacherName}
                </p>
              )}
              {item.notes && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {item.notes}
                </p>
              )}
            </div>
          ))}
          {!history.length && (
            <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
              Nenhuma graduacao registrada ainda.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
