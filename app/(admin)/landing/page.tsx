import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/permissions";
import { getAdminLandingPage, getLandingAdminOptions } from "@/modules/landing/queries";
import { LandingForm } from "./landing-form";

export default async function LandingManagementPage() {
  const profile = await requireRole("admin");
  const [landing, options] = await Promise.all([
    getAdminLandingPage(),
    getLandingAdminOptions(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 text-foreground">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Gestao da Landing Page</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Configure a pagina publica institucional da academia. A estrutura segue o modelo
            editorial esportivo definido no requisito, com conteudo dinamico por escola.
          </p>
        </div>
        <Link href="/" target="_blank" className={buttonVariants({ variant: "outline" })}>
          Visualizar site
        </Link>
      </div>

      <LandingForm landing={landing} options={options} uploadSchoolId={landing.schoolId ?? profile.schoolId} />
    </div>
  );
}
