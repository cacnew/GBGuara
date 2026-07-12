import { requireStudent } from "@/lib/permissions";
import { AppShell } from "@/components/layout/app-shell";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireStudent();

  return (
    <AppShell role="student" userName={profile.name}>
      {children}
    </AppShell>
  );
}
