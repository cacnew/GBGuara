import { formatDateOnly } from "@/lib/dates/format";
import { MEDAL_LEVEL_LABELS } from "@/modules/medals/points";
import type { ApprovedMedalDisplay } from "@/modules/medals/history";

export function MedalsSection({ medals }: { medals: ApprovedMedalDisplay[] }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-sm">
      <h2 className="font-heading text-lg font-semibold">Medalhas</h2>
      <div className="mt-3 space-y-2">
        {medals.map((medal) => (
          <div key={medal.id} className="rounded-lg border border-border bg-background p-3">
            <p className="font-medium">{medal.eventName}</p>
            <p className="text-xs text-muted-foreground">
              {formatDateOnly(medal.eventDate)}
              {medal.organization ? ` · ${medal.organization}` : ""}
            </p>
            <p className="mt-1 text-muted-foreground">
              {MEDAL_LEVEL_LABELS[medal.level]}
              {medal.modalityName ? ` · ${medal.modalityName}` : ""}
              {medal.category ? ` · ${medal.category}` : ""}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {medal.launchedByLabel}
              {medal.reviewedByName ? ` · Aprovado por ${medal.reviewedByName}` : ""}
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
          </div>
        ))}
        {!medals.length && (
          <p className="text-muted-foreground">Nenhuma medalha aprovada ainda.</p>
        )}
      </div>
    </div>
  );
}
