import { requireRole } from "@/lib/permissions";
import { getMedalPointRules } from "@/modules/medals/points";
import { MedalPointsForm } from "./points-form";

export default async function MedalPointsPage() {
  const profile = await requireRole("admin");
  const rules = await getMedalPointRules(profile.schoolId);

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="w-full max-w-sm">
        <h1 className="font-heading text-2xl font-semibold">Pontuação de medalhas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pontos default por nível, usados no ranking quando o evento não tem
          pontuação própria (professor ou admin pode sobrescrever ao criar um
          evento).
        </p>
      </div>
      <MedalPointsForm rules={rules} />
    </div>
  );
}
