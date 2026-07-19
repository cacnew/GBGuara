import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateOnly } from "@/lib/dates/format";
import { MEDAL_LEVEL_LABELS } from "@/modules/medals/points";
import { MEDAL_STATUS_LABELS } from "@/modules/medals/constants";
import { getMyMedals } from "@/modules/medals/student-actions";

export default async function MyMedalsPage() {
  const medals = await getMyMedals();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 text-foreground md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">Minhas medalhas</h1>
        <Link href="/aluno/medalhas/new" className={buttonVariants({ size: "sm" })}>
          Lançar medalha
        </Link>
      </div>

      <div className="space-y-2">
        {medals.map((medal) => (
          <div key={medal.id} className="rounded-lg border border-border bg-card p-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{medal.eventName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateOnly(medal.eventDate)}
                  {medal.organization ? ` · ${medal.organization}` : ""}
                </p>
              </div>
              <StatusBadge value={medal.status} label={MEDAL_STATUS_LABELS[medal.status]} />
            </div>
            <p className="mt-2 text-muted-foreground">
              {MEDAL_LEVEL_LABELS[medal.level]}
              {medal.modalityName ? ` · ${medal.modalityName}` : ""}
              {medal.category ? ` · ${medal.category}` : ""}
            </p>
            {medal.status === "rejected" && medal.rejectionReason && (
              <p className="mt-2 rounded-lg bg-destructive/10 p-2 text-destructive">
                Motivo da rejeição: {medal.rejectionReason}
              </p>
            )}
            {medal.status !== "approved" && (
              <Link
                href={`/aluno/medalhas/${medal.id}/edit`}
                className="mt-2 inline-block text-primary hover:underline"
              >
                Editar {medal.status === "rejected" ? "e reenviar" : ""}
              </Link>
            )}
          </div>
        ))}
        {!medals.length && (
          <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
            Nenhuma medalha lançada ainda.
          </p>
        )}
      </div>
    </div>
  );
}
