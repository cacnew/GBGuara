import { requireRole } from "@/lib/permissions";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("teacher");

  return <>{children}</>;
}
