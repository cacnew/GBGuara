import Link from "next/link";
import { formatDateOnly } from "@/lib/dates/format";
import { StatusBadge } from "@/components/ui/status-badge";
import type { WeeklyPositionSummary } from "@/modules/weekly-positions/positions";

export function WeeklyPositionList({
  positions,
  basePath,
}: {
  positions: WeeklyPositionSummary[];
  basePath: string;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="p-3 font-medium">Título</th>
            <th className="p-3 font-medium">Vigência</th>
            <th className="p-3 font-medium">Autor</th>
            <th className="p-3 font-medium">Status</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {positions.map((position) => (
            <tr key={position.id} className="border-t border-border">
              <td className="p-3">{position.title}</td>
              <td className="p-3 text-muted-foreground">
                {formatDateOnly(position.startDate)}
                {position.endDate ? ` até ${formatDateOnly(position.endDate)}` : " sem data final"}
              </td>
              <td className="p-3 text-muted-foreground">{position.authorName ?? "-"}</td>
              <td className="p-3">
                <StatusBadge
                  value={position.published ? "active" : "inactive"}
                  label={position.published ? "Publicada" : "Rascunho"}
                />
              </td>
              <td className="p-3 text-right">
                <Link
                  href={`${basePath}/${position.id}/edit`}
                  className="text-primary hover:underline"
                >
                  Editar
                </Link>
              </td>
            </tr>
          ))}
          {!positions.length && (
            <tr>
              <td className="p-3 text-muted-foreground" colSpan={5}>
                Nenhuma posição da semana cadastrada.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
