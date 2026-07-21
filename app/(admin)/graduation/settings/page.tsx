import { requireRole } from "@/lib/permissions";
import { getBeltGraduationRequirements } from "@/modules/graduation/requirements";
import { GraduationRequirementsForm } from "./requirements-form";

export default async function GraduationSettingsPage() {
  const profile = await requireRole("admin");
  const systems = await getBeltGraduationRequirements(profile.schoolId);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 text-foreground">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Configurações de graduação</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Defina quantas aulas o aluno precisa frequentar para estar apto à
          próxima faixa. O sistema nunca gradua automaticamente — a decisão
          continua sendo do professor.
        </p>
      </div>
      {systems.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum sistema de faixas cadastrado ainda.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {systems.map((system) => (
            <GraduationRequirementsForm key={system.beltSystemId} system={system} />
          ))}
        </div>
      )}
    </div>
  );
}
