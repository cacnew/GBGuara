import { getAcademyData } from "@/modules/students/academy";
import { AcademyClient } from "./academia-client";

export default async function StudentAcademyPage() {
  const data = await getAcademyData();

  return <AcademyClient data={data} />;
}
