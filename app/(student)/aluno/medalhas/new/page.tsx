import { BackLink } from "@/components/layout/back-link";
import { MedalLaunchForm } from "@/components/medals/medal-launch-form";
import { getMedalLaunchFormData, launchMedal } from "@/modules/medals/student-actions";

export default async function NewMedalLaunchPage() {
  const { events, modalities } = await getMedalLaunchFormData();

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-4 text-foreground md:p-6">
      <div className="flex w-full max-w-sm items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">Lançar medalha</h1>
        <BackLink href="/aluno/medalhas" />
      </div>
      <MedalLaunchForm
        basePath="/aluno/medalhas"
        events={events}
        modalities={modalities}
        onCreate={launchMedal}
      />
    </div>
  );
}
