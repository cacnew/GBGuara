"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDateOnly } from "@/lib/dates/format";
import { MEDAL_LEVEL_LABELS } from "@/modules/medals/points-rules";
import { approveMedal, rejectMedal, type PendingMedal } from "@/modules/medals/approvals";

export function ApprovalQueue({ medals }: { medals: PendingMedal[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return medals;
    return medals.filter((medal) => medal.studentName.toLowerCase().includes(term));
  }, [medals, search]);

  async function handleApprove(id: string) {
    setBusyId(id);
    const result = await approveMedal(id);
    setBusyId(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Medalha aprovada.");
    router.refresh();
  }

  async function handleReject() {
    if (!rejectingId) return;
    setBusyId(rejectingId);
    const result = await rejectMedal(rejectingId, reason);
    setBusyId(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Lançamento rejeitado.");
    setRejectingId(null);
    setReason("");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="Buscar por aluno..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="max-w-sm"
      />

      <div className="space-y-2">
        {filtered.map((medal) => (
          <div key={medal.id} className="rounded-lg border border-border bg-card p-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{medal.studentName}</p>
                <p className="text-xs text-muted-foreground">
                  {medal.eventName} · {formatDateOnly(medal.eventDate)}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {medal.submittedByStudent ? "Lançado pelo aluno" : "Lançado pela equipe"}
              </span>
            </div>
            <p className="mt-2 text-muted-foreground">
              {MEDAL_LEVEL_LABELS[medal.level]}
              {medal.modalityName ? ` · ${medal.modalityName}` : ""}
              {medal.category ? ` · ${medal.category}` : ""}
            </p>
            {medal.proofUrl && (
              <a
                href={medal.proofUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-primary hover:underline"
              >
                Ver comprovante
              </a>
            )}
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                disabled={busyId === medal.id}
                onClick={() => handleApprove(medal.id)}
              >
                Aprovar
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busyId === medal.id}
                onClick={() => setRejectingId(medal.id)}
              >
                Rejeitar
              </Button>
            </div>
          </div>
        ))}
        {!filtered.length && (
          <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
            Nenhum lançamento pendente.
          </p>
        )}
      </div>

      <ConfirmDialog
        open={rejectingId !== null}
        title="Rejeitar lançamento"
        confirmLabel="Rejeitar"
        isConfirming={busyId === rejectingId}
        onConfirm={handleReject}
        onCancel={() => {
          setRejectingId(null);
          setReason("");
        }}
      >
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Motivo da rejeição (obrigatório)"
          rows={3}
          className="w-full rounded-lg border border-border bg-background p-2.5 text-sm"
        />
      </ConfirmDialog>
    </div>
  );
}
