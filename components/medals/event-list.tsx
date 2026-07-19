import Link from "next/link";
import { formatDateOnly } from "@/lib/dates/format";
import { StatusBadge } from "@/components/ui/status-badge";
import type { MedalEventSummary } from "@/modules/medals/events";

const STATUS_LABEL: Record<string, string> = { active: "Ativo", inactive: "Inativo" };

export function MedalEventList({
  events,
  basePath,
}: {
  events: MedalEventSummary[];
  basePath: string;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="p-3 font-medium">Evento</th>
            <th className="p-3 font-medium">Organização</th>
            <th className="p-3 font-medium">Data</th>
            <th className="p-3 font-medium">Modalidade</th>
            <th className="p-3 font-medium">Status</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id} className="border-t border-border">
              <td className="p-3">{event.name}</td>
              <td className="p-3 text-muted-foreground">{event.organization ?? "-"}</td>
              <td className="p-3">{formatDateOnly(event.eventDate)}</td>
              <td className="p-3 text-muted-foreground">{event.modalityName ?? "-"}</td>
              <td className="p-3">
                <StatusBadge value={event.status} label={STATUS_LABEL[event.status]} />
              </td>
              <td className="p-3 text-right">
                <Link
                  href={`${basePath}/${event.id}/edit`}
                  className="text-primary hover:underline"
                >
                  Editar
                </Link>
              </td>
            </tr>
          ))}
          {!events.length && (
            <tr>
              <td className="p-3 text-muted-foreground" colSpan={6}>
                Nenhum evento cadastrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
