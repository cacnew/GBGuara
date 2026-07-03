import { getCurrentUserProfile } from "@/modules/users/queries";

export default async function TeacherDashboardPage() {
  const profile = await getCurrentUserProfile();

  return (
    <div className="flex flex-1 flex-col gap-2 p-6 text-foreground">
      <h1 className="font-heading text-2xl font-semibold">
        Dashboard do professor
      </h1>
      <p className="text-muted-foreground">
        Olá, {profile?.name}. Conteúdo completo chega na Fase 7.
      </p>
    </div>
  );
}
