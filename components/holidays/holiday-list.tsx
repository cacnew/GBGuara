"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDateOnly } from "@/lib/dates/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteHoliday } from "@/modules/holidays/holidays";
import type { HolidaySummary } from "@/modules/holidays/holidays";

export function HolidayList({ holidays }: { holidays: HolidaySummary[] }) {
  const router = useRouter();
  const [pendingDelete, setPendingDelete] = useState<HolidaySummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    const result = await deleteHoliday(pendingDelete.id);
    setIsDeleting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Feriado removido.");
    setPendingDelete(null);
    router.refresh();
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Data</th>
              <th className="p-3 font-medium">Nome</th>
              <th className="p-3 font-medium">Recorrente</th>
              <th className="p-3 font-medium">Haverá aula</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {holidays.map((holiday) => (
              <tr key={holiday.id} className="border-t border-border">
                <td className="p-3 whitespace-nowrap">{formatDateOnly(holiday.date)}</td>
                <td className="p-3">{holiday.name}</td>
                <td className="p-3 text-muted-foreground">
                  {holiday.recurring ? "Sim" : "Não"}
                </td>
                <td className="p-3">
                  <StatusBadge
                    value={holiday.hasClass ? "active" : "inactive"}
                    label={holiday.hasClass ? "Sim" : "Não"}
                  />
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <Link
                    href={`/calendar/holidays/${holiday.id}/edit`}
                    className="text-primary hover:underline"
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    className="ml-4 text-destructive hover:underline"
                    onClick={() => setPendingDelete(holiday)}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {!holidays.length && (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={5}>
                  Nenhum feriado cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Excluir feriado?"
        description={
          pendingDelete ? (
            <>
              Isso vai remover <strong>{pendingDelete.name}</strong> (
              {formatDateOnly(pendingDelete.date)}) permanentemente.
            </>
          ) : null
        }
        confirmLabel="Excluir"
        isConfirming={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
