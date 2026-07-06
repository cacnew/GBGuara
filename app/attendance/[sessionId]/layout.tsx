import { requireUser } from "@/lib/permissions";
import { AppShell } from "@/components/layout/app-shell";

export default async function AttendanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireUser();

  return (
    <AppShell role={profile.role} userName={profile.name}>
      {children}
    </AppShell>
  );
}
