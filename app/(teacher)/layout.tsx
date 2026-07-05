import { requireRole } from "@/lib/permissions";
import { AppShell } from "@/components/layout/app-shell";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("teacher");

  return (
    <AppShell role="teacher" userName={profile.name}>
      {children}
    </AppShell>
  );
}
