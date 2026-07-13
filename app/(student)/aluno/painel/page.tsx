import { getStudentDashboard } from "@/modules/students/dashboard";
import { PainelClient } from "./painel-client";

export default async function StudentPainelPage() {
  const year = new Date().getUTCFullYear();
  const dashboard = await getStudentDashboard(year);

  return <PainelClient year={year} dashboard={dashboard} />;
}
