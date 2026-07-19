import { cn } from "@/lib/utils";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { BeltWithPreview } from "@/components/belts/belt-preview";
import type { RankingRow } from "@/modules/medals/ranking";

export function RankingTable({
  rows,
  highlightStudentId,
}: {
  rows: RankingRow[];
  highlightStudentId?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="p-3 font-medium">#</th>
            <th className="p-3 font-medium">Aluno</th>
            <th className="p-3 font-medium">Faixa</th>
            <th className="p-3 font-medium text-right">Pontos</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.studentId}
              className={cn(
                "border-t border-border",
                row.studentId === highlightStudentId && "bg-primary/5",
              )}
            >
              <td className="p-3 font-bold text-muted-foreground">{row.position}</td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <AvatarInitials name={row.studentName} src={row.photoUrl} className="size-8" />
                  {row.studentName}
                </div>
              </td>
              <td className="p-3 text-muted-foreground">
                {row.beltName ? (
                  <BeltWithPreview name={row.beltName} degree={row.degree ?? undefined} />
                ) : (
                  "-"
                )}
              </td>
              <td className="p-3 text-right font-medium">{row.points}</td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td className="p-3 text-muted-foreground" colSpan={4}>
                Nenhum participante neste filtro.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
