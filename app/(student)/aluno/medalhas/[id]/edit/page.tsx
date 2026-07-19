import { notFound } from "next/navigation";
import { BackLink } from "@/components/layout/back-link";
import { MedalLaunchForm } from "@/components/medals/medal-launch-form";
import {
  getMedalLaunchFormData,
  getMyMedalForEdit,
  updateMyMedal,
} from "@/modules/medals/student-actions";

export default async function EditMedalLaunchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [medal, { events, modalities }] = await Promise.all([
    getMyMedalForEdit(id),
    getMedalLaunchFormData(),
  ]);

  if (!medal) notFound();

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-4 text-foreground md:p-6">
      <div className="flex w-full max-w-sm items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">Editar lançamento</h1>
        <BackLink href="/aluno/medalhas" />
      </div>
      <MedalLaunchForm
        id={id}
        basePath="/aluno/medalhas"
        events={events}
        modalities={modalities}
        defaultValues={{
          eventId: medal.eventId,
          modalityId: medal.modalityId ?? "",
          category: medal.category ?? "",
          level: medal.level,
          proofUrl: medal.proofUrl ?? "",
        }}
        onUpdate={updateMyMedal}
        submitLabel="Salvar e reenviar para análise"
      />
    </div>
  );
}
