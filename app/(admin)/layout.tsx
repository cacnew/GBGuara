import { requireRole } from "@/lib/permissions";
import { AppShell } from "@/components/layout/app-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("admin");

  return (
    <AppShell role="admin" userName={profile.name}>
      {children}
    </AppShell>
  );
}
