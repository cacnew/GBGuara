import { getCurrentUserProfile } from "@/modules/users/queries";
import { TodaysClasses } from "@/components/classes/todays-classes";

export default async function TeacherDashboardPage() {
  const profile = await getCurrentUserProfile();

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 text-foreground">
      <div>
        <h1 className="font-heading text-2xl font-semibold">
          Dashboard do professor
        </h1>
        <p className="text-muted-foreground">
          Olá, {profile?.name}. Indicadores completos chegam na Fase 7.
        </p>
      </div>
      <h2 className="font-heading text-lg font-semibold">Turmas do dia</h2>
      <TodaysClasses />
    </div>
  );
}
