import { getStudentFinance } from "@/modules/students/finance";
import { FinanceClient } from "./finance-client";

export default async function StudentFinancePage() {
  const finance = await getStudentFinance();

  return <FinanceClient finance={finance} />;
}
